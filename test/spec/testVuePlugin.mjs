import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import DotPathPlugin from '../../dist/vue-plugin.mjs'

// A component, as far as this plugin is concerned: something on Vue's prototype chain
// with a $store. Enough to exercise `$dp` without pulling Vue into the test run.
function componentOf(FakeVue, committed) {
  const vm = Object.create(FakeVue.prototype)
  vm.$store = { commit: (type, payload) => committed.push([type, payload]) }
  return vm
}

describe('Vue 2 plugin', () => {
  it('exposes an install function', () => {
    assert.strictEqual(typeof DotPathPlugin.install, 'function')
  })

  it('registers $dp, with a set shorthand', () => {
    const FakeVue = function () {}
    DotPathPlugin.install(FakeVue, {})
    const vm = componentOf(FakeVue, [])
    assert.strictEqual(typeof vm.$dp, 'function')
    assert.strictEqual(typeof vm.$dp.set, 'function')
  })

  it('$dp commits through the store', () => {
    const FakeVue = function () {}
    DotPathPlugin.install(FakeVue, {})
    const committed = []
    componentOf(FakeVue, committed).$dp('path.list.add', 'a.b', 1)
    assert.deepStrictEqual(committed, [['path.list.add', { path: 'a.b', value: 1 }]])
  })

  // Regression. `Vue.prototype.$dp.set = ...` attached `set` to the shared function object,
  // so `this.$dp.set(p, v)` called it with that function as the receiver and `this.$store`
  // was undefined. The previous version of this suite asserted only that `$dp.set` was a
  // function, which it was: existence passed while every call threw.
  it('$dp.set commits path.set through the store of the component that called it', () => {
    const FakeVue = function () {}
    DotPathPlugin.install(FakeVue, {})
    const committed = []
    componentOf(FakeVue, committed).$dp.set('a.b', 1)
    assert.deepStrictEqual(committed, [['path.set', { path: 'a.b', value: 1 }]])
  })

  it('gives each component its own dispatcher, so two components cannot cross stores', () => {
    const FakeVue = function () {}
    DotPathPlugin.install(FakeVue, {})
    const first = []
    const second = []
    const a = componentOf(FakeVue, first)
    const b = componentOf(FakeVue, second)
    a.$dp.set('x', 1)
    b.$dp.set('y', 2)
    assert.deepStrictEqual(first, [['path.set', { path: 'x', value: 1 }]])
    assert.deepStrictEqual(second, [['path.set', { path: 'y', value: 2 }]])
  })

  it('returns the same dispatcher on repeated access, rather than one per read', () => {
    const FakeVue = function () {}
    DotPathPlugin.install(FakeVue, {})
    const vm = componentOf(FakeVue, [])
    assert.strictEqual(vm.$dp, vm.$dp)
  })
})
