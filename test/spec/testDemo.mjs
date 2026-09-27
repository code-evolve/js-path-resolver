import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import mod from '../../dist/index.js'

const resolver = mod.default

describe('Demo', () => {
  it('can run the demo', () => {
    const state = {
      lists: {
        todo: [
          { caption: 'wake up', completed: true },
          { caption: 'eat', completed: false },
        ],
      },
    }

    const info1 = resolver(state, 'lists.todo.1')
    assert.deepStrictEqual(info1.get(), { caption: 'eat', completed: false })

    const info2 = resolver(state, 'lists.todo.1.completed')
    assert.strictEqual(info2.get(), false)
  })
})
