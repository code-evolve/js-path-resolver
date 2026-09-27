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

// src/DotPathPlugin.js
var DotPathPlugin_exports = {};
__export(DotPathPlugin_exports, {
  default: () => DotPathPlugin_default
});
module.exports = __toCommonJS(DotPathPlugin_exports);
var perComponent = /* @__PURE__ */ new WeakMap();
function dispatcherFor(vm) {
  let dp = perComponent.get(vm);
  if (dp) {
    return dp;
  }
  dp = function(command, path, value) {
    vm.$store.commit(command, { path, value });
  };
  dp.set = function(path, value) {
    vm.$store.commit("path.set", { path, value });
  };
  perComponent.set(vm, dp);
  return dp;
}
var DotPathPlugin = {
  install(Vue, options) {
    Object.defineProperty(Vue.prototype, "$dp", {
      configurable: true,
      get() {
        return dispatcherFor(this);
      }
    });
  }
};
var DotPathPlugin_default = DotPathPlugin;
