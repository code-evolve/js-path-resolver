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

describe('ResolvePath Actions', () => {
  it('can delete object', () => {
    const info = resolvePath(state, 'o1.o2.o3.v')
    info.delete()

    const info2 = resolvePath(state, 'o1.o2.o3.v')
    assert.strictEqual(info2.field, undefined)
  })

  it('can delete array item', () => {
    const info = resolvePath(state, 'o1.o2.o3.a.1')
    assert.strictEqual(info.field, 'a2')
    info.delete()

    const info2 = resolvePath(state, 'o1.o2.o3.a.1')
    assert.strictEqual(info2.field, 'a3')
  })

  it('can set object', () => {
    const info = resolvePath(state, 'o1.o2.o3.v')
    info.set(13)

    const info2 = resolvePath(state, 'o1.o2.o3.v')
    assert.strictEqual(info2.field, 13)
  })

  it('can replace array item', () => {
    const info = resolvePath(state, 'o1.o2.o3.a.1')
    info.set('hello')

    const info2 = resolvePath(state, 'o1.o2.o3.a.1')
    assert.strictEqual(info2.field, 'hello')
  })
})
