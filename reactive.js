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
    this.subscribers.forEach(subscriber => subscriber())
  }
}

export function wrapData(data) {
  Object.keys(data).forEach(key => {
    let internalVal = data[key]
    const dep = new Dep()
    Object.defineProperty(data, key, {
      get() {
        dep.depend()
        return internalVal
      },
      set(val) {
        internalVal = val
        dep.notify()
      }
    })
  })
  return data
}

export function watcher(cb) {
  target = cb
  const rv = target()
  target = null
  return rv
}