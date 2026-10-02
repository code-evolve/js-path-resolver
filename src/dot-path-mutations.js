import jsPathResolver from './jsPathResolver.js'

// This module imports nothing but the resolver, and that is the point of 2.0.0.
//
// Up to 1.1.0 it called Vue.set to add a property, which Vue 2 needs because its
// reactivity cannot observe a property added after an object became reactive. Vue 3
// replaced that reactivity with a Proxy, which observes the assignment itself, and
// removed the API. So the Vue 3 form is plain assignment, and dropping the import
// leaves this module framework-agnostic: it is a set of Vuex mutations by convention
// only, and works against any plain object.

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
      // Deliberately does NOT call checkDefined. Adding a property that was not there is
      // this mutation's documented purpose, and was the whole reason it called Vue.set
      // under Vue 2, so warning about it fired on correct use. The warning also carried no
      // information, since nothing here can tell a typo from an intended new property.
      // Every other mutation still checks, because operating on a list that does not exist
      // really is a mistake.
      // Through set() rather than by assigning to found.parent, so the resolver's refusal
      // to write through a prototype applies here too.
      found.set(value)
      log(state)
    },
    'path.clear'(state, payload) {
      let {path} = payload
      let found = jsPathResolver(state, path)
      checkDefined(path, found);
      if (found.field instanceof Array) {
        found.set([])
      }
      // `instanceof String` is false for a string primitive, which is what every string in
      // a Vuex state actually is, so clearing a string always fell through to the error
      // branch -- and that branch referenced an undeclared `it`, so it threw
      // ReferenceError instead of logging. Two defects on one path: the test that could
      // not match, and the message that could not print.
      else if (typeof found.field === 'string') {
        found.set('')
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