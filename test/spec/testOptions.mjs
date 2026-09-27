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
  a1: ['v1', 'v2', 'v3'],
  escape: {
    'dotted.value': 'property name with dot',
    'dottedend.': 'property name ending with dot',
    'openbrace[value': 'property name with open brace',
    'closebrace]value': 'property name with close brace',
    'closebraceend]': 'property name ending with close brace',
  },
}

describe('Options - onError', () => {
  it('will not exist', () => {
    const info = resolvePath(state, 'bad.path', { onError: 'continue' })
    assert.strictEqual(info.exists, false)
  })

  it('will exist', () => {
    const info = resolvePath(state, 'o1.o2.o3', { onError: 'continue' })
    assert.strictEqual(info.exists, true)
  })

  it('will throw on get', () => {
    const info = resolvePath(state, 'bad.path', { onError: 'continue' })
    assert.throws(info.get.bind(info))
  })
})
