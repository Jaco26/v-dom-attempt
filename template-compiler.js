// const tagRe = /<\/?[\w\s-"=]*\/?>/g
const tagRe = /<\/?[\w\s-"'={}\[\]().]*\/?>/g
const tagNameRe = /<\/?[\w-]+/g
const tagAttrsRe = /[\w-]+="[\w-\s]+"|[\w-]+=[\w-]+/g
const tagDirectivesRe = /j-(if|else|for)(={.*})?/g
const batCaveRe = /{{.+?}}/g

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

  // parse raw tag name, attrs and directives
  if (tag.startsWith('</')) {
    rv.kind = 'closing'
  } else if (tag.endsWith('/>')) {
    rv.kind = 'selfClosing'
  } else {
    rv.kind = 'opening'
  }

  if (rv.kind === 'opening' || rv.kind === 'selfClosing') {
    const directivesMatch = tag.match(tagDirectivesRe)
    if (directivesMatch) {
      rv.directives = directivesMatch.reduce((acc, directive) => {
        let [key, val] = directive.split('=')
        if (val) {
          val = val.slice(1, -1)
        }
        acc[key] = val || ''
        return acc
      }, {})
    }
    
    const attrsMatch = tag.match(tagAttrsRe)
    if (attrsMatch) {
      rv.attrs = attrsMatch.reduce((acc, attr) => {
        let [key, val] = attr.split('=')
        if (/^".*"$/.test(val)) {
          val = val.slice(1, -1)
        }
        acc[key] = val
        return acc
      }, {})
    }
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

function buildNodeTree(tags) {
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

        return item // BASE CASE

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
  console.log(template)
  const flatNodes = tokenizeTemplate(template)
  console.log(flatNodes)
  return buildNodeTree(flatNodes)
}