import Vue from 'vue'
import jsPathResolver from './jsPathResolver.js'

// Vue.set is a Vue 2 requirement only: Vue 2 reactivity cannot observe a property
// added after an object was made reactive. Vue 3 removed the API, because its
// Proxy-based reactivity needs no such hint, so a Vue 3 port of this file drops this
// import and assigns directly. This import had been commented out while the three
// Vue.set calls below remained, which left Vue as an undefined free variable and made
// mutations['path.set'] throw ReferenceError on first use.

let debug = false

//TODO add path delete, increment, decrement, toggle, true, false

function log(state) {
  if (debug) {
    console.log(structuredClone(state))  // deepcopy was never defined in this module
  }
}


function checkDefined(dotpath, fieldInfo) {
  if (typeof fieldInfo.field === "undefined") {
    console.warn(`${dotpath} was not defined in the state object.`)
  }
}

const mutations =
  {
    'path.list.remove'(state, payload) {
      let {path, value, index} = payload
      let found = jsPathResolver(state, path)
      checkDefined(path, found);
      if (found.field instanceof Array) {
        if (typeof index === 'undefined') {
          index = found.field.indexOf(value)
        }
        if (index >= 0) {
          found.field.splice(index, 1)
        }
      }
      log(state)
    },
    // Known limitation, deliberately left alone: called with no `index`, this derives one
    // from indexOf(value), which is -1 for a value not already present, so the insert does
    // nothing. Appending is what 'path.list.add' is for, and any other guess at the
    // intended position would be inventing semantics rather than fixing a defect.
    'path.list.insert'(state, payload) {
      let {path, value, index} = payload
      let found = jsPathResolver(state, path)
      checkDefined(path, found);
      if (found.field instanceof Array) {
        if (typeof index === 'undefined') {
          index = found.field.indexOf(value)
        }
        if (index >= 0) {
          found.field.splice(index, 0, value)
        }
      }
      log(state)
    },
    'path.list.add'(state, payload) {
      let {path, value} = payload
      let found = jsPathResolver(state, path)
      checkDefined(path, found);
      if (found.field instanceof Array) {
        found.field.push(value)
      }
      log(state)
    },
    'path.list.move'(state, payload) {
      let {path, item, index, amount, ref} = payload
      let found = jsPathResolver(state, path)
      if (found.field instanceof Array) {
        const curIndex = found.field.indexOf(item)
        if (curIndex >= 0) {
          if (typeof amount !== 'undefined') {
            found.field.splice(curIndex, 1)
            // Both branches of the sign test were identical, so the test decided nothing.
            // The single expression is correct either way: the item is already spliced out,
            // so curIndex + amount is its new position for a positive or negative amount.
            found.field.splice(curIndex + amount, 0, item)
          } else {
            switch (index) {
              case 'first':
                found.field.splice(curIndex, 1)
                found.field.splice(0, 0, item)
                break;
              case 'last':
                found.field.splice(curIndex, 1)
                found.field.push(item)
                break;
              // 'before' and 'after' locate the reference AFTER the item has been
              // spliced out, not before. Reading it first was an off-by-one whenever the
              // item sat ahead of the reference, because removing it shifted the
              // reference down one: moving 'a' after 'b' in [a,b,c] produced [b,c,a]
              // instead of [b,a,c]. It only looked correct in the other direction, which
              // is why it survived.
              case 'before':
              case 'after': {
                if (item === ref || found.field.indexOf(ref) < 0) {
                  break;
                }
                found.field.splice(curIndex, 1)
                const refIndex = found.field.indexOf(ref)
                found.field.splice(index === 'before' ? refIndex : refIndex + 1, 0, item)
                break;
              }
              default:
                // index is a number
                found.field.splice(curIndex, 1)
                found.field.splice(index, 0, item)
                break;
            }
          }
        }
      }
      log(state)
    },
    'path.list.replace'(state, payload) {
      let {path, value, index} = payload
      let found = jsPathResolver(state, path)
      checkDefined(path, found);
      if (found.field instanceof Array) {
        found.field.splice(index, 1, value)
      }
      log(state)
    },
    'path.set'(state, payload) {
      let {path, value} = payload
      let found = jsPathResolver(state, path)
      checkDefined(path, found);
      Vue.set(found.parent, found.fieldName, value)
      log(state)
    },
    'path.clear'(state, payload) {
      let {path} = payload
      let found = jsPathResolver(state, path)
      checkDefined(path, found);
      if (found.field instanceof Array) {
        Vue.set(found.parent, found.fieldName, [])
      }
      // `instanceof String` is false for a string primitive, which is what every string in
      // a Vuex state actually is, so clearing a string always fell through to the error
      // branch -- and that branch referenced an undeclared `it`, so it threw
      // ReferenceError instead of logging. Two defects on one path: the test that could
      // not match, and the message that could not print.
      else if (typeof found.field === 'string') {
        Vue.set(found.parent, found.fieldName, '')
      } else {
        console.error(`path.clear does not support the type at ${path}`)
      }
      log(state)
    }
  }
const getters = {
  pathGet: (state, getters, rootState) => path => {
    let found = jsPathResolver(state, path)
    return found.field;
  },
  pathExists: (state) => path => {
    try {
      const fieldInfo = jsPathResolver(state, path)
      return typeof fieldInfo.field !== 'undefined'
    } catch (e) {
      return false;
    }
  }
}

export {getters, mutations, jsPathResolver}