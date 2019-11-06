function tokenizeTemplate(template) {
  const tagRe = /<\/?[\w\s-"=]*\/?>/
  const tagNameRe = /<\/?[\w-]+/g
  const tagAttrsRe = /\w+="[\w-\s]+"|\w+=[\w-]+/g

  const rawNodes = []

  while (true) {
    const match = template.match(tagRe)
    if (match) {
      const tag = match[0]
      template = template.replace(tag, '')
      const text = template.slice(match.index, template.indexOf('<')).trim()
      rawNodes.push(tag)
      if (!!text) rawNodes.push(text)
    } else {
      break
    }
  }

  return rawNodes.map(node => {
    if (node.startsWith('<')) {
      const tagName = node.match(tagNameRe)[0].replace(/<|\//g, '')
      const tagAttrsMatch = node.match(tagAttrsRe) || []
      const tagAttrs = tagAttrsMatch.reduce((acc, b) => {
        let [key, val] = b.split('=')
        if (/^".*"?/.test(val)) {
          val = val.slice(1, -1)
        }
        acc[key] = val;
        return acc
      }, {})
      
      let kind;

      if (node.startsWith('</')) {
        kind = 'closing'
      } else if (node.endsWith('/>')) {
        kind = 'selfClosing'
      } else {
        kind = 'opening'
      }

      return { kind, tagName, tagAttrs }
    } else {
      return { kind: 'text', content: node }
    }
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
    const { kind, tagName, tagAttrs, content } = tags[i]

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

    } else if (kind === 'text') {

      stack[stack.length - 1].children.push(content)
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
    const flatNodes = tokenizeTemplate(template)
    const tree = buildVDomTree(flatNodes)
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