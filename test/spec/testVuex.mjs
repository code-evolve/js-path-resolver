import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mutations, getters } from '../../dist/vuex.mjs'

// Regression: this module's `import Vue from 'vue'` had been commented out while three
// Vue.set calls remained, so Vue was an undefined free variable and mutations['path.set']
// threw ReferenceError on first use. It was never published, so nobody hit it.
describe('vuex mutations (Vue 2)', () => {
  it('path.set assigns to an existing property', () => {
    const state = { list: ['a', 'b'] }
    mutations['path.set'](state, { path: 'list.0', value: 'Z' })
    assert.deepStrictEqual(state.list, ['Z', 'b'])
  })

  it('path.set adds a property that did not exist', () => {
    // This is the line that needs Vue.set under Vue 2, and the one that threw.
    const state = { obj: {} }
    mutations['path.set'](state, { path: 'obj.brandNew', value: 42 })
    assert.strictEqual(state.obj.brandNew, 42)
  })

  it('path.set reaches through bracket notation, which used to corrupt the object', () => {
    const state = { list: ['a', 'b', 'c'] }
    mutations['path.set'](state, { path: 'list[1]', value: 'B' })
    assert.deepStrictEqual(state.list, ['a', 'B', 'c'])
    assert.deepStrictEqual(Object.keys(state.list), ['0', '1', '2'])
  })

  it('path.list.remove removes by value', () => {
    const state = { list: ['a', 'b', 'c'] }
    mutations['path.list.remove'](state, { path: 'list', value: 'b' })
    assert.deepStrictEqual(state.list, ['a', 'c'])
  })

  it('exports getters as well as mutations', () => {
    assert.strictEqual(typeof getters, 'object')
  })
})

// Regression: path.clear tested `found.field instanceof String`, which is false for every
// string primitive, so a string fell to the error branch -- which referenced an undeclared
// `it` and threw ReferenceError rather than logging.
describe('vuex path.clear', () => {
  it('clears a string to the empty string', () => {
    const state = { name: 'hello' }
    mutations['path.clear'](state, { path: 'name' })
    assert.strictEqual(state.name, '')
  })

  it('clears an array to empty', () => {
    const state = { list: ['a', 'b'] }
    mutations['path.clear'](state, { path: 'list' })
    assert.deepStrictEqual(state.list, [])
  })

  it('reports an unsupported type instead of throwing', () => {
    const state = { n: 5 }
    const errors = []
    const realError = console.error
    console.error = (m) => errors.push(m)
    try {
      mutations['path.clear'](state, { path: 'n' })
    } finally {
      console.error = realError
    }
    assert.strictEqual(state.n, 5)
    assert.strictEqual(errors.length, 1)
    assert.match(errors[0], /path\.clear does not support the type at n/)
  })
})

describe('vuex path.list.move', () => {
  it('moves forward by a positive amount', () => {
    const state = { list: ['a', 'b', 'c', 'd'] }
    mutations['path.list.move'](state, { path: 'list', item: 'b', amount: 1 })
    assert.deepStrictEqual(state.list, ['a', 'c', 'b', 'd'])
  })

  it('moves backward by a negative amount', () => {
    const state = { list: ['a', 'b', 'c', 'd'] }
    mutations['path.list.move'](state, { path: 'list', item: 'c', amount: -1 })
    assert.deepStrictEqual(state.list, ['a', 'c', 'b', 'd'])
  })

  it('moves to first, last, before and after', () => {
    const first = { list: ['a', 'b', 'c'] }
    mutations['path.list.move'](first, { path: 'list', item: 'c', index: 'first' })
    assert.deepStrictEqual(first.list, ['c', 'a', 'b'])

    const last = { list: ['a', 'b', 'c'] }
    mutations['path.list.move'](last, { path: 'list', item: 'a', index: 'last' })
    assert.deepStrictEqual(last.list, ['b', 'c', 'a'])

    const before = { list: ['a', 'b', 'c'] }
    mutations['path.list.move'](before, { path: 'list', item: 'c', index: 'before', ref: 'b' })
    assert.deepStrictEqual(before.list, ['a', 'c', 'b'])

    const after = { list: ['a', 'b', 'c'] }
    mutations['path.list.move'](after, { path: 'list', item: 'a', index: 'after', ref: 'b' })
    assert.deepStrictEqual(after.list, ['b', 'a', 'c'])
  })
})
