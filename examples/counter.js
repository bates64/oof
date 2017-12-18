'use strict'

class Counter extends oof.El {
  init({ startingCount = 0, changeBy = +1 }) {
    this.count = new oof.Value(startingCount)

    this.interval = setInterval(() => {
      
      // Every second, update the count
      this.count.set(this.count.value + changeBy)

    }, 1000)

    return [ this.count ]
  }

  render(count) {
    const text = document.createTextNode(`Count: ${count}`)
    const span = document.createElement('span')

    span.appendChild(text)

    // On click, reset count back to zero.
    span.addEventListener('click', () => {
      this.count.set(0)
    })

    return span
  }

  destroy() {
    // Clean up
    clearInterval(this.interval)
  }
}

const myCounter = new Counter('#my-counter', { changeBy: +1 })

myCounter.count.on('change', count => {
  console.log(count)
})
