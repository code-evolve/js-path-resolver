import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

import esm from '../../dist/index.mjs'
import cjsNamespace from '../../dist/index.js'

const require = createRequire(import.meta.url)

// The published 1.0.14 exposed the function as require('js-path-resolver').default.
// Every build must keep that shape, or existing consumers break silently.
describe('packaging', () => {
  it('CJS keeps the .default shape that 1.0.14 published', () => {
    const cjs = require('../../dist/index.js')
    assert.strictEqual(typeof cjs.default, 'function')
    assert.strictEqual(cjs.default({ a: { b: 1 } }, 'a.b').get(), 1)
  })

  it('ESM default export is the function itself', () => {
    assert.strictEqual(typeof esm, 'function')
    assert.strictEqual(esm({ a: { b: 2 } }, 'a.b').get(), 2)
  })

  it('CJS and ESM behave identically', () => {
    const viaCjs = cjsNamespace.default({ x: ['p', 'q'] }, 'x[1]')
    const viaEsm = esm({ x: ['p', 'q'] }, 'x[1]')
    assert.strictEqual(viaCjs.field, viaEsm.field)
    assert.strictEqual(viaCjs.fieldName, viaEsm.fieldName)
  })

  it('the browser global build defines jsPathResolver', () => {
    const src = require('node:fs').readFileSync(new URL('../../dist/index.global.js', import.meta.url), 'utf8')
    assert.match(src, /jsPathResolver/)
  })
})

// 2.0.0's substantive claim about the Vuex module is that it has no framework in it. That
// is worth asserting rather than trusting: a stray `import Vue from 'vue'` reintroduces a
// peer requirement without breaking a single behavioural test, because the tests install
// vue anyway.
describe('the vuex build carries no framework', () => {
  it('names no vue import', async () => {
    const fs = await import('node:fs/promises')
    const url = new URL('../../dist/vuex.mjs', import.meta.url)
    const source = await fs.readFile(url, 'utf8')
    assert.doesNotMatch(source, /from\s*["']vue["']/)
    assert.doesNotMatch(source, /require\(["']vue["']\)/)
    assert.doesNotMatch(source, /Vue\.set/)
  })
})
