/*! js-path-resolver 2.1.0 | (c) 2018-present Steven Spungin | MIT */
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
  createDotPathDispatcher: () => createDotPathDispatcher,
  default: () => DotPathPlugin_default
});
module.exports = __toCommonJS(DotPathPlugin_exports);
function createDotPathDispatcher(store) {
  if (!store || typeof store.commit !== "function") {
    throw new TypeError(
      "js-path-resolver/vue-plugin: a Vuex store is required, as app.use(DotPathPlugin, { store }). Vue 3 cannot resolve it from the component the way the Vue 2 plugin did."
    );
  }
  const dispatch = function(command, path, value) {
    store.commit(command, { path, value });
  };
  dispatch.set = function(path, value) {
    store.commit("path.set", { path, value });
  };
  return dispatch;
}
var DotPathPlugin = {
  install(app, options = {}) {
    app.config.globalProperties.$dp = createDotPathDispatcher(options.store);
  }
};
var DotPathPlugin_default = DotPathPlugin;
