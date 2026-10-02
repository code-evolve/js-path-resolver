import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import mod from '../../dist/index.js'
import { mutations } from '../../dist/vuex.mjs'

const resolvePath = mod.default

// Regression: resolver({}, '__proto__.x').set(1) assigned to Object.prototype, so every
// object in the process gained x. A path that came from outside input could do that.
describe('writes through a shared prototype are refused', () => {
  for (const path of ['__proto__.polluted', 'constructor.prototype.polluted', 'a.__proto__.polluted']) {
    it(`set() refuses ${path}`, () => {
      const state = { a: {} }
      assert.throws(() => resolvePath(state, path).set('yes'), /shared prototype/)
      assert.strictEqual({}.polluted, undefined)
    })

    it(`delete() refuses ${path}`, () => {
      assert.throws(() => resolvePath({ a: {} }, path).delete(), /shared prototype/)
    })
  }

  it('the vuex path.set mutation refuses too', () => {
    assert.throws(() => mutations['path.set']({}, { path: '__proto__.polluted', value: 1 }), /shared prototype/)
    assert.strictEqual({}.polluted, undefined)
  })

  it('reading through them still works', () => {
    assert.strictEqual(resolvePath({ a: [] }, 'a.constructor.name').get(), 'Array')
  })

  it('an escaped name that only resembles one is an ordinary key', () => {
    const state = { 'a.__proto__': {} }
    resolvePath(state, 'a\\.__proto__.x').set(1)
    assert.strictEqual(state['a.__proto__'].x, 1)
  })
})
