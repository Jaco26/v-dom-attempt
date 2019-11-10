import compileTemplate, { ExpressionNode } from './template-compiler.js'
import { createElement } from './create-element.js'
import { wrapData, watcher } from './reactive.js'

export class Component {
  constructor({ parent, template, data }) {
    this.parent = parent
    this.data = wrapData(data)
    this.nodes = compileTemplate.call(this, template)
  }

  render() {
    if (this.parent) {

      const innerRender = node => {
        const el = createElement(node)
        if (node.children) {
          node.children.forEach(childNode => {
            if (typeof childNode === 'string') {
              el.append(childNode)
            } else if (childNode instanceof ExpressionNode) {
              watcher(() => childNode.evaluate(this.data))
              el.appendChild(childNode.domNode)
            } else {
              el.appendChild(innerRender(childNode))
            }
          })
        }
        return el
      }
      this.parent.innerHTML = ''
      this.parent.appendChild(innerRender(this.nodes.root))
    }
  }
}
