import type { PathMutations } from './vuex'

/** Anything with a Vuex-style commit. */
export interface StoreLike {
  commit(type: string, payload?: any): void
}

export interface DotPathDispatcher {
  (command: keyof PathMutations | (string & {}), path: string, value?: any): void
  /** Shorthand for the 'path.set' mutation. */
  set(path: string, value: any): void
}

export function createDotPathDispatcher(store: StoreLike): DotPathDispatcher

/** Vue 3 plugin. Install with `app.use(DotPathPlugin, { store })`. */
declare const DotPathPlugin: {
  install(app: { config: { globalProperties: Record<string, any> } }, options: { store: StoreLike }): void
}

export default DotPathPlugin
