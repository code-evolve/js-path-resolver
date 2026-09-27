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

Two optional entry points. Both require **Vue 2**, declared as an optional peer dependency,
because `Vue.set` exists only in Vue 2: its reactivity cannot observe a property added after an
object became reactive. The main entry needs no framework.

```js
import { mutations, getters } from 'js-path-resolver/vuex'
import DotPathPlugin from 'js-path-resolver/vue-plugin'
```

`mutations` provides `path.set`, `path.list.remove` and related dot-path mutations for a Vuex
store. `DotPathPlugin` adds a `$dp(command, path, value)` helper to components.


## License

MIT. Copyright (c) 2018-present Steven Spungin. See [LICENSE](LICENSE).
