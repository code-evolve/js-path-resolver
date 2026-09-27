// src/DotPathPlugin.js
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
export {
  DotPathPlugin_default as default
};
