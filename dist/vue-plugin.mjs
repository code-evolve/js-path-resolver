/*! js-path-resolver 2.1.0 | (c) 2018-present Steven Spungin | MIT */

// src/DotPathPlugin.js
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
export {
  createDotPathDispatcher,
  DotPathPlugin_default as default
};
