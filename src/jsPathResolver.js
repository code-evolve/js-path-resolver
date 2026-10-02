const rxReplace = /\\(.)/g

function unescape(field) {
  return field.replace(rxReplace, '$1')
}

/**
 * Resolves one raw path segment to the property name it addresses.
 *
 * A segment produced by bracket syntax carries a trailing ']' (foo[2] yields '2]').
 * That bracket is stripped unless it was escaped as '\]', in which case it is part
 * of the property name. Escapes are removed either way.
 *
 * This is shared by the traversal and by the returned fieldName deliberately: when
 * the two disagreed, reads through bracket syntax worked while set() and delete()
 * wrote to a key named '2]' instead, silently corrupting the object.
 */
function segmentName(rawSegment) {
  const name = unescape(rawSegment)
  if (name.endsWith(']') && !rawSegment.endsWith('\\]')) {
    return name.slice(0, -1)
  }
  return name
}

// Assigning through any of these reaches a prototype shared by every object, so a path
// built from outside input could change the behaviour of the whole process:
// resolver({}, '__proto__.x').set(1) used to make ({}).x === 1 everywhere. Reading through
// them is harmless and stays allowed; set() and delete() refuse.
const UNSAFE_SEGMENTS = new Set(['__proto__', 'prototype', 'constructor'])

const ON_ERROR_VALUES = ['throw', 'continue']

// An array index as Array itself defines one: a canonical non-negative integer.
const rxArrayIndex = /^(?:0|[1-9]\d*)$/

// One segment of a path. Either a quoted bracket, a["b.c"] or a['b.c'], whose content is the
// property name with nothing in it treated as a separator, or a run of characters up to the
// next unescaped '.' or '['. A plain global match rather than a split on a lookbehind, which
// Safari and Firefox did not support when this was written.
const rxSegment = /\[(["'])((?:\\.|(?!\1)[^\\])*)\1\]|(?:[^\.\[\\]|\\.)+/g

function parsePath(path) {
  const names = []
  for (const match of path.matchAll(rxSegment)) {
    names.push(typeof match[1] !== 'undefined' ? unescape(match[2]) : segmentName(match[0]))
  }
  return names
}

function isContainer(value) {
  return value !== null && (typeof value === 'object' || typeof value === 'function')
}

function hasOwn(parent, name) {
  return parent !== null && typeof parent !== 'undefined'
    && Object.prototype.hasOwnProperty.call(Object(parent), name)
}

/**
 * Traverses the object for the specified path and returns an info object
 *
 * @param object The javascript object to resolve
 * @param path A path string using dots to separate objects and array items. <br />
 * Paths cannot contain '.', '[' or ']' characters unless they are preceded by the escape character '\' <br />
 * Arrays can be specified by brackets (foo[2]) or dots (foo.2) <br />
 * A quoted bracket (foo["a.b"]) names a property exactly, with no escaping of separators
 * @param opts onError: 'throw' (default) or 'continue'. create: true lets set() build the
 * objects and arrays missing along the path.
 * @returns {{exists: boolean, has: boolean, field: *, parent: *, fieldNames: string[], fieldName: string}}
 */
function jsPathResolver(object, path, opts = {}) {
  if (typeof object === 'undefined') {
    throw Error("object must be defined")
  }
  if (typeof path !== 'string') {
    throw Error("path must be a string")
  }

  // An unknown value used to be ignored, which read as "the option did nothing" only when
  // the path later failed to resolve.
  if (typeof opts.onError !== 'undefined' && !ON_ERROR_VALUES.includes(opts.onError)) {
    throw new TypeError(`onError must be one of ${ON_ERROR_VALUES.join(', ')}; received ${String(opts.onError)}`)
  }

  const fieldNames = parsePath(path)
  if (fieldNames.length === 0) {
    // A path with no segments used to reach the next line as null and fail with
    // "Cannot read properties of null (reading 'length')".
    throw Error("path must name at least one field")
  }

  const fieldName = fieldNames[fieldNames.length - 1]

  let field = object;
  let parent = null
  let exists = true
  let error = null
  try {
    for (let i = 0; i < fieldNames.length; i++) {
      parent = field
      field = field[fieldNames[i]]
    }
  } catch (e) {
    error = e.message
    exists = false
    // create implies continue: the point of it is to resolve a path that is not there yet.
    if (opts.onError === 'continue' || opts.create === true) {
      parent = null
      field = null
    } else {
      throw new Error(`Could not resolve the path ${path}: ${e.message}`)
    }
  }

  const unsafeName = fieldNames.find(name => UNSAFE_SEGMENTS.has(name))
  function refuseUnsafe(action) {
    if (typeof unsafeName !== 'undefined') {
      throw new Error(`Refusing to ${action} through the path ${path}: ${unsafeName} reaches a shared prototype`)
    }
  }
  // With create, build what is missing between the root and the parent. Done here, when
  // something is actually being set, and never while resolving: resolving a path to read it
  // must not change the object.
  function createParent() {
    if (!isContainer(object)) {
      throw new TypeError(`Cannot create the path ${path}: the root is not an object`)
    }
    let current = object
    for (let i = 0; i < fieldNames.length - 1; i++) {
      const name = fieldNames[i]
      let next = current[name]
      if (next === null || typeof next === 'undefined') {
        next = rxArrayIndex.test(fieldNames[i + 1]) ? [] : {}
        current[name] = next
      } else if (!isContainer(next)) {
        throw new TypeError(`Cannot create the path ${path}: ${name} is a ${typeof next}, not an object`)
      }
      current = next
    }
    return current
  }
  return {
    exists,
    // True only when the field itself is present as an own property of its parent. exists
    // says the parent resolved, which is what set() needs; has says there is something to
    // get().
    has: exists && hasOwn(parent, fieldName),
    field,
    parent,
    fieldNames,
    fieldName,
    delete() {
      if (!this.exists) {
        throw new Error(`Could not resolve the path ${path}: ${error}`)
      }
      refuseUnsafe('delete')
      // Only a real index is spliced. Number('x') is NaN and splice treats NaN as 0, so
      // deleting 'list.x' used to remove the first element, and 'list.-1' the last. Any
      // other name is an ordinary property of the array and is deleted as one.
      if (Array.isArray(this.parent) && rxArrayIndex.test(this.fieldName)) {
        this.parent.splice(Number(this.fieldName), 1)
      } else {
        delete this.parent[this.fieldName]
      }
      this.field = undefined
      this.has = false
    },
    set(newValue) {
      refuseUnsafe('set')
      if (!this.exists) {
        if (opts.create !== true) {
          throw new Error(`Could not resolve the path ${path}: ${error}`)
        }
        this.parent = createParent()
        this.exists = true
      }
      // Assigning a property to a string or number throws in strict code and does nothing
      // in sloppy code, so the ESM build threw here while the CommonJS build returned as if
      // it had worked. Both now say so.
      if (this.parent === null || (typeof this.parent !== 'object' && typeof this.parent !== 'function')) {
        throw new TypeError(`Cannot set ${this.fieldName} at the path ${path}: its parent is a ${typeof this.parent}, not an object`)
      }
      this.parent[this.fieldName] = newValue
      this.field = newValue
      this.has = true
    },
    get() {
      if (!this.exists) {
        throw new Error(`Could not resolve the path ${path}: ${error}`)
      }
      return this.field;
    }
  }
}

export default jsPathResolver