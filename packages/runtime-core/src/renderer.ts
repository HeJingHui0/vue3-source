import { effect } from "@vue/reactivity"
import { isString, ShapeFlags } from "@vue/shared"
import { invokeArrayFns } from "./apiLifecycle"
import { createComponentInstance, setupComponent } from "./component"
import { getSequence } from "./sequence"
import { createVNode, isSameVNode, Text, Fragment } from "./vNode"

export const createRenderer = (renderOptions) => {
  let {
    createElement: hostCreateElement,
    createText: hostCreateText,
    insert: hostInsert,
    remove: hostRemove,
    setElementText: hostSetElementText,
    setText: hostSetText,
    querySelector: hostQuerySelector,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    patchProp: hostPacthProp
  } = renderOptions
  const normalize = (children, i) => {
    if (isString(children[i])) {
      children[i] = createVNode(Text, null, children[i])
    }
    return children[i]
  }
  const mountChildren = (children, el) => {
    for (let i = 0; i < children.length; i++) {
      let newChildren = normalize(children, i)
      patch(null, newChildren, el)
    }
  }
  const mountElement = (vNode, container, anchor) => {
    const {type, props, children, shapeFlag} = vNode
    let el = vNode.el = hostCreateElement(type)
    if (props) {
      for(let key in props) {
        hostPacthProp(el, key, null, props[key])
      }
    }
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children)
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el)
    }
    hostInsert(el, container, anchor)
  }
  const processText = (oldVNode, newVNode, container) => {
    if (oldVNode === null) {
      const element = newVNode.el = hostCreateText(newVNode.children)
      hostInsert(element, container)
    } else {
      // 复用节点
      const el = newVNode.el = oldVNode.el
      if (newVNode.children !== oldVNode.children) {
        hostSetText(el, newVNode.children)
      }
    }
  }
  const patchProps = (oldProps, newProps, el) => {
    for(let key in newProps) {
      hostPacthProp(el, key, oldProps[key], newProps[key])
    }
    for(let key in oldProps) {
      if (newProps[key] == null) {
        hostPacthProp(el, key, oldProps[key], undefined)
      }
    }
  }
  const unMountChildren = (children) => {
    for(let i = 0; i < children.length; i++) {
      unMount(children[i])
    }
  }
  // 全量diff
  const patchKeyChildren = (c1, c2, el) => {
    let i = 0
    let e1 = c1.length - 1
    let e2 = c2.length - 1
    // 优化比对**********
    // sync from start
    while(i <= e1 && i <= e2) {
      const n1 = c1[i]
      const n2 = c2[i]
      if (isSameVNode(n1, n2)) {
        patch(n1, n2, el)
      } else {
        break
      }
      i++
    }
    // sync from end
    while(i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = c2[e2]
      if (isSameVNode(n1, n2)) {
        patch(n1, n2, el)
      } else {
        break
      }
      e1--
      e2--
    }
    if (i > e1) {
      // common sequence + mount
      if (i <= e2) {
        while(i <= e2) {
          const nextPos = e2 + 1
          const anchor = nextPos < c2.length ? c2[nextPos].el : null
          patch(null, c2[i], el, anchor)
          i++
        }
      }
    } else if (i > e2) {
      // common sequence + unmount
      if (i <= e1) {
        while(i <= e1) {
          unMount(c1[i])
          i++
        }
      }
    }
    // 优化比对**********
    // 乱序比对**********
    let s1 = i
    let s2 = i
    const keyToNewIndexMap = new Map()
    for(let i = s2; i <= e2; i++) {
      keyToNewIndexMap.set(c2[i].key, i)
    }
    const toBePacth = e2 - s2 + 1
    const newIndexToOldIndexMap = new Array(toBePacth).fill(0)
    for(let i = s1; i <= e1; i++) {
      const oldChild = c1[i]
      let newIndex = keyToNewIndexMap.get(oldChild.key)
      if (!newIndex) {
        unMount(oldChild)
      } else {
        newIndexToOldIndexMap[newIndex - s2] = i + 1
        patch(oldChild, c2[newIndex], el)
      }
    }
    // 最长递增子序列
    const increment = getSequence(newIndexToOldIndexMap)
    let j = increment.length - 1
    for (let i = toBePacth - 1; i >=0; i--) {
      let index = i + s2
      let current = c2[index]
      let anchor = index + 1 < c2.length ? c2[index + 1].el : null
      if (!newIndexToOldIndexMap[i]) {
        // 创建新节点
        patch(null, current, el, anchor)
      } else {
        if (i !== increment[j]) {
          // 复用旧节点
          hostInsert(current.el, el, anchor)
        } else {
          j--
        }
        
      }
    }
  }
  const patchChildren = (oldVNode, newVNode, el) => {
    const c1 = oldVNode.children
    const c2 = newVNode.children
    const oldShapeFlag = oldVNode.shapeFlag
    const newShapeFlag = newVNode.shapeFlag
    if (newShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (oldShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // new文本--old数组
        unMountChildren(c1)
      }
      // new文本--old文本
      if (c2 !== c1) {
        hostSetElementText(el, c2)
      }
    } else {
      if (oldShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (newShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // new数组--old数组 (diff)
          patchKeyChildren(c1, c2,el) // 全量diff
        } else {
          // new空--old数组
          unMountChildren(c1)
        }
      } else {
        if (oldShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(el, '')
        }
        if (newShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, el)
          // new数组--old文本
        }
        // new空  --old文本
      }
    }
  }
  const patchElement = (oldVNode, newVNode, container) => {
    const el = newVNode.el = oldVNode.el
    const oldProps = oldVNode.props || {}
    const newProps = newVNode.props || {}
    patchProps(oldProps, newProps, el)
    patchChildren(oldVNode, newVNode, el)
  }
  const processElement = (oldVNode, newVNode, container, anchor) => {
    if (oldVNode === null) {
      mountElement(newVNode, container, anchor)
    } else {
      // 元素比对 patch核心
      patchElement(oldVNode, newVNode, container)
    }
  }
  const processFragment = (oldVNode, newVNode, container) => {
    if (oldVNode == null) {
      mountChildren(newVNode.children, container)
    } else {
      patchChildren(oldVNode, newVNode, container)
    }
  }
  const setupRendererEffect = (instance, container) => {
    // 创建effcet 将组件render放入effect中对组件数据进行依赖收集和派发更新
    // 3.0 每个组件都有一个effcet 是组件级更新
    effect(function componentEffect() {
      const { bm, m, bu, u } = instance
      if (!instance.isMounted) {
        if (bm) {
          invokeArrayFns(bm)
        }
        const proxyToUser = instance.proxy
        const subTree = instance.subTree = instance.render.call(proxyToUser, proxyToUser)
        patch(null, subTree, container)
        instance.isMounted = true
        if (bm) {
          invokeArrayFns(m)
        }
      } else {
        if (bu) {
          invokeArrayFns(bu)
        }
        const prevTree = instance.subTree
        const proxyToUser = instance.proxy
        const nextTree = instance.subTree = instance.render.call(proxyToUser, proxyToUser)
        patch(prevTree, nextTree, container)
        if (u) {
          invokeArrayFns(u)
        }
      }
    })
  }
  const mountComponent = (initialVNode, container) => {
    const instance = initialVNode.component = createComponentInstance(initialVNode)
    setupComponent(instance)
    setupRendererEffect(instance, container)
  }
  const updateComponent = (oldVNode, newVNode, container, anchor) => {

  }
  const processComponent = (oldVNode, newVNode, container, anchor) => {
    if (oldVNode === null) {
      mountComponent(newVNode, container)
    } else {
      updateComponent(oldVNode, newVNode, container, anchor)
    }
  }
  const patch = (oldVNode, newVNode, container, anchor = null) => {
    if (oldVNode === newVNode) return
    if (oldVNode && !isSameVNode(oldVNode, newVNode)) {
      unMount(oldVNode)
      oldVNode = null
    }
    const {type, shapeFlag} = newVNode
      switch(type) {
        case Text:
          processText(oldVNode, newVNode, container)
          break
        case Fragment:
          processFragment(oldVNode, newVNode, container)
          break
        default: 
          if (shapeFlag & ShapeFlags.ELEMENT) {
            processElement(oldVNode, newVNode, container, anchor)
          }
          if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
            processComponent(oldVNode, newVNode, container, anchor)
          }
      }
  }
  const unMount = (vNode) => {
    hostRemove(vNode.el)
  }
  const render = (vNode, container) => {
    // 卸载
    if (vNode == null) {
      if (container._vNode) {
        unMount(container._vNode)
      }
    } else {
      patch(container._vNode || null, vNode, container)
    }
    container._vNode = vNode
  }
  return {
    render
  }
}