import { currentInstance, setCurrentInstance } from "./component"

const enum LifeCycleHooks {
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm',
  BEFORE_UPDATE = 'bu',
  UPDATED = 'u'
}

const injectHook = (Lifecycle, hook, target) => {
  if (!target) {
    return console.warn('hook error')
  } else {
    const hooks = target[Lifecycle] || (target[Lifecycle] = [])
    const warp = () => {
      setCurrentInstance(target)
      hook.call(target)
      setCurrentInstance(null)
    }
    hooks.push(warp)
  }
}

export const invokeArrayFns = (fns) => {
  if (fns) {
    for (let i = 0; i < fns.length; i++) {
      fns[i]()
    }
  }
}

const createHook = (Lifecycle) => (hook, target = currentInstance) => {
  injectHook(Lifecycle, hook, target)
}

export const onBeforeMount = createHook(LifeCycleHooks.BEFORE_MOUNT)
export const onMounted = createHook(LifeCycleHooks.MOUNTED)
export const onBeforeUpdate = createHook(LifeCycleHooks.BEFORE_UPDATE)
export const onUpdated = createHook(LifeCycleHooks.UPDATED)