import { Component } from './lib.js'

const jifTemplate = //html
`<div>
  <div j-if={this.name.toLowerCase() === 'jacob'} id=jacob>
    The name equals "Jacob"
  </div>
  <div j-else>
    The name could be "Steve"
  </div>
</div>`

const simpleTemplate = //html
`<div>
  <h3>Hello</h3> hi
  <div>
    The name equals {{this.name}}
  </div>
</div>`

const app = new Component({
  parent: document.querySelector('#app'),
  template: 1 ? jifTemplate : simpleTemplate,
  data: {
    name: 'Jacob'
  }
})

window.app = app

app.render()

console.log(app)

