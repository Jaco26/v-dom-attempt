import { Component } from './lib.js'

const root = new Component({
  parent: document.querySelector('#app'),
  template: `
  <div>
    <h4 class=hihi id=who data-name-id=noom>
      {{this.name + 8 }} how are you {{this.name + 33}} whooo
    </h4>

    <p data-hello=jacob>How are you doing?</p>

    <input type=text />

    <div>
      <div>
        <ul>
          <li>Hello</li>
          <li>
            You
            <p>Hloo yoo</p>
          </li>
        </ul>
      </div>

      <p class=new-boy>This is a child of the div </p>

    </div>
   
    <input type=number placeholder="do this you dummy" />

  </div>`,
  data: {
    name: 'Jacob'
  }
})

window.root = root
root.render()

console.log(root)

