let target

class Dep {
  constructor() {
    this.subscribers = []
  }
  depend() {
    if (target && !this.subscribers.includes(target)) {
      this.subscribers.push(target)
    }
  }
  notify() {
    this.subscribers.forEach(sub => sub())
  }
}

function wrapData(data) {
  Object.keys(data).forEach(key => {
    let internalValue = data[key]
    const dep = new Dep()
    Object.defineProperty(data, key, {
      get() {
        dep.depend()
        return internalValue
      },
      set(newVal) {
        internalValue = newVal
        dep.notify()
      }
    })
  })
  return data
}

function watcher(callback) {
  target = callback.bind(this)
  const rv = target()
  target = null
  return rv
}

export class Component {
  constructor({ el, data, render, methods }) {
    this.parent = document.querySelector(el)
    this.data = wrapData(data)
    this.methods = Object.keys(methods || {})
      .reduce((acc, key) => ({ 
        ...acc, 
        [key]: methods[key].bind(this) 
      }), {})
    
    watcher(() => {
      if (this.parent) {
        this.parent.innerHTML = ''
        this.parent.appendChild(render.call(this).el)
      }
    })
  }
}