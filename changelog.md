# 2.0.2

Five fixes to the resolver. Each corrects something no caller could have relied on.

- **Security:** `set()` and `delete()` refuse a path that passes through `__proto__`,
  `prototype` or `constructor`. `resolver({}, '__proto__.x').set(1)` used to assign to
  `Object.prototype`, so every object in the process gained `x`, and a path built from outside
  input could do that. Reading through those names is unchanged. The Vuex `path.set` and
  `path.clear` mutations now write through `set()`, so they refuse too.
- **Fixed:** `delete()` on an array removed the wrong element for a field name that was not an
  index: `list.x` removed the first element and `list.-1` the last. It now splices only a real
  index, does nothing for an index past the end, and deletes any other name as a property.
- **Fixed:** `set()` on a primitive parent, such as a string, returned normally from the
  CommonJS build having set nothing, while the ESM build threw. Both throw a `TypeError`.
- **Fixed:** an empty path failed with `Cannot read properties of null (reading 'length')`. It
  now throws `path must name at least one field`.
- **Fixed:** an `onError` value other than `'continue'` was silently ignored. Unknown values
  are rejected with a `TypeError`, and `'throw'` is accepted as the default spelled out.
- 68 tests across 16 suites, up from 43. The new ones also pin behaviour that worked and was
  not asserted: nested and root brackets, a null leaf, and the lenient handling of a leading
  dot, a doubled dot and a trailing backslash.

# 2.0.1

Documentation only. No code changed: `dist` is byte-for-byte what 2.0.0 built.

- The API documentation is in the readme. It used to be a link to a page on twelvetone.tv, which
  now redirects.
- **Fixed:** the browser install snippet loaded `dist/index.js`, which is the CommonJS build and
  does not run in a script tag. It now loads `dist/index.global.js`.
- **Corrected** against the source while moving the text: a path whose last field is missing
  returns a path info with `field` undefined, it does not return `undefined`. `delete()` on an
  array item splices it out. The escaping example doubles the backslash, as a Javascript string
  literal needs.
- `homepage` is https://code-evolve.com/resources/js-path-resolver.

# 2.0.0

**Vue 3.** The major version is the Vue 2 to Vue 3 move and nothing else: the resolver itself,
which is what almost every consumer imports, is unchanged and needs no framework. If you do not
import `js-path-resolver/vuex` or `js-path-resolver/vue-plugin`, upgrading from 1.1.0 changes
nothing for you.

- **Breaking:** the Vue plugin is Vue 3 only, and takes the store:
  `app.use(DotPathPlugin, { store })`. It used to find the store through the component, which
  Vue 3 cannot do: Vue reads a global property with `globalProperties[key]`, a plain access on
  that object, so anything installed there is read with `globalProperties` as its receiver and
  can never see the component. Verified against Vue 3.5.43's source rather than inferred.
  Installing without a store throws a `TypeError` naming the fix instead of failing later at the
  first commit. `createDotPathDispatcher(store)` is exported for use outside a component.
- **Breaking:** `js-path-resolver/vuex` no longer imports Vue. Vue 3's Proxy reactivity observes
  a plain assignment, so the three `Vue.set` calls are ordinary assignments and the module has no
  framework in it at all. It is now a set of Vuex mutations by convention only, and works against
  any plain object. A test asserts the built file names no `vue` import, because a stray one
  would reintroduce the peer requirement without failing a single behavioural test.
- **Breaking:** the `vue` peer dependency is `^3`, was `^2`. Still optional: the main entry has
  no peer requirement.
- **Fixed:** `path.set` warned `was not defined in the state object` when adding a property that
  was not there, which is its documented purpose and the entire reason it called `Vue.set` under
  Vue 2. The warning fired on correct use and carried no information, since nothing at that point
  can distinguish a typo from an intended new property. Every other mutation still checks, because
  operating on a list that does not exist really is a mistake.
- Development dependencies are `esbuild` and `vue` 3, the latter only so the plugin can be proved
  inside a real Vue 3 app rather than against a stub. 43 tests across 12 suites.
- Runtime dependencies: still none.

**Staying on Vue 2:** use 1.1.0. It is the last release with the Vue 2 plugin and carries all six
fixes below.

# 1.1.0

- **Fixed:** a segment containing more than one escape was only unescaped once, so a path
  such as `a\.b\.c` resolved to the wrong property name and reported `exists: true` with
  `field: undefined`, a silent false success. The unescape pattern is now global.
- **Fixed:** bracket notation read the right element but mutated the wrong one. `foo[2]`
  returned a `fieldName` of `2]`, so `set()` and `delete()` addressed a property literally
  named `2]`: the array was left unchanged and a stray key was added. Traversal and the
  returned name now share one helper, so they cannot disagree again.
- **Fixed:** the Vuex mutations module had `import Vue from 'vue'` commented out while three
  `Vue.set` calls remained, so `Vue` was an undefined free variable and `mutations['path.set']`
  threw `ReferenceError` on first use. It had never been published, so nobody hit it. A
  `deepcopy` call behind a disabled debug flag referenced a function that was never defined
  anywhere; it now uses `structuredClone`.
- **Fixed:** `this.$dp.set(path, value)` in the Vue plugin threw
  `TypeError: Cannot read properties of undefined (reading 'commit')` on every call, and had
  never worked. `set` was attached to the shared `Vue.prototype.$dp` function object, so the
  receiver of the call was that function rather than the component, and `this.$store` was
  undefined. `$dp` is now a prototype accessor closing over the component, memoized per
  component, so both `$dp(command, path, value)` and `$dp.set(path, value)` reach the store.
- **Fixed:** `path.clear` threw `ReferenceError: it is not defined` on every string. Its test
  was `found.field instanceof String`, which is false for a string primitive and therefore for
  every string in a Vuex state, so a string fell through to an error branch that referenced an
  undeclared variable. Two defects on one path: a test that could not match, and a message that
  could not print.
- **Fixed:** `path.list.move` with `index: 'before'` or `'after'` was off by one whenever the
  item sat ahead of the reference. It read the reference index before splicing the item out, so
  removing the item shifted the reference down one: moving `a` after `b` in `[a, b, c]` gave
  `[b, c, a]` instead of `[b, a, c]`. It was correct in the other direction, which is why it
  survived. Also collapsed a sign test in the same function whose two branches were identical.
- `path.list.insert` called without an `index` still does nothing, and is documented rather than
  changed: it derives the index from `indexOf(value)`, which is `-1` for a value not already in
  the list. Appending is what `path.list.add` is for, and any other guess at the intended
  position would be inventing semantics.
- Added two entry points that were previously unpublished source only: `js-path-resolver/vuex`
  (Vuex mutations and getters) and `js-path-resolver/vue-plugin` (a `$dp` helper). `vue` is an
  **optional peer dependency** on `^2`, because `Vue.set` is a Vue 2 requirement: Vue 2 cannot
  observe a property added after an object became reactive. The main entry needs no framework
  and has no dependencies.
- Added `exports` with both ESM (`dist/index.mjs`) and CommonJS (`dist/index.js`), plus a
  minified browser build (`dist/index.global.js`). `require('js-path-resolver').default`
  keeps working exactly as before.
- Build moved from webpack 4 and babel 6 to esbuild; tests moved from mocha and chai to the
  Node test runner. Development dependencies went from 8 to 2 and reported vulnerabilities
  from 112 to 1, a low advisory in `vue` itself, needed only to run the Vuex tests. Nothing
  about the runtime changed: there are still no dependencies.
- Declared a licence. 1.0.14 and earlier were published with no licence field at all, which
  meant default copyright applied and nobody could lawfully use them.
- 41 tests across 11 suites, up from 12, verified against an installed tarball for all three
  entry points in both module systems. Every fix above has a test that fails without it.

#Changelog
##1.0.14
- Update docs
##1.0.13
- Fixed UMD build
- Added option `onError`
##1.0.12
- Use match instead of split for cross-browser regex support
##1.0.11
##1.0.10
##1.0.9
##1.0.8
- Workaround for Safari and Firefox regexp lookbehind issue
##1.0.7
- Force RunKit to refresh
##1.0.6
- Update demo
##1.0.5
- Fix module export issues
##1.0.4
- Fix module export issues
##1.0.3
- Fix webpack globalObject issues
##1.0.2
- Add main to package.json
##1.0.1
- Add main to package.json
##1.0.0
- Initial release