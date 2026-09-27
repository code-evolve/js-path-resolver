import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import DotPathPlugin, { createDotPathDispatcher } from '../../dist/vue-plugin.mjs'

function recordingStore(committed) {
  return { commit: (type, payload) => committed.push([type, payload]) }
}

// A Vue 3 app, as far as this plugin is concerned. The plugin only ever touches
// config.globalProperties, so this is the whole surface it uses.
function fakeApp() {
  return { config: { globalProperties: {} } }
}

describe('Vue 3 plugin', () => {
  it('exposes an install function and the dispatcher factory', () => {
    assert.strictEqual(typeof DotPathPlugin.install, 'function')
    assert.strictEqual(typeof createDotPathDispatcher, 'function')
  })

  it('installs $dp on globalProperties, with a set shorthand', () => {
    const app = fakeApp()
    DotPathPlugin.install(app, { store: recordingStore([]) })
    assert.strictEqual(typeof app.config.globalProperties.$dp, 'function')
    assert.strictEqual(typeof app.config.globalProperties.$dp.set, 'function')
  })

  it('$dp commits a named mutation', () => {
    const committed = []
    const app = fakeApp()
    DotPathPlugin.install(app, { store: recordingStore(committed) })
    app.config.globalProperties.$dp('path.list.add', 'a.b', 1)
    assert.deepStrictEqual(committed, [['path.list.add', { path: 'a.b', value: 1 }]])
  })

  // The call that was broken through 1.1.0 and every release before it. Under Vue 3 it
  // works for a different reason than under Vue 2: the store is held by the dispatcher
  // rather than reached through the component, so there is no receiver to lose.
  it('$dp.set commits path.set, whatever the receiver of the call is', () => {
    const committed = []
    const app = fakeApp()
    DotPathPlugin.install(app, { store: recordingStore(committed) })
    const { $dp } = app.config.globalProperties
    const detached = $dp.set
    detached('a.b', 1)
    assert.deepStrictEqual(committed, [['path.set', { path: 'a.b', value: 1 }]])
  })

  it('refuses a missing store with a message naming the fix', () => {
    assert.throws(() => DotPathPlugin.install(fakeApp(), {}), {
      name: 'TypeError',
      message: /a Vuex store is required.*app\.use\(DotPathPlugin, \{ store \}\)/s,
    })
  })

  it('refuses something that is not a store', () => {
    assert.throws(() => createDotPathDispatcher({ dispatch() {} }), { name: 'TypeError' })
  })

  it('installs with no options object at all, rather than throwing on a property read', () => {
    assert.throws(() => DotPathPlugin.install(fakeApp()), { name: 'TypeError' })
  })
})
