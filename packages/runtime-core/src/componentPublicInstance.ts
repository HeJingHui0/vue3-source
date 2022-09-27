export const PublicInstanceProxyHandlers = {
  get({ _: instance}, key) {
    if (key[0] === '$') {
      console.warn('no get')
      return
    }
    const { setupState, props, data } = instance
    return setupState[key] || props[key] || data[key] || undefined
  },
  set({ _: instance}, key, value) {
    if (key[0] === '$') {
      console.warn('no set')
      return
    }
    const { setupState, props, data } = instance
    if (setupState[key]) {
      setupState[key] = value
    } else if (props[key]) {
      props[key] = value
    } else if (data[key]) {
      data[key] = value
    } else {
      return false
    }
    return true
  }
}