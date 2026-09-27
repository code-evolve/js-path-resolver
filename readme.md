# Overview

Resolves paths in Javascript objects, providing tools to
get, set, replace, or remove the resolved item.

# Install
## Web Browser
```
<script src="https://unpkg.com/js-path-resolver/dist/index.js"></script>
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

See [js-path-resolver official documentation](https://www.twelvetone.tv/docs/developer-tools/npm-modules/js-path-resolver) for API and tutorials.

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
