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
