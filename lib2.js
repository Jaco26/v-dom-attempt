function tokenizeTemplate(template) {
  const tagRe = /<\/?[\w\s-"=]*\/?>/g
  const tagNameRe = /<\/?[\w-]+/g
  const tagAttrsRe = /\w+="[\w-\s]+"|\w+=[\w-]+/g

  return template.match(tagRe).map(tag => {
    const tagName = tag.match(tagNameRe)[0].replace(/<|\//g, '')
    const tagAttrsMatch = tag.match(tagAttrsRe) || []
    const tagAttrs = tagAttrsMatch.reduce((acc, b) => {
      let [key, val] = b.split('=')
      if (/^".*"?/.test(val)) {
        val = val.slice(1, -1)
      }
      acc[key] = val;
      return acc
    }, {})
    
    let kind;

    if (tag.startsWith('</')) {
      kind = 'closing'
    } else if (tag.endsWith('/>')) {
      kind = 'selfClosing'
    } else {
      kind = 'opening'
    }

    return { kind, tagName, tagAttrs }
  })
}

function buildVDomTree(tags) {
  const stack = []

  const makeNode = ({ tagName, tagAttrs }) => ({
    tagName,
    tagAttrs, 
    children: [],
  })

  for (let i = 0; i < tags.length; i++) {
    const { kind, tagName, tagAttrs } = tags[i]

    if (kind === 'opening') {

      const node = makeNode({ tagName, tagAttrs })

      stack.push(node)

    } else if (kind === 'closing') {

      const item = stack.pop()

      if (stack.length) {

        stack[stack.length - 1].children.push(item)

      } else {

        return { root: item }

      }

    } else if (kind === 'selfClosing') {

      const node = makeNode({ tagName, tagAttrs })

      stack[stack.length - 1].children.push(node)

    }
  }
}

export class Component {
  constructor({ template, data }) {
    this.parent = null
    this.data = this.wrapData(data)
    this.nodes = this.compileTemplate(template)

  }

  compileTemplate(template) {
    console.log(template)
    const tags = tokenizeTemplate(template)
    const tree = buildVDomTree(tags)
    return tree
  }

  wrapData(data) {
    const accum = {}
    Object.keys(data).forEach(key => {
      let internalVal = data[key]
      Object.defineProperty(accum, key, {
        get: () => internalVal,
        set: val => {
          internalVal = val
          this.updateTemplate()
        }
      })
    })
    return accum
  }

  render() {
    if (this.parent instanceof HTMLElement) {
      this.parent.innerHTML = this.template
    }
  }
}