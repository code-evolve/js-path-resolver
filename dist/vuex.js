var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/dot-path-mutations.js
var dot_path_mutations_exports = {};
__export(dot_path_mutations_exports, {
  getters: () => getters,
  jsPathResolver: () => jsPathResolver_default,
  mutations: () => mutations
});
module.exports = __toCommonJS(dot_path_mutations_exports);

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
function jsPathResolver(object, path, opts = {}) {
  if (typeof object === "undefined") {
    throw Error("object must be defined");
  }
  if (typeof path !== "string") {
    throw Error("path must be a string");
  }
  let fieldNames = path.match(/(?:[^\.\[\\]|\\.)+/g);
  const fieldName = segmentName(fieldNames[fieldNames.length - 1]);
  let field = object;
  let parent = null;
  let exists = true;
  let error = null;
  try {
    for (let i = 0; i < fieldNames.length; i++) {
      parent = field;
      field = field[segmentName(fieldNames[i])];
    }
  } catch (e) {
    error = e.message;
    exists = false;
    if (opts.onError && opts.onError === "continue") {
      parent = null;
      field = null;
    } else {
      throw new Error(`Could not resolve the path ${path}: ${e.message}`);
    }
  }
  fieldNames = fieldNames.map(segmentName);
  return {
    exists,
    field,
    parent,
    fieldNames,
    fieldName,
    delete() {
      if (!this.exists) {
        throw new Error(`Could not resolve the path ${path}: ${error}`);
      }
      if (Array.isArray(this.parent)) {
        this.parent.splice(Number(this.fieldName), 1);
      } else {
        delete this.parent[this.fieldName];
      }
      this.field = void 0;
    },
    set(newValue) {
      if (!this.exists) {
        throw new Error(`Could not resolve the path ${path}: ${error}`);
      }
      this.parent[this.fieldName] = newValue;
      this.field = newValue;
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
    found.parent[found.fieldName] = value;
    log(state);
  },
  "path.clear"(state, payload) {
    let { path } = payload;
    let found = jsPathResolver_default(state, path);
    checkDefined(path, found);
    if (found.field instanceof Array) {
      found.parent[found.fieldName] = [];
    } else if (typeof found.field === "string") {
      found.parent[found.fieldName] = "";
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
