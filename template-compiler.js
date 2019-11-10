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
    const rv = this._evaluator.call(data)
    this.domNode.textContent = rv
    return rv
  }
}

function tokenizeTemplate(template) {
  const tagRe = /<\/?[\w\s-"=]*\/?>/
  const tagNameRe = /<\/?[\w-]+/g
  const tagAttrsRe = /[\w-]+="[\w-\s]+"|[\w-]+=[\w-]+/g
 

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

    } else { // text node

      return { kind: 'text', content: node }
    }
  })
}

function buildVDomTree(tags) {
  const batCaveRe = /{{.+?}}/g

  const stack = []

  const makeNode = ({ tagName, tagAttrs }) => ({
    tagName,
    tagAttrs, 
    children: [],
  })

  for (let i = 0; i < tags.length; i++) {
    let { kind, tagName, tagAttrs, content } = tags[i]

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

      const batCaveMatches = content.match(batCaveRe)
      if (batCaveMatches) {
        const nodeChildren = []
        batCaveMatches.forEach(bc => {
          const priorText = content.slice(0, content.indexOf(bc))
          if (priorText) {
            nodeChildren.push(priorText)
          }
          const expNode = new ExpressionNode(bc.slice(2, -2))
          nodeChildren.push(expNode)
          content = content.replace(priorText + bc, '')
        })
        if (content) {
          nodeChildren.push(content)
        }
        stack[stack.length - 1].children.push(...nodeChildren)
      } else {
        stack[stack.length - 1].children.push(content)
      }

    }
  }
}



export default function compileTemplate(template) {
  const flatNodes = tokenizeTemplate(template)
  const nodeTree = buildVDomTree(flatNodes)
  return nodeTree
}