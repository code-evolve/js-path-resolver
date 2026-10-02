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

/**
 * Traverses the object for the specified path and returns an info object
 *
 * @param object The javascript object to resolve
 * @param path A path string using dots to separate objects and array items. <br />
 * Paths cannot contain '.', '[' or ']' characters unless they are preceded by the escape character '\' <br />
 * Arrays can be specified by brackets (foo[2]) or dots (foo.2)
 * @returns {{field: *, parent: *, fieldNames: *, fieldName: *}} or undefined if the fields parent is not found.
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

  let fieldNames = path.match(/(?:[^\.\[\\]|\\.)+/g)
  if (fieldNames === null) {
    // match() returns null for a path with no segments, and the next line then failed with
    // "Cannot read properties of null (reading 'length')".
    throw Error("path must name at least one field")
  }

  //Make sure to not use negative lookbehinds with split on Safari and Firefox
  // We used match instead...
  // const rxSplit = /(?<!\\)[\.\[]/
  // path = path.replace(/\\\./g, "~~~1~~~")
  // path = path.replace(/\\\[/g, "~~~2~~~")
  // let fieldNames = path.split(rxSplit)
  // fieldNames = fieldNames.map(value => value.replace(/~~~1~~~/g, "\\."))
  // fieldNames = fieldNames.map(value => value.replace(/~~~2~~~/g, "\\["))

  const fieldName = segmentName(fieldNames[fieldNames.length - 1])

  let field = object;
  let parent = null
  let exists = true
  let error = null
  try {
    for (let i = 0; i < fieldNames.length; i++) {
      parent = field
      field = field[segmentName(fieldNames[i])]
    }
  } catch (e) {
    error = e.message
    exists = false
    if (opts.onError && opts.onError === 'continue') {
      parent = null
      field = null
    } else {
      throw new Error(`Could not resolve the path ${path}: ${e.message}`)
    }
  }

  // Only unescape the field names AFTER we have calculated the info.
  fieldNames = fieldNames.map(segmentName)
  const unsafeName = fieldNames.find(name => UNSAFE_SEGMENTS.has(name))
  function refuseUnsafe(action) {
    if (typeof unsafeName !== 'undefined') {
      throw new Error(`Refusing to ${action} through the path ${path}: ${unsafeName} reaches a shared prototype`)
    }
  }
  return {
    exists,
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
    },
    set(newValue) {
      if (!this.exists) {
        throw new Error(`Could not resolve the path ${path}: ${error}`)
      }
      refuseUnsafe('set')
      // Assigning a property to a string or number throws in strict code and does nothing
      // in sloppy code, so the ESM build threw here while the CommonJS build returned as if
      // it had worked. Both now say so.
      if (this.parent === null || (typeof this.parent !== 'object' && typeof this.parent !== 'function')) {
        throw new TypeError(`Cannot set ${this.fieldName} at the path ${path}: its parent is a ${typeof this.parent}, not an object`)
      }
      this.parent[this.fieldName] = newValue
      this.field = newValue
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