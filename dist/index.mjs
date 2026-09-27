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

// src/index.js
var index_default = jsPathResolver_default;
export {
  index_default as default
};
