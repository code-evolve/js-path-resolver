// src/jsPathResolver.js
var rxReplace = /\\(.)/g;
function unescape(field) {
  return field.replace(rxReplace, "$1");
}
function segmentName(rawSegment) {
  const name = unescape(rawSegment);
  if (name.endsWith("]") && !rawSegment.endsWith("\\]")) {
    return name.slice(0, -1);
  }
  return name;
}
var UNSAFE_SEGMENTS = /* @__PURE__ */ new Set(["__proto__", "prototype", "constructor"]);
var ON_ERROR_VALUES = ["throw", "continue"];
var rxArrayIndex = /^(?:0|[1-9]\d*)$/;
var rxSegment = /\[(["'])((?:\\.|(?!\1)[^\\])*)\1\]|(?:[^\.\[\\]|\\.)+/g;
function parsePath(path) {
  const names = [];
  for (const match of path.matchAll(rxSegment)) {
    names.push(typeof match[1] !== "undefined" ? unescape(match[2]) : segmentName(match[0]));
  }
  return names;
}
function isContainer(value) {
  return value !== null && (typeof value === "object" || typeof value === "function");
}
function hasOwn(parent, name) {
  return parent !== null && typeof parent !== "undefined" && Object.prototype.hasOwnProperty.call(Object(parent), name);
}
function jsPathResolver(object, path, opts = {}) {
  if (typeof object === "undefined") {
    throw Error("object must be defined");
  }
  if (typeof path !== "string") {
    throw Error("path must be a string");
  }
  if (typeof opts.onError !== "undefined" && !ON_ERROR_VALUES.includes(opts.onError)) {
    throw new TypeError(`onError must be one of ${ON_ERROR_VALUES.join(", ")}; received ${String(opts.onError)}`);
  }
  const fieldNames = parsePath(path);
  if (fieldNames.length === 0) {
    throw Error("path must name at least one field");
  }
  const fieldName = fieldNames[fieldNames.length - 1];
  let field = object;
  let parent = null;
  let exists = true;
  let error = null;
  try {
    for (let i = 0; i < fieldNames.length; i++) {
      parent = field;
      field = field[fieldNames[i]];
    }
  } catch (e) {
    error = e.message;
    exists = false;
    if (opts.onError === "continue" || opts.create === true) {
      parent = null;
      field = null;
    } else {
      throw new Error(`Could not resolve the path ${path}: ${e.message}`);
    }
  }
  const unsafeName = fieldNames.find((name) => UNSAFE_SEGMENTS.has(name));
  function refuseUnsafe(action) {
    if (typeof unsafeName !== "undefined") {
      throw new Error(`Refusing to ${action} through the path ${path}: ${unsafeName} reaches a shared prototype`);
    }
  }
  function createParent() {
    if (!isContainer(object)) {
      throw new TypeError(`Cannot create the path ${path}: the root is not an object`);
    }
    let current = object;
    for (let i = 0; i < fieldNames.length - 1; i++) {
      const name = fieldNames[i];
      let next = current[name];
      if (next === null || typeof next === "undefined") {
        next = rxArrayIndex.test(fieldNames[i + 1]) ? [] : {};
        current[name] = next;
      } else if (!isContainer(next)) {
        throw new TypeError(`Cannot create the path ${path}: ${name} is a ${typeof next}, not an object`);
      }
      current = next;
    }
    return current;
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
        throw new Error(`Could not resolve the path ${path}: ${error}`);
      }
      refuseUnsafe("delete");
      if (Array.isArray(this.parent) && rxArrayIndex.test(this.fieldName)) {
        this.parent.splice(Number(this.fieldName), 1);
      } else {
        delete this.parent[this.fieldName];
      }
      this.field = void 0;
      this.has = false;
    },
    set(newValue) {
      refuseUnsafe("set");
      if (!this.exists) {
        if (opts.create !== true) {
          throw new Error(`Could not resolve the path ${path}: ${error}`);
        }
        this.parent = createParent();
        this.exists = true;
      }
      if (this.parent === null || typeof this.parent !== "object" && typeof this.parent !== "function") {
        throw new TypeError(`Cannot set ${this.fieldName} at the path ${path}: its parent is a ${typeof this.parent}, not an object`);
      }
      this.parent[this.fieldName] = newValue;
      this.field = newValue;
      this.has = true;
    },
    get() {
      if (!this.exists) {
        throw new Error(`Could not resolve the path ${path}: ${error}`);
      }
      return this.field;
    }
  };
}
var jsPathResolver_default = jsPathResolver;

// src/dot-path-mutations.js
var debug = false;
function log(state) {
  if (debug) {
    console.log(structuredClone(state));
  }
}
function checkDefined(dotpath, fieldInfo) {
  if (typeof fieldInfo.field === "undefined") {
    console.warn(`${dotpath} was not defined in the state object.`);
  }
}
var mutations = {
  "path.list.remove"(state, payload) {
    let { path, value, index } = payload;
    let found = jsPathResolver_default(state, path);
    checkDefined(path, found);
    if (found.field instanceof Array) {
      if (typeof index === "undefined") {
        index = found.field.indexOf(value);
      }
      if (index >= 0) {
        found.field.splice(index, 1);
      }
    }
    log(state);
  },
  // Known limitation, deliberately left alone: called with no `index`, this derives one
  // from indexOf(value), which is -1 for a value not already present, so the insert does
  // nothing. Appending is what 'path.list.add' is for, and any other guess at the
  // intended position would be inventing semantics rather than fixing a defect.
  "path.list.insert"(state, payload) {
    let { path, value, index } = payload;
    let found = jsPathResolver_default(state, path);
    checkDefined(path, found);
    if (found.field instanceof Array) {
      if (typeof index === "undefined") {
        index = found.field.indexOf(value);
      }
      if (index >= 0) {
        found.field.splice(index, 0, value);
      }
    }
    log(state);
  },
  "path.list.add"(state, payload) {
    let { path, value } = payload;
    let found = jsPathResolver_default(state, path);
    checkDefined(path, found);
    if (found.field instanceof Array) {
      found.field.push(value);
    }
    log(state);
  },
  "path.list.move"(state, payload) {
    let { path, item, index, amount, ref } = payload;
    let found = jsPathResolver_default(state, path);
    if (found.field instanceof Array) {
      const curIndex = found.field.indexOf(item);
      if (curIndex >= 0) {
        if (typeof amount !== "undefined") {
          found.field.splice(curIndex, 1);
          found.field.splice(curIndex + amount, 0, item);
        } else {
          switch (index) {
            case "first":
              found.field.splice(curIndex, 1);
              found.field.splice(0, 0, item);
              break;
            case "last":
              found.field.splice(curIndex, 1);
              found.field.push(item);
              break;
            // 'before' and 'after' locate the reference AFTER the item has been
            // spliced out, not before. Reading it first was an off-by-one whenever the
            // item sat ahead of the reference, because removing it shifted the
            // reference down one: moving 'a' after 'b' in [a,b,c] produced [b,c,a]
            // instead of [b,a,c]. It only looked correct in the other direction, which
            // is why it survived.
            case "before":
            case "after": {
              if (item === ref || found.field.indexOf(ref) < 0) {
                break;
              }
              found.field.splice(curIndex, 1);
              const refIndex = found.field.indexOf(ref);
              found.field.splice(index === "before" ? refIndex : refIndex + 1, 0, item);
              break;
            }
            default:
              found.field.splice(curIndex, 1);
              found.field.splice(index, 0, item);
              break;
          }
        }
      }
    }
    log(state);
  },
  "path.list.replace"(state, payload) {
    let { path, value, index } = payload;
    let found = jsPathResolver_default(state, path);
    checkDefined(path, found);
    if (found.field instanceof Array) {
      found.field.splice(index, 1, value);
    }
    log(state);
  },
  "path.set"(state, payload) {
    let { path, value } = payload;
    let found = jsPathResolver_default(state, path);
    found.set(value);
    log(state);
  },
  "path.delete"(state, payload) {
    let { path } = payload;
    jsPathResolver_default(state, path).delete();
    log(state);
  },
  // `value` is the step and defaults to 1. A field that is not a number is reported and
  // left alone: adding to a string would concatenate, and adding to undefined gives NaN.
  "path.increment"(state, payload) {
    let { path, value = 1 } = payload;
    let found = jsPathResolver_default(state, path);
    if (typeof found.field === "number") {
      found.set(found.field + value);
    } else {
      console.error(`path.increment needs a number at ${path}`);
    }
    log(state);
  },
  "path.decrement"(state, payload) {
    let { path, value = 1 } = payload;
    let found = jsPathResolver_default(state, path);
    if (typeof found.field === "number") {
      found.set(found.field - value);
    } else {
      console.error(`path.decrement needs a number at ${path}`);
    }
    log(state);
  },
  // Negates whatever is there, so a missing or falsy field becomes true.
  "path.toggle"(state, payload) {
    let { path } = payload;
    let found = jsPathResolver_default(state, path);
    found.set(!found.field);
    log(state);
  },
  "path.true"(state, payload) {
    let { path } = payload;
    jsPathResolver_default(state, path).set(true);
    log(state);
  },
  "path.false"(state, payload) {
    let { path } = payload;
    jsPathResolver_default(state, path).set(false);
    log(state);
  },
  "path.clear"(state, payload) {
    let { path } = payload;
    let found = jsPathResolver_default(state, path);
    checkDefined(path, found);
    if (found.field instanceof Array) {
      found.set([]);
    } else if (typeof found.field === "string") {
      found.set("");
    } else {
      console.error(`path.clear does not support the type at ${path}`);
    }
    log(state);
  }
};
var getters = {
  pathGet: (state, getters2, rootState) => (path) => {
    let found = jsPathResolver_default(state, path);
    return found.field;
  },
  pathExists: (state) => (path) => {
    try {
      const fieldInfo = jsPathResolver_default(state, path);
      return typeof fieldInfo.field !== "undefined";
    } catch (e) {
      return false;
    }
  }
};
export {
  getters,
  jsPathResolver_default as jsPathResolver,
  mutations
};
