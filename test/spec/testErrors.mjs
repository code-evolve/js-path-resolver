import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import mod from '../../dist/index.js'

const resolvePath = mod.default

const state = {
  o1: {
    o2: {
      o3: {
        v: 12,
        a: ['a1', 'a2', 'a3', { a4: 'bar' }],
      },
    },
  },
}

describe('ResolvePath Traversal', () => {
  it('rejects undefined state', () => {
    assert.throws(() => resolvePath(undefined, 'o1.o2.o3.v'), Error)
  })

  it('rejects undefined path', () => {
    assert.throws(() => resolvePath(state, null), Error)
  })

  it('rejects missing path', () => {
    assert.throws(() => resolvePath(state, 'foo.bar'), Error)
  })

  it('rejects unresolvable path', () => {
    assert.throws(() => resolvePath(state, 'o1.o2.o3.o4.o5'), Error)
  })
})
