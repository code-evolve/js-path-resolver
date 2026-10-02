import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import mod from '../../dist/index.js'

const resolvePath = mod.default

describe('quoted brackets name a property exactly', () => {
  it('reads a name containing a space', () => {
    assert.strictEqual(resolvePath({ a: { 'b c': 1 } }, 'a["b c"]').get(), 1)
  })

  it('reads a name containing separators with no escaping', () => {
    const state = { a: { 'b.c[0]': 2 } }
    const info = resolvePath(state, "a['b.c[0]'].d", { onError: 'continue' })
    assert.deepStrictEqual(info.fieldNames, ['a', 'b.c[0]', 'd'])
    assert.strictEqual(resolvePath(state, "a['b.c[0]']").get(), 2)
  })

  it('accepts either quote, and an escaped quote inside', () => {
    assert.strictEqual(resolvePath({ "it's": 3 }, `["it's"]`).get(), 3)
    assert.strictEqual(resolvePath({ "it's": 3 }, `['it\\'s']`).get(), 3)
  })

  it('agrees with the escaped form', () => {
    const state = { 'mr.dot': { v: 4 } }
    assert.strictEqual(resolvePath(state, '["mr.dot"].v').get(), resolvePath(state, 'mr\\.dot.v').get())
  })

  it('set() and delete() address the same property', () => {
    const state = { a: { 'b c': 1 } }
    resolvePath(state, 'a["b c"]').set(5)
    assert.deepStrictEqual(state, { a: { 'b c': 5 } })
    resolvePath(state, 'a["b c"]').delete()
    assert.deepStrictEqual(state, { a: {} })
  })

  it('still refuses a quoted name that reaches a prototype', () => {
    assert.throws(() => resolvePath({}, '["__proto__"].x').set(1), /shared prototype/)
  })
})

describe('has says whether the field itself is present', () => {
  it('is false for a missing leaf whose parent resolved', () => {
    const info = resolvePath({ a: {} }, 'a.b')
    assert.strictEqual(info.exists, true)
    assert.strictEqual(info.has, false)
  })

  it('is true for a present leaf, even one holding undefined', () => {
    assert.strictEqual(resolvePath({ a: { b: undefined } }, 'a.b').has, true)
    assert.strictEqual(resolvePath({ a: [7] }, 'a[0]').has, true)
  })

  it('is false for an inherited property and for an index past the end', () => {
    assert.strictEqual(resolvePath({ a: {} }, 'a.toString').has, false)
    assert.strictEqual(resolvePath({ a: [7] }, 'a.3').has, false)
  })

  it('is false when the path did not resolve', () => {
    assert.strictEqual(resolvePath({}, 'a.b', { onError: 'continue' }).has, false)
  })

  it('follows set() and delete()', () => {
    const info = resolvePath({ a: {} }, 'a.b')
    info.set(1)
    assert.strictEqual(info.has, true)
    info.delete()
    assert.strictEqual(info.has, false)
  })
})

describe('create lets set() build a missing path', () => {
  it('builds nested objects', () => {
    const state = {}
    resolvePath(state, 'a.b.c', { create: true }).set(1)
    assert.deepStrictEqual(state, { a: { b: { c: 1 } } })
  })

  it('builds an array where the next field is an index', () => {
    const state = {}
    resolvePath(state, 'list[0].name', { create: true }).set('x')
    assert.deepStrictEqual(state, { list: [{ name: 'x' }] })
    assert.strictEqual(Array.isArray(state.list), true)
  })

  it('keeps what is already there', () => {
    const state = { a: { keep: true } }
    resolvePath(state, 'a.b.c', { create: true }).set(1)
    assert.deepStrictEqual(state, { a: { keep: true, b: { c: 1 } } })
  })

  it('replaces a null along the way', () => {
    const state = { a: null }
    resolvePath(state, 'a.b', { create: true }).set(1)
    assert.deepStrictEqual(state, { a: { b: 1 } })
  })

  it('changes nothing until set() is called', () => {
    const state = {}
    const info = resolvePath(state, 'a.b.c', { create: true })
    assert.strictEqual(info.exists, false)
    assert.deepStrictEqual(state, {})
    assert.throws(() => info.get())
    assert.deepStrictEqual(state, {})
  })

  it('updates the info after set()', () => {
    const state = {}
    const info = resolvePath(state, 'a.b', { create: true })
    info.set(2)
    assert.strictEqual(info.exists, true)
    assert.strictEqual(info.parent, state.a)
    assert.strictEqual(info.get(), 2)
  })

  it('will not build through a primitive', () => {
    const state = { a: 'str' }
    assert.throws(() => resolvePath(state, 'a.b.c', { create: true }).set(1), /not an object/)
    assert.deepStrictEqual(state, { a: 'str' })
  })

  it('will not build through a prototype', () => {
    assert.throws(() => resolvePath({}, 'x.__proto__.y.z', { create: true }).set(1), /shared prototype/)
    assert.strictEqual({}.y, undefined)
  })

  it('without create, a missing path still throws', () => {
    assert.throws(() => resolvePath({}, 'a.b.c'), /Could not resolve/)
  })
})
