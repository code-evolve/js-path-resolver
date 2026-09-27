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

  let fieldNames = path.match(/(?:[^\.\[\\]|\\.)+/g)

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
      if (Array.isArray(this.parent)) {
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