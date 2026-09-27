/**
 * Vue 3 plugin exposing `this.$dp` on every component.
 *
 *   import { createStore } from 'vuex'
 *   import DotPathPlugin from 'js-path-resolver/vue-plugin'
 *
 *   const store = createStore({ state, mutations, getters })
 *   app.use(store).use(DotPathPlugin, { store })
 *
 *   this.$dp('path.list.add', 'a.b', value)   // any mutation by name
 *   this.$dp.set('a.b', value)                // shorthand for 'path.set'
 *
 * The store is passed in, and that is the breaking change in 2.0.0. Under Vue 2 the
 * plugin could find the store through the component, because `$dp` was installed as a
 * prototype accessor and an accessor on a prototype receives the component as `this`.
 * Vue 3 has no component prototype to extend; its replacement is
 * `app.config.globalProperties`, and Vue reads a global property with
 *
 *   return globalProperties[key]
 *
 * a plain property access on that object. So an accessor there is called with
 * `globalProperties` as its receiver and can never see the component. Verified against
 * Vue 3.5.43's own source, not inferred.
 *
 * Passing the store is better than working around that anyway: one app has one store, so
 * a single dispatcher serves every component with nothing allocated per component and no
 * global mixin. It also makes `$dp.set` correct by construction rather than by a trick,
 * and the function below works with no Vue at all.
 */

/**
 * The dispatcher, independent of Vue: useful directly from `setup()`, from a composable,
 * or from plain code holding a store.
 */
export function createDotPathDispatcher(store) {
  if (!store || typeof store.commit !== 'function') {
    throw new TypeError(
      'js-path-resolver/vue-plugin: a Vuex store is required, as app.use(DotPathPlugin, { store }). ' +
        'Vue 3 cannot resolve it from the component the way the Vue 2 plugin did.',
    )
  }
  const dispatch = function (command, path, value) {
    store.commit(command, { path, value })
  }
  dispatch.set = function (path, value) {
    store.commit('path.set', { path, value })
  }
  return dispatch
}

const DotPathPlugin = {
  install(app, options = {}) {
    app.config.globalProperties.$dp = createDotPathDispatcher(options.store)
  },
}

export default DotPathPlugin
