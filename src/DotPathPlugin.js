/**
 * Vue 2 plugin exposing `this.$dp` on every component.
 *
 *   this.$dp('path.list.add', 'a.b', value)   // any mutation by name
 *   this.$dp.set('a.b', value)                // shorthand for 'path.set'
 *
 * `$dp` is a prototype ACCESSOR rather than a plain prototype method, and that is the
 * whole fix in this file. The obvious form, `Vue.prototype.$dp.set = function () {...}`,
 * attaches `set` to the shared function OBJECT: calling `this.$dp.set(p, v)` makes the
 * receiver that function, so `this.$store` inside it is undefined and every call throws
 * `TypeError: Cannot read properties of undefined (reading 'commit')`. `this.$dp(...)`
 * worked, `this.$dp.set(...)` never did, and only calling it reveals that -- checking
 * that it exists does not.
 *
 * The accessor closes over the component instead, so both call shapes reach the store.
 * The result is memoized per component in a WeakMap: one object per component that ever
 * touches `$dp`, released with the component, and no allocation per call.
 */

const perComponent = new WeakMap()

function dispatcherFor(vm) {
  let dp = perComponent.get(vm)
  if (dp) {
    return dp
  }
  dp = function (command, path, value) {
    vm.$store.commit(command, { path, value })
  }
  dp.set = function (path, value) {
    vm.$store.commit('path.set', { path, value })
  }
  perComponent.set(vm, dp)
  return dp
}

const DotPathPlugin = {
  install(Vue, options) {
    Object.defineProperty(Vue.prototype, '$dp', {
      configurable: true,
      get() {
        return dispatcherFor(this)
      },
    })
  },
}

export default DotPathPlugin
