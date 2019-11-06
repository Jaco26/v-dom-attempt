
class JacobElementNodeList {
  constructor() {
    this.nodes = []
  }
  push(node) {
    this.nodes.push(node)
  }
}


class JacobElement {
  constructor(tagName) {
    /** @type {HTMLElement} */
    this.el = document.createElement(tagName)
    this.id = null
    this.children = new JacobElementNodeList()
    this.listeners = {}
  }
  on(event, listener) {
    if (this.listeners[event]) {
      this.off(event)
    }
    this.el.addEventListener(event, listener)
    this.listeners[event] = listener
    return this
  }
  off(event) {
    if (this.listeners[event]) {
      this.el.removeEventListener(event, this.listeners[event])
      this.listeners[event] = null
    }
    return this
  }
  emit(event, payload) {
    if (this.listeners[event]) {
      this.listeners[event](payload)
    }
    return this
  }
}



export function $(tag, ...children) {
  const tagName = tag.slice(0, tag.indexOf(' '))
  const tagAttrs = tag.match(/\w+="[\w-.?!\s]+"|\w+=\w+/g);

  const rv = new JacobElement(tagName)

  tagAttrs.forEach(attr => {
    let [key, val] = attr.split('=')
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1)
    }
    if (key === 'id') {
      rv.id = val
    }
    rv.el.setAttribute(key, val)
  })

  children.forEach(child => {
    if (typeof child === 'string') {
      rv.el.append(child)
    } else if (child instanceof JacobElement) {
      rv.el.appendChild(child.el)
    } else if (child instanceof HTMLElement) {
      rv.el.appendChild(child)
    }
    rv.children.push(child)
  })

  return rv
}


