import { isFunction, isObject, ShapeFlags } from "@vue/shared"
import { PublicInstanceProxyHandlers } from "./componentPublicInstance"

export const createComponentInstance = (vNode) => {
  const instance = {
    vNode,
    type: vNode.type,
    props: {},
    attrs: {},
    slots: {},
    setupState: {},
    data: {},
    isMounted: false,
    render: null,
    ctx: {}
  }
  instance.ctx = { _: instance} 
  return instance
}

const createSetupContext = (instance) => {
  return {
    attrs: instance.attrs,
    slots: instance.slots,
    emit: () => {},
    expose: () => {}
  }
}

const finishComponentSetup = (instance) => {
  const Component = instance.type
  if (!instance.render) {
    if (!Component.render && Component.template) {
      // 对template进行编译 产生render函数并挂载到实例上
    }
    instance.render = Component.render
  }
  // 此处对vue2.0 api 做兼容 applyOptions
}

const handleSetupResult = (instance, setupResult) => {
  if (isFunction(setupResult)) {
    instance.render = setupResult
  } else if (isObject(setupResult)) {
    instance.setupState = setupResult
  }
  finishComponentSetup(instance)
}

export let currentInstance = null
export const setCurrentInstance = (instance) => {
  currentInstance = instance
}
export const getCurrentInstance = () => {
  return currentInstance
}

const setupStatefulComponent = (instance) => {
  // 代理
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers as any)
  const Component = instance.type
  const { setup } = Component
  if (setup) {
    currentInstance = instance
    const setupContext = createSetupContext(instance)
    const setupResult = setup(instance.props, setupContext)
    currentInstance = null
    handleSetupResult(instance, setupResult)
  } else {
    finishComponentSetup(instance)
  }
}

export const setupComponent = (instance) => {
  const { props, children } = instance.vNode
  // 根据 props 解析 props attrs
  instance.props = props
  instance.children = children
  let isStateful = instance.vNode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT
  if (isStateful) {
    setupStatefulComponent(instance)
  }
}