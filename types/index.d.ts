export interface ResolveOptions {
  /**
   * 'throw', the default, throws when the path cannot be followed to the parent of its last
   * field. 'continue' returns a path info with `exists` false instead.
   */
  onError?: 'throw' | 'continue'
  /**
   * Lets `set` build the objects and arrays missing along the path. Implies
   * `onError: 'continue'`. Nothing is created until `set` is called.
   */
  create?: boolean
}

export interface PathInfo<T = any> {
  /** True if the path resolved as far as the parent of its last field. */
  exists: boolean
  /** True if the last field is present as an own property of its parent. */
  has: boolean
  /** The resolved value, or undefined. */
  field: T | undefined
  /** The object or array that holds the field. Null when `exists` is false. */
  parent: any
  /** The name of the field in its parent. */
  fieldName: string
  /** Every field name in the path, starting from the root object. */
  fieldNames: string[]
  /** Returns the field. Throws if `exists` is false. */
  get(): T | undefined
  /** Replaces the field. Throws if `exists` is false and `create` was not set. */
  set(newValue: T): void
  /** Removes the field from its parent. An array index is spliced out. */
  delete(): void
}

/**
 * Resolves a path, such as `lists.todo[1].completed`, in a Javascript object.
 */
export default function jsPathResolver<T = any>(object: any, path: string, options?: ResolveOptions): PathInfo<T>
