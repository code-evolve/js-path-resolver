const expect = require('chai').expect;
import resolvePath from "@@/jsPathResolver.js";

const state = {
    o1: {
        o2: {
            o3: {
                v: 12,
                a: ['a1', 'a2', 'a3', {a4: 'bar'}]
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

describe("ResolvePath Traversal", function () {

    it("can resolve multiple object levels", function () {
        const info = resolvePath(state, 'o1.o2.o3.v')
        expect(info.field).to.equal(12)
    });

    it("can resolve array", function () {
        const info = resolvePath(state, 'a1')
        expect(Array.isArray(info.field)).to.be.true
    })

    it("can resolve array element using brackets", function () {
        const info = resolvePath(state, 'a1[1]')
        expect(info.field).to.equal('v2')
    })

    it("can resolve array element using dot", function () {
        const info = resolvePath(state, 'a1.1')
        expect(info.field).to.equal('v2')
    })

    it("can resolve nested objects and arrays", function () {
        const info = resolvePath(state, 'o1.o2.o3.a.3.a4')
        expect(info.field).to.equal('bar')
    })

    it("can resolve dot in property name", function () {
        const info = resolvePath(state, 'escape.dotted\\.value')
        expect(info.field).to.equal('property name with dot')
    })

    it("can resolve dot ending property name", function () {
        const info = resolvePath(state, 'escape.dottedend\\.')
        expect(info.field).to.equal('property name ending with dot')
    })

    it("can resolve [ in property name", function () {
        const info = resolvePath(state, 'escape.openbrace\\[value')
        expect(info.field).to.equal('property name with open brace')
    })
    it("can resolve ] in property name", function () {
        const info = resolvePath(state, 'escape.closebrace\\]value')
        expect(info.field).to.equal('property name with close brace')
    })
    it("can resolve ] ending property name", function () {
        const info = resolvePath(state, 'escape.closebraceend\\]')
        expect(info.field).to.equal('property name ending with close brace')
    })

});