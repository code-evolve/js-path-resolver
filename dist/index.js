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

// src/index.js
var index_exports = {};
__export(index_exports, {
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);

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

// src/index.js
var index_default = jsPathResolver_default;
