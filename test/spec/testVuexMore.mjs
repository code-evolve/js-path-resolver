import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'
import { mutations } from '../../dist/vuex.mjs'

describe('vuex path.delete', () => {
  it('removes a property', () => {
    const state = { a: { b: 1, c: 2 } }
    mutations['path.delete'](state, { path: 'a.b' })
    assert.deepStrictEqual(state, { a: { c: 2 } })
  })

  it('splices an array item', () => {
    const state = { list: ['a', 'b', 'c'] }
    mutations['path.delete'](state, { path: 'list[1]' })
    assert.deepStrictEqual(state.list, ['a', 'c'])
  })
})

describe('vuex path.increment and path.decrement', () => {
  it('step by 1 with no value', () => {
    const state = { n: 5 }
    mutations['path.increment'](state, { path: 'n' })
    assert.strictEqual(state.n, 6)
    mutations['path.decrement'](state, { path: 'n' })
    assert.strictEqual(state.n, 5)
  })

  it('step by the value given', () => {
    const state = { n: 5 }
    mutations['path.increment'](state, { path: 'n', value: 10 })
    assert.strictEqual(state.n, 15)
    mutations['path.decrement'](state, { path: 'n', value: 2.5 })
    assert.strictEqual(state.n, 12.5)
  })

  it('report a field that is not a number and leave it alone', () => {
    const error = mock.method(console, 'error', () => {})
    try {
      const state = { s: '5' }
      mutations['path.increment'](state, { path: 's' })
      mutations['path.decrement'](state, { path: 'missing' })
      assert.deepStrictEqual(state, { s: '5' })
      assert.strictEqual(error.mock.callCount(), 2)
    } finally {
      error.mock.restore()
    }
  })
})

describe('vuex path.toggle, path.true and path.false', () => {
  it('toggle negates', () => {
    const state = { on: true }
    mutations['path.toggle'](state, { path: 'on' })
    assert.strictEqual(state.on, false)
    mutations['path.toggle'](state, { path: 'on' })
    assert.strictEqual(state.on, true)
  })

  it('toggle turns a missing field on', () => {
    const state = { flags: {} }
    mutations['path.toggle'](state, { path: 'flags.fresh' })
    assert.strictEqual(state.flags.fresh, true)
  })

  it('true and false set the literal', () => {
    const state = { a: 0, b: 1 }
    mutations['path.true'](state, { path: 'a' })
    mutations['path.false'](state, { path: 'b' })
    assert.deepStrictEqual(state, { a: true, b: false })
  })
})
