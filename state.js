class Changeable {
  constructor() {
    this.listeners = []
    this.value = undefined // Unset
  }

  onChange(listener) {
    this.listeners.push(listener)
  }

  set(newValue) {
    this.value = newValue
    for (const listener of this.listeners) {
      listener(newValue)
    }
  }

  static valueOf(object) {
    // If the given object is a Changeable, this gets its value.
    // Otherwise it just returns the object. This is handy when you're making
    // a function which is designed to take either an object or a Changeable.

    if (typeof object === 'object' && object instanceof Changeable) {
      return object.value
    } else {
      return object
    }
  }
}

class Value extends Changeable {
  constructor(initialValue) {
    super()

    this.set(initialValue)
  }
}

class Reference extends Changeable {
  constructor(referencedObject, key) {
    super()

    this.referencedObject = referencedObject
    this.key = key

    // The actual dictionary we're watching might change, if it's gotten from
    // the passed reference object. We need to keep track of the dictionary
    // and our "on change" listener, so that we can compare/remove them when
    // the referenced object's value changes.
    this.oldDictionary = null
    this.oldDictionaryListener = null

    if (this.referencedObject instanceof Changeable) {
      this.referencedObject.onChange(value => this.update())
    }

    if (this.key instanceof Changeable) {
      this.key.onChange(value => this.update())
    }

    this.update()
  }

  update() {
    const key = Changeable.valueOf(this.key)
    const object = Changeable.valueOf(this.referencedObject)

    if (key && object) {
      this.set(object[key])
    } else {
      this.set(null)
    }

    // Now's the time to assign the object as the "watched dictionary"
    // if it is a dictionary...

    if (object !== this.oldDictionary) {
      if (this.oldDictionaryListener) {
        this.oldDictionaryListener.remove()
      }

      if (object && object instanceof Dictionary) {
        this.oldDictionary = object
        this.oldDictionaryListener = object.onPropertyChange((key, value) => {
          if (key === Changeable.valueOf(this.key)) {
            this.update()
          }
        })
      }
    }
  }
}

class Computed extends Changeable {
  // A simple "computed" value. Computeds depend on other changeables;
  // when any of the computed's changeables change, it immediately updates
  // its value. This value is computed according to the given callback
  // function.
  //
  // Computeds work with promises. If you want to make your callback an
  // async function, it'll work just fine; the computed's value won't be
  // updated until the promise resolves.

  constructor(dependencies, fn) {
    super()

    this.dependencies = dependencies
    this.fn = fn

    for (const item of dependencies) {
      item.onChange(() => this.update())
    }

    this.update()
  }

  async update() {
    // Calls fn(a, b, c, d...) where the arguments are the values of the
    // dependencies.
    this.set(await this.fn(...this.dependencies.map(dep => dep.value)))
  }
}

class Dictionary {
  // Just like a normal object, except it emits an event whenever a property
  // is set on it.

  constructor(defaultData = {}) {
    Object.assign(this, defaultData)

    this[Dictionary.listeners] = []

    return new Proxy(this, {
      set(target, key, value) {
        Reflect.set(target, key, value)

        for (const listener of target[Dictionary.listeners]) {
          listener(key, value)
        }

        return true
      }
    })
  }

  onPropertyChange(listener) {
    this[Dictionary.listeners].push(listener)

    return {
      remove: () => {
        const listeners = this[Dictionary.listeners]
        if (listeners.includes(listener)) {
          listeners.splice(listeners.indexOf(listener), 1)
        }
      }
    }
  }
}

Dictionary.listeners = Symbol()
