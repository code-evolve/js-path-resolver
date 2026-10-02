import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import mod from '../../dist/index.js'
import esm from '../../dist/index.mjs'

const resolvePath = mod.default

// Regression: delete() spliced at Number(fieldName), and splice reads NaN as 0 and a
// negative number as an offset from the end. Deleting 'list.x' removed the first element
// and 'list.-1' the last.
describe('delete() on an array only splices a real index', () => {
  it('leaves the array alone for a name that is not an index', () => {
    const state = { list: [1, 2, 3] }
    resolvePath(state, 'list.x').delete()
    assert.deepStrictEqual(state.list, [1, 2, 3])
  })

  it('leaves the array alone for a negative index', () => {
    const state = { list: [1, 2, 3] }
    resolvePath(state, 'list.-1').delete()
    assert.deepStrictEqual(state.list, [1, 2, 3])
  })

  it('leaves the array alone for an index past the end', () => {
    const state = { list: [1, 2, 3] }
    resolvePath(state, 'list.10').delete()
    assert.deepStrictEqual(state.list, [1, 2, 3])
  })

  it('deletes a named property of an array as a property', () => {
    const list = [1, 2, 3]
    list.label = 'three'
    resolvePath({ list }, 'list.label').delete()
    assert.strictEqual('label' in list, false)
    assert.deepStrictEqual([...list], [1, 2, 3])
  })
})

describe('arguments are checked before the path is walked', () => {
  it('rejects an empty path with a message about the path', () => {
    assert.throws(() => resolvePath({ a: 1 }, ''), /path must name at least one field/)
  })

  it('rejects a path made only of separators', () => {
    assert.throws(() => resolvePath({ a: 1 }, '..'), /path must name at least one field/)
  })

  it('rejects an onError value it does not know', () => {
    assert.throws(() => resolvePath({}, 'a', { onError: 'ignore' }), TypeError)
  })

  it("accepts onError 'throw' as the default spelled out", () => {
    assert.throws(() => resolvePath({}, 'a.b', { onError: 'throw' }), /Could not resolve/)
    assert.strictEqual(resolvePath({ a: 1 }, 'a', { onError: 'throw' }).get(), 1)
  })
})

// Behaviour that worked and that nothing asserted.
describe('paths the suite did not cover', () => {
  it('resolves nested brackets', () => {
    assert.strictEqual(resolvePath({ a: [[1, 2]] }, 'a[0][1]').get(), 2)
  })

  it('resolves a bracket at the root', () => {
    assert.strictEqual(resolvePath([5], '[0]').get(), 5)
  })

  it('resolves a null leaf without throwing', () => {
    const info = resolvePath({ a: null }, 'a')
    assert.strictEqual(info.exists, true)
    assert.strictEqual(info.field, null)
  })

  it('throws walking through a null value', () => {
    assert.throws(() => resolvePath({ a: null }, 'a.b'), /Could not resolve/)
  })

  it('reports exists for a leaf that is missing from a parent that resolved', () => {
    const info = resolvePath({ a: {} }, 'a.b')
    assert.strictEqual(info.exists, true)
    assert.strictEqual(info.field, undefined)
  })

  // Regression: the CommonJS build is sloppy-mode code, where assigning a property to a
  // string does nothing, so set() returned normally having set nothing. The ESM build threw.
  it('set() on a primitive parent throws in the CommonJS build', () => {
    assert.throws(() => resolvePath({ a: 'str' }, 'a.b').set(1), /not an object/)
  })

  it('set() on a primitive parent throws in the ESM build', () => {
    assert.throws(() => esm({ a: 'str' }, 'a.b').set(1), /not an object/)
  })

  // Lenient today, and pinned so that tightening it is a decision rather than an accident.
  it('ignores a leading dot, a doubled dot and a trailing backslash', () => {
    assert.deepStrictEqual(resolvePath({ a: 1 }, '.a').fieldNames, ['a'])
    assert.deepStrictEqual(resolvePath({ a: { b: 1 } }, 'a..b').fieldNames, ['a', 'b'])
    assert.deepStrictEqual(resolvePath({ a: 1 }, 'a\\').fieldNames, ['a'])
  })
})
