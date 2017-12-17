'use strict'

class List extends oof.El {
  init({ startingCount = 0, changeBy = +1 }) {
    const items = new oof.Value([])

    this.interval = setInterval(() => {
      
      // Every 2s, add a new element
      items.set([ ...items.value, items.value.length ])

    }, 2000)

    return [ items ]
  }

  render(items) {
    const list = document.createElement('ul')

    for (const item of items) {
      const li = document.createElement('li')

      li.appendChild(document.createTextNode(item))

      list.appendChild(li)
    }

    return list
  }
}

new List('.list')
