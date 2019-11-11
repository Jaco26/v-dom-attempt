import { createElement } from './create-element.js'

const tagRe = /<\/?[\w\s-"'={}\[\]().]*\/?>/g
const tagNameRe = /<\/?[\w-]+/g
const tagAttrsRe = /[\w-]+="[\w-\s]+"|[\w-]+=[\w-]+/g
const tagDirectivesRe = /j-(if|else|for)(={.*})?/g
const batCaveRe = /{{.+?}}/g



function parseRawTextNode(text) {
  text = text.trim()

  const rv = { kind: 'text', content: [] }
  
  const batCaves = text.match(batCaveRe)
  if (batCaves) {
    batCaves.forEach(bc => {
      const priorTxt = text.slice(0, text.indexOf(bc))
      if (priorTxt) {
        rv.content.push(priorTxt)
      }
      rv.content.push([bc.slice(2, -2)])
      text = text.replace(priorTxt + bc, '')
    })
  } else {
    rv.content.push(text)
  }

  return rv
}

function parseRawTagNode(tag) {
  const rv = { 
    tagName: tag.match(tagNameRe)[0].replace(/<|\//g, ''),
    kind: '',
    directives: null,
    attrs: null
  }

  if (tag.startsWith('</')) {
    rv.kind = 'closing'
  } else if (tag.endsWith('/>')) {
    rv.kind = 'selfClosing'
  } else {
    rv.kind = 'opening'
  }

  if (rv.kind === 'opening' || rv.kind === 'selfClosing') {
    rv.directives = (tag.match(tagDirectivesRe) || []).reduce((acc, directive) => {
      let [key, val] = directive.split('=')
      if (val) {
        val = val.slice(1, -1)
      }
      acc[key.slice(2)] = val || ''
      return acc
    }, {})

    rv.attrs = (tag.match(tagAttrsRe) || []).reduce((acc, attr) => {
      let [key, val] = attr.split('=')
      if (/^".*"$/.test(val)) {
        val = val.slice(1, -1)
      }
      acc[key] = val
      return acc
    }, {})
  }

  return rv
}


function tokenizeTemplate(template) {
  return template.match(tagRe).reduce((accum, tag) => {

    let text = template.slice(0, template.indexOf(tag))
    
    if (text.trim()) {
      const textNode = parseRawTextNode(text)
      accum.push(textNode)
    }

    const tagNode = parseRawTagNode(tag)
    accum.push(tagNode)

    template = template.replace(text + tag, '')

    return accum
  }, [])
}


function buildNodeTree(nodes) {

  const extendNode = node => ({
    tagName: node.tagName,
    attrs: node.attrs,
    directives: node.directives,
    children: [],
  })

  const stack = []

  for (let i = 0; i < nodes.length; i++) {
    let node = nodes[i]

    if (node.kind === 'text') {
      stack[stack.length - 1].children.push(...node.content)
    } else if (node.kind === 'opening') {
      stack.push(extendNode(node))
    } else if (node.kind === 'selfClosing') {
      stack[stack.length - 1].children.push(extendNode(node))
    } else if (node.kind === 'closing') {
      const itemsWhichThisNodeEncloses = stack.pop()
      if (stack.length) {
        stack[stack.length - 1].children.push(itemsWhichThisNodeEncloses)
      } else {
        return { root: itemsWhichThisNodeEncloses }
      }
    }
  }
}


function parseElementNodeDirectives(directives) {
  const rules = {
    if: exprText => data => {
      const fn = new Function(`return ${exprText}`)
      return fn.call(data)
    },
  }
  return Object.keys(directives).reduce((accum, key) => {
    if (rules[key]) {
      accum[key] = rules[key](directives[key])
    }
    return accum
  }, {})
}

export class ElementNode {
  constructor(node) {
    this.domNode = createElement(node.tagName, node.attrs)
    this.directives = parseElementNodeDirectives(node.directives)
    this.children = []
  }
}


let expId = 1

export class ExpressionNode {
  constructor(exprText) {
    this.exprText = exprText
    this.domNode = document.createElement('span')
    this.domNode.dataset.expId = expId
    expId += 1

    this._evaluator = null
  }

  evaluate(data) {
    if (!this._evaluator) {
      this._evaluator = new Function(`return ${this.exprText}`)
    }
    this.domNode.textContent = this._evaluator.call(data)
  }
}


export class TextNode {
  constructor(value) {
    this.value = value
  }
}


function createVirtualDOM(node) {
  if (node.tagName) {
    const rv = new ElementNode(node)
    node.children.forEach(child => {
      rv.children.push(createVirtualDOM(child))
    })
    return rv
  } else if (typeof node === 'string') {
    return new TextNode(node)
  } else if (Array.isArray(node)) {
    return new ExpressionNode(node[0])
  }
}


export default function compileTemplate(template) {
  const flatNodes = tokenizeTemplate(template)
  const nodeTree = buildNodeTree(flatNodes)
  const vDom = createVirtualDOM(nodeTree.root)
  // console.log(vDom)
  return { root: vDom }
}