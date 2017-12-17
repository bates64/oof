<h1 align='center'> 😤 oof </h1>

<div align='center'>
  <strong> Tiny framework for creating frontend components </strong>
</div>

<div align='center'>
  <h3>
    <a href='#using-oof'> Usage </a>
    <span> | </span>
    <a href='https://github.com/heyitsmeuralex/oof/wiki'> Documentation </a>
  </h3>
</div>

oof is a tiny, simple, reactive UI framework for JavaScript.

### What does it look like?

```js
class Countdown extends oof.El {
  init() {
    this.count = new oof.Value(10) // Observable value

    const interval = setInterval(() => {
      
      // Every second, update the count
      this.count.set(this.count.value - 1)

      // Count down to 0
      if (this.count.value === 0) {
        this.count.set('Liftoff!')
        clearInterval(interval)
      }

    }, 1000)

    return [ this.count ]
  }

  render(count) {
    const span = document.createElement('span')

    span.appendChild(document.createTextNode(count)

    return span
  }

  destroy() {
    clearInterval(this.interval)
  }
}

// 10, 9, 8, 7...
new Countdown('#my-countdown')
```

### Using oof

Simply include [oof.js](oof.js) in your page. You may want to include more - see [tradeoffs](#tradeoffs).

```html
<script src='oof.js'></script>
```

You can find documentation [on the wiki](https://github.com/heyitsmeuralex/oof/wiki).

### Tradeoffs

oof is small. This means it doesn't have features that you might want, so oof allows you to optionally include
extra libraries in your page, and it will use them.

#### morphdom

If you want to tradeoff **size for speed**, include [morphdom](https://raw.githubusercontent.com/patrick-steele-idem/morphdom/master/dist/morphdom-umd.min.js) in your page, too. oof will then smartly
morph elements rather than re-rendering the entire thing when state changes.

See the [morphdom example](examples/morphdom.html).

#### bel

It is recommended that you use something like [bel](https://github.com/shama/bel#bel) to template
your components. **Note: bel requires the use of browserify**.

```js
const bel = require('bel')

class Component extends oof.El {
  // ...

  render(name) {
    return bel`<div>
      Hi ${name}!
    </div>`
  }
}
```

### Why should I use oof?

I don't know - it was quickly made for [bantisocial](https://github.com/towerofnix/bantisocial) after we realised
that we should probably roll our own UI framework 😤
