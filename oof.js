'use strict'

// Simple wrapper around document.createElement.
const oof = (tagSpec = '', attrs = {}, children = []) => {
  const { tag, id, classes } = oof.parseTagSpec(tagSpec)

  const el = document.createElement(tag)

  if (id) {
    el.id = id
  }

  for (const className of classes) {
    el.classList.add(className)
  }

  for (const [ attr, value ] of Object.entries(attrs)) {
    el.setAttribute(attr, value)
  }

  for (const child of oof.nodeList(children)) {
    el.appendChild(child)
  }

  el.on = (event, fn) => {
    el.addEventListener(event, evt => fn(evt, el))
    return el
  }

  return el
}

// Parses a tag spec (string), returning its tag name, classes, and ID.
// Tag specs look like `tag#id.class1.class2`.
oof.parseTagSpec = tagSpec => {
  const spec = { tag: '', id: '', classes: [] }

  let state = 'tag'
  for (const char of tagSpec) {
    switch (char) {
      case '#':
        spec.id = ''
        state = 'id'
        break
      case '.':
        spec.classes.push('')
        state = 'class'
        break
      default:
        switch (state) {
          case 'tag':
            spec.tag += char
            break
          case 'id':
            spec.id += char
            break
          case 'class':
            spec.classes[spec.classes.length - 1] += char
            break
        }
    }
  }

  // Special-case for tag -- if no tag is given, assume <div>.
  if (spec.tag === '') {
    spec.tag = 'div'
  }

  return spec
}

// Creates a array of elements from an array of different types.
// Turns anything not an HTML element or oof.mutable into a text node.
// oof.mutables are rendered.
oof.nodeList = (elements, state) => {
  const list = []

  if (!Array.isArray(elements)) {
    // If we get a singular element, treat it as
    elements = [ elements ]
  }

  for (const el of elements) {
    if (el instanceof HTMLElement) {
      // Just add to the list
      list.push(el)
    } else if (el[oof.isMutable] === true) {
      // Render oof.mutable
      const mutEl = document.createElement('div')
      el.mount(mutEl)
      list.push(mutEl)
    } else {
      // Turn into text node
      list.push(document.createTextNode(el.toString()))
    }
  }

  return list
}

// Fancy, mutable elements with state. Takes a render function
// and, optionally, an initial state.
oof.mutable = (render, initialState) => {
  const mountedTo = new Set()
  let nodeTree = []

  const self = {
    state: initialState,
    [oof.isMutable]: true,

    // state = newState. For chaining.
    // Remember to call `update` afterwards!
    setState(newState) {
      self.state = newState

      // Chaining!
      return self
    },

    // Calls the new render function and updates every mounted
    // element to use the new, re-rendered node tree.
    update(reason = undefined) {
      // Re-render the node tree
      nodeTree = render(self.state, nodeTree, reason)

      // For each mounted element...
      for (const el of mountedTo) {
        // Remove all children of this element
        while (el.hasChildNodes()) {
          el.removeChild(el.lastChild)
        }

        // Add all children of the new node tree to this element
        for (const childNode of oof.nodeList(nodeTree)) {
          el.appendChild(childNode)
        }
      }

      // Chaining!
      return self
    },

    // Will render (and, in the future, update) to `selectorOrEl`.
    mount(selectorOrEl) {
      let els
      if (selectorOrEl instanceof HTMLElement) {
        els = [ selectorOrEl ]
      } else {
        els = document.querySelectorAll(selectorOrEl)
      }

      for (const el of els) {
        mountedTo.add(el)
      }

      self.update(oof.updateReasons.newMount)

      // Chaining!
      return self
    },
  }

  return self
}

// Fancy mutable list elements. Helpful as to not
// re-render the entire list on an update.
oof.mutableList = (render, initialState = [], listItemTag = '') => {
  const state = initialState
  const mounts = []

  function renderEl(itemState) {
    let el = render(itemState)

    // Render as text.
    if (typeof el === 'string' || typeof el === 'number') {
      return document.createTextNode(el)
    }

    // Wrap multiple elements in a `listItemTag` element.
    if (Array.isArray(el) || typeof el !== 'object') {
      const li = oof(listItemTag)

      for (const node of oof.nodeList(el)) {
        li.appendChild(node)
      }

      return li
    }

    // If it's an oof.mutable, mount it.
    //
    // Slight problem here: we will *always* use <listItemTag> as a
    //                      wrapper, even if we don't need to.
    if (el[oof.isMutable] === true) {
      const li = oof(listItemTag)
      el.mount(li)

      return li
    }

    return el
  }

  // Array-like list wrapper, plus mount function.
  const self = {
    [oof.isMutable]: true,

    // Like Array#push.
    append(item) {
      state.push(item)

      const itemEl = renderEl(item)

      for (const mount of mounts) {
        mount.el.appendChild(itemEl)
        mount.nodes.push(itemEl)
      }
    },

    // Like Array#unshift.
    prepend(item) {
      state.unshift(item)

      const itemEl = renderEl(item)

      for (const mount of mounts) {
        // HTMLElement#prepend exists, but it's kinda unstable, and
        // it's decently easy to do this anyway.
        if (mount.el.firstChild) {
          mount.el.insertBefore(itemEl, mount.el.firstChild)
        } else {
          mount.el.appendChild(itemEl)
        }

        mount.nodes.unshift(itemEl)
      }
    },

    // Returns the itemState used for a particular item.
    get(index) {
      return state[index]
    },

    // Sets the itemState used for a particular item, and re-renders it.
    set(index, newState) {
      state[index] = newState

      const itemEl = renderEl(newState)

      for (const mount of mounts) {
        mount.el.replaceChild(itemEl, mount.nodes[index])
        mount.nodes[index] = itemEl
      }

      // Chaining!
      return self
    },

    // Will render (and, in the future, update) to `selectorOrEl`.
    mount(selectorOrEl) {
      let els
      if (selectorOrEl instanceof HTMLElement) {
        els = [ selectorOrEl ]
      } else {
        els = document.querySelectorAll(selectorOrEl)
      }

      for (const el of els) {
        // Note this code is slightly different to that used in oof.mutable#mount.
        const nodes = self.renderWhole(el)
        mounts.push({ el, nodes })
      }

      // Chaining!
      return self
    },

    // Renders the entire list to HTMLElement `to`, ONCE.
    // You probably won't need this - it's mainly for internal use.
    //
    // Does *not* chain - returns an array of rendered child nodes.
    renderWhole(to) {
      const nodes = []

      for (const item of state) {
        const el = renderEl(item)

        to.appendChild(el)
        nodes.push(el)
      }

      return nodes
    },
  }

  return self
}

oof.updateReasons = {
  newMount: Symbol('new mount'),
}

oof.isMutable = Symbol('is oof.mutable')
