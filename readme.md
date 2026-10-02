# Overview

Resolves paths in Javascript objects, providing tools to
get, set, replace, or remove the resolved item.

# Install
## Web Browser
```
<script src="https://unpkg.com/js-path-resolver/dist/index.global.js"></script>
<script>
const resolver = jsPathResolver.default;
</script>
```
## Node
```
import resolver from  'js-path-resolver';
```

# Usage
```js
import resolver from 'js-path-resolver'

const state = {
    lists:{
        todo:[
            {caption:'wake up', completed:true},
            {caption:'eat', completed:false}
        ]
    }
}

const info = resolver(state, 'lists.todo.1.completed')
const value = info.get()
info.set(true)

// Remove a field from its parent object or array.
resolver(state, 'lists.todo.1').delete()

```

By default, if a path cannot be resolved up to the parent,
an exception will be thrown.

```js
resolver(state, 'foo') // will not throw
resolver(state, 'foo.bar') // will throw
```

To never throw, use the `onError` option.  The property `exists`
will be set to false instead.  However, all mutation operations (delete, get, set) will throw.

```js
const info = resolver(state, 'foo.bar', {onError:'continue'}) // will not throw
// info.exists === false
info.get() // will throw
```

# API

```js
const info = resolver(object, path, options)
```

## Describing paths

A path uses dots to traverse the objects and arrays inside a Javascript object. An array item
can be addressed with brackets, `foo[2]`, or with a dot, `foo.2`.

Using the `state` object above, the completed value of the eat todo is at
`lists.todo.1.completed` or `lists.todo[1].completed`.

## Paths that do not exist

The resolver always returns a path info object. If the last field in the path is not defined
in its parent, `info.field` is `undefined` and nothing is thrown, so `set` can be used to add
it. If the path cannot be followed as far as the parent, an `Error` is thrown, unless the
`onError` option described under Usage is set.

```js
const info = resolver(state, 'lists.done') // does not throw, info.field is undefined
info.set([])                               // adds state.lists.done
```

## Special characters

To use `.`, `[`, `]` or `\` in a property name, escape it with `\` in the path. Inside a
Javascript string literal the backslash itself has to be doubled.

```js
// Resolves state['mr.dot']['odd[name']
const info = resolver(state, 'mr\\.dot.odd\\[name')
```

## Path info methods

- `get()` returns the field. Same as `info.field`.
- `set(newValue)` replaces the field with `newValue`. Same as
  `info.parent[info.fieldName] = newValue`.
- `delete()` removes the field from its parent. On an object this is the same as
  `delete info.parent[info.fieldName]`. On an array the item is spliced out, so the items
  after it move down and no hole is left.

## Path info fields

- `field` is the resolved value, or `undefined`.
- `parent` is the object or array that holds the field.
- `fieldName` is the name of the field in its parent.
- `fieldNames` is an array of every field name in the path, starting from the root object.
- `exists` is `true` if the path could be resolved up to the parent.

## Options

- `onError` set to `'continue'` stops the resolver throwing when the path cannot be followed
  to the parent. `exists` is `false` instead, `parent` and `field` are `null`, and `get`,
  `set` and `delete` throw.

## Vue and Vuex

Two optional entry points. The main entry needs no framework and never did.

```js
import { mutations, getters } from 'js-path-resolver/vuex'
import DotPathPlugin from 'js-path-resolver/vue-plugin'
```

`mutations` provides `path.set`, `path.clear`, `path.list.add`, `path.list.remove`,
`path.list.insert`, `path.list.replace` and `path.list.move` for a Vuex store, and `getters`
provides `pathGet` and `pathExists`. **As of 2.0.0 this entry point imports nothing but the
resolver**: Vue 3's reactivity observes a plain assignment, so the `Vue.set` calls that Vue 2
required are gone, and these mutations work against any object.

`DotPathPlugin` is **Vue 3 only** and takes the store:

```js
import { createStore } from 'vuex'
import { mutations, getters } from 'js-path-resolver/vuex'
import DotPathPlugin from 'js-path-resolver/vue-plugin'

const store = createStore({ state, mutations, getters })
app.use(store).use(DotPathPlugin, { store })
```

```js
this.$dp('path.list.add', 'a.b', value)   // any mutation by name
this.$dp.set('a.b', value)                // shorthand for path.set
```

Outside a component, `createDotPathDispatcher(store)` returns the same function.

Passing the store is required because Vue 3 reads a global property with
`globalProperties[key]`, a plain access on that object, so nothing installed there can see the
component that read it. The Vue 2 plugin found the store through the component; Vue 3 has no
component prototype to hang that on.

### Staying on Vue 2

Use **1.1.0**, which is the last release with the Vue 2 plugin and the `Vue.set` mutations. It
is not a deprecated version: it carries all six fixes listed in the changelog and the same
licence.


## License

MIT. Copyright (c) 2018-present Steven Spungin. See [LICENSE](LICENSE).
