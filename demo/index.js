const resolver = require('js-path-resolver').default;

const state = {
  lists: {
    todo: [
      {caption: 'wake up', completed: true},
      {caption: 'eat', completed: false},
    ]
  }
}

const info1 = resolver(state, 'lists.todo.1')
console.log('The value is ' + JSON.stringify(info1.get(), null, 2))

const info2 = resolver(state, 'lists.todo.1.completed')
console.log('The value is ' + info2.get())