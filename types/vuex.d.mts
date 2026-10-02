export interface PathPayload {
  path: string
  value?: any
  index?: any
  item?: any
  amount?: number
  ref?: any
}

export type PathMutation = (state: any, payload: PathPayload) => void

export interface PathMutations {
  'path.set': PathMutation
  'path.delete': PathMutation
  'path.clear': PathMutation
  'path.increment': PathMutation
  'path.decrement': PathMutation
  'path.toggle': PathMutation
  'path.true': PathMutation
  'path.false': PathMutation
  'path.list.add': PathMutation
  'path.list.remove': PathMutation
  'path.list.insert': PathMutation
  'path.list.replace': PathMutation
  'path.list.move': PathMutation
}

export const mutations: PathMutations

export const getters: {
  pathGet: (state: any, getters?: any, rootState?: any) => (path: string) => any
  pathExists: (state: any) => (path: string) => boolean
}

export { default as jsPathResolver } from './index.mjs'
