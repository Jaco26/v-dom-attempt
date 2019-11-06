import { Component } from './lib2.js'

const root = new Component({
  template: `
  <div>

    <h1>Hello {{name}}</h1>

    <p>How are you doing?</p>

    <input type=text />

    <div>
      <div>
        <ul>
          <li>Hello</li>
          <li>You</li>
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


console.log(root)