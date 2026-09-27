import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import mod from '../../dist/index.js'

const resolvePath = mod.default

// Regression: the traversal stripped a trailing ']' from bracket syntax but the returned
// fieldName did not, so reads through foo[2] worked while set() and delete() addressed a
// property literally named '2]'. set() left the array untouched and added a stray key.
describe('bracket notation mutates the element it read', () => {
  it('reports the index without the bracket', () => {
    const state = { list: ['zero', 'one', 'two'] }
    const info = resolvePath(state, 'list[1]')
    assert.strictEqual(info.field, 'one')
    assert.strictEqual(info.fieldName, '1')
    assert.deepStrictEqual(info.fieldNames, ['list', '1'])
  })

  it('set() writes to the element and creates no stray key', () => {
    const state = { list: ['zero', 'one', 'two'] }
    resolvePath(state, 'list[1]').set('CHANGED')
    assert.deepStrictEqual(state.list, ['zero', 'CHANGED', 'two'])
    assert.deepStrictEqual(Object.keys(state.list), ['0', '1', '2'])
  })

  it('delete() splices the element', () => {
    const state = { list: ['zero', 'one', 'two'] }
    resolvePath(state, 'list[1]').delete()
    assert.deepStrictEqual(state.list, ['zero', 'two'])
  })

  it('bracket and dot syntax agree', () => {
    const a = { list: ['x', 'y'] }
    const b = { list: ['x', 'y'] }
    resolvePath(a, 'list[1]').set('z')
    resolvePath(b, 'list.1').set('z')
    assert.deepStrictEqual(a, b)
  })
})
