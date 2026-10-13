import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import mod from '../../dist/index.js'

const resolvePath = mod.default

// Ported from the mocha suite, which the runner never picked up.
const state = {
  o1: {
    o2: {
      o3: {
        v: 12,
        a: ['a1', 'a2', 'a3', { a4: 'bar' }]
      }
    }
  },
  a1: ['v1', 'v2', 'v3'],
  escape: {
    'dotted.value': 'property name with dot',
    'dottedend.': 'property name ending with dot',
    'openbrace[value': 'property name with open brace',
    'closebrace]value': 'property name with close brace',
    'closebraceend]': 'property name ending with close brace'
  }
}

describe('ResolvePath Traversal', () => {
  it('can resolve multiple object levels', () => {
    assert.equal(resolvePath(state, 'o1.o2.o3.v').field, 12)
  })

  it('can resolve array', () => {
    assert.ok(Array.isArray(resolvePath(state, 'a1').field))
  })

  it('can resolve array element using brackets', () => {
    assert.equal(resolvePath(state, 'a1[1]').field, 'v2')
  })

  it('can resolve array element using dot', () => {
    assert.equal(resolvePath(state, 'a1.1').field, 'v2')
  })

  it('can resolve nested objects and arrays', () => {
    assert.equal(resolvePath(state, 'o1.o2.o3.a.3.a4').field, 'bar')
  })

  it('can resolve dot in property name', () => {
    assert.equal(resolvePath(state, 'escape.dotted\\.value').field, 'property name with dot')
  })

  it('can resolve dot ending property name', () => {
    assert.equal(resolvePath(state, 'escape.dottedend\\.').field, 'property name ending with dot')
  })

  it('can resolve [ in property name', () => {
    assert.equal(resolvePath(state, 'escape.openbrace\\[value').field, 'property name with open brace')
  })

  it('can resolve ] in property name', () => {
    assert.equal(resolvePath(state, 'escape.closebrace\\]value').field, 'property name with close brace')
  })

  it('can resolve ] ending property name', () => {
    assert.equal(resolvePath(state, 'escape.closebraceend\\]').field, 'property name ending with close brace')
  })
})
