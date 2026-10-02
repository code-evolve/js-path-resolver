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
  let fieldNames = path.match(/(?:[^\.\[\\]|\\.)+/g);
  if (fieldNames === null) {
    throw Error("path must name at least one field");
  }
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
  const unsafeName = fieldNames.find((name) => UNSAFE_SEGMENTS.has(name));
  function refuseUnsafe(action) {
    if (typeof unsafeName !== "undefined") {
      throw new Error(`Refusing to ${action} through the path ${path}: ${unsafeName} reaches a shared prototype`);
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
        throw new Error(`Could not resolve the path ${path}: ${error}`);
      }
      refuseUnsafe("delete");
      if (Array.isArray(this.parent) && rxArrayIndex.test(this.fieldName)) {
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
      refuseUnsafe("set");
      if (this.parent === null || typeof this.parent !== "object" && typeof this.parent !== "function") {
        throw new TypeError(`Cannot set ${this.fieldName} at the path ${path}: its parent is a ${typeof this.parent}, not an object`);
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

// src/index.js
var index_default = jsPathResolver_default;
