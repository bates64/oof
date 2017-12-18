'use strict'

const list = oof.elList('#list', item => {
  const li = document.createElement('li')

  li.appendChild(document.createTextNode(item))

  return li
}, [ 'foo', 'bar' ])

document.getElementById('add').onclick = () => {
  const item = prompt('Item:')

  list.push(item)
}
