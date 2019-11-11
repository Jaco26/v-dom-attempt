import compileTemplate, { ElementNode, ExpressionNode, TextNode } from './template-compiler.js'
import { createElement } from './create-element.js'
import { wrapData, watcher } from './reactive.js'

export class Component {
  constructor({ parent, template, data }) {
    this.parent = parent
    this.data = wrapData(data)
    this.nodes = compileTemplate(template)
  }

  render() {
    if (this.parent) {
      const recursiveRender = node => {
        if (node instanceof ElementNode) {
          node.children.forEach(child => {
            node.domNode.append(recursiveRender(child))
          })
          return node.domNode
        } else if (node instanceof ExpressionNode) {
          watcher(() => node.evaluate(this.data))
          return node.domNode
        } else if (node instanceof TextNode) {
          return node.value
        }
      }
      this.parent.innerHTML = ''
      this.parent.appendChild(recursiveRender(this.nodes.root))
    }
  }
}
