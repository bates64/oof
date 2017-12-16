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

    if (this.referencedObject instanceof Changeable) {
      this.referencedObject.onChange(value => this.update())
    }

    if (this.key instanceof Changeable) {
      this.key.onChange(value => this.update())
    }

    this.update()
  }

  update() {
    let object, key

    if (this.referencedObject) {
      if (this.referencedObject instanceof Changeable) {
        object = this.referencedObject.value
      } else {
        object = this.referencedObject
      }
    }

    if (this.key) {
      if (this.key instanceof Changeable) {
        key = this.key.value
      } else {
        key = this.key
      }
    }

    if (object && key) {
      this.set(object[key])
    } else {
      this.set(null)
    }
  }
}
