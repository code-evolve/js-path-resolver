import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import mod from '../../dist/index.js'

const resolvePath = mod.default

// Regression: the unescape regex lacked the /g flag, so only the FIRST escape in a
// segment was unescaped. A path with two escaped dots resolved to a fieldName of
// 'a.b\\.c' and reported exists:true with field:undefined, i.e. a silent false success.
describe('escaped separators', () => {
  const state = {
    'a.b.c': 'two escaped dots',
    'one.two': 'one escaped dot',
    'trailing.': 'ends with a dot',
    'bracket]': 'ends with a close bracket',
  }

  it('unescapes every escape in a segment, not just the first', () => {
    const info = resolvePath(state, 'a\\.b\\.c')
    assert.strictEqual(info.fieldName, 'a.b.c')
    assert.strictEqual(info.exists, true)
    assert.strictEqual(info.get(), 'two escaped dots')
  })

  it('still handles a single escape', () => {
    assert.strictEqual(resolvePath(state, 'one\\.two').get(), 'one escaped dot')
  })

  it('handles a segment ending in an escaped dot', () => {
    assert.strictEqual(resolvePath(state, 'trailing\\.').get(), 'ends with a dot')
  })

  it('keeps an escaped close bracket as part of the name', () => {
    assert.strictEqual(resolvePath(state, 'bracket\\]').get(), 'ends with a close bracket')
  })
})
