var VueRuntimeDOM = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // packages/runtime-dom/src/index.ts
  var src_exports = {};
  __export(src_exports, {
    Fragment: () => Fragment,
    Text: () => Text,
    computed: () => computed,
    createRenderer: () => createRenderer,
    effect: () => effect,
    getCurrentInstance: () => getCurrentInstance,
    h: () => h,
    onBeforeMount: () => onBeforeMount,
    onBeforeUpdate: () => onBeforeUpdate,
    onMounted: () => onMounted,
    onUpdated: () => onUpdated,
    proxyRefs: () => proxyRefs,
    reactive: () => reactive,
    ref: () => ref,
    render: () => render,
    toRef: () => toRef,
    toRefs: () => toRefs,
    watch: () => watch
  });

  // packages/reactivity/src/effect.ts
  var uid = 0;
  var activeEffect = void 0;
  var ReactiveEffect = class {
    constructor(fn, scheduler) {
      this.fn = fn;
      this.scheduler = scheduler;
      this.parent = null;
      this.isActive = true;
      this.deps = [];
      this.id = uid++;
    }
    run() {
      if (!this.isActive) {
        return this.fn();
      }
      try {
        this.parent = activeEffect;
        activeEffect = this;
        clearEffect(this);
        return this.fn();
      } finally {
        activeEffect = this.parent;
        this.parent = null;
      }
    }
    stop() {
      if (this.isActive) {
        this.isActive = false;
        clearEffect(this);
      }
    }
  };
  function clearEffect(effect2) {
    const { deps } = effect2;
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect2);
    }
    effect2.deps.length = [];
  }
  function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
  }
  var targetMap = /* @__PURE__ */ new WeakMap();
  function trackEffects(dep) {
    if (activeEffect) {
      let isTrack = !dep.has(activeEffect);
      if (isTrack) {
        dep.add(activeEffect);
        activeEffect.deps.push(dep);
      }
    }
  }
  function track(target, key) {
    if (!activeEffect)
      return;
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, dep = /* @__PURE__ */ new Set());
    }
    trackEffects(dep);
  }
  function triggerEffects(effects) {
    effects = new Set(effects);
    effects.forEach((effect2) => {
      if (effect2 !== activeEffect) {
        if (effect2.scheduler) {
          effect2.scheduler();
        } else {
          effect2.run();
        }
      }
    });
  }
  function trigger(target, key, newValue, oldValue) {
    const depsMap = targetMap.get(target);
    if (!depsMap)
      return;
    let effects = depsMap.get(key);
    if (effects) {
      triggerEffects(effects);
    }
  }

  // packages/shared/src/index.ts
  var isObject = (value) => {
    return typeof value === "object" && value !== null;
  };
  var isString = (value) => {
    return typeof value === "string";
  };
  var isFunction = (value) => {
    return typeof value === "function";
  };
  var isArray = Array.isArray;
  var isVNode = (vNode) => {
    return !!(vNode && vNode.__v_isVNode);
  };

  // packages/reactivity/src/baseHandler.ts
  var mutableHandlers = {
    get(target, key, receiver) {
      if (key === "__v_isReactive" /* IS_REACTIVE */) {
        return true;
      }
      track(target, key);
      const result = Reflect.get(target, key, receiver);
      if (isObject(result)) {
        return reactive(result);
      }
      return result;
    },
    set(target, key, value, receiver) {
      const oldValue = target[key];
      const result = Reflect.set(target, key, value, receiver);
      if (oldValue !== value) {
        trigger(target, key, value, oldValue);
      }
      return result;
    }
  };

  // packages/reactivity/src/reactive.ts
  var reactiveMap = /* @__PURE__ */ new WeakMap();
  function reactive(target) {
    if (!isObject(target)) {
      return;
    }
    if (target["__v_isReactive" /* IS_REACTIVE */]) {
      return target;
    }
    const exisitingProxy = reactiveMap.get(target);
    if (exisitingProxy) {
      return exisitingProxy;
    }
    const proxy = new Proxy(target, mutableHandlers);
    reactiveMap.set(target, proxy);
    return proxy;
  }
  function isReactive(value) {
    return !!(value && value["__v_isReactive" /* IS_REACTIVE */]);
  }

  // packages/reactivity/src/computed.ts
  var ComputedRefImpl = class {
    constructor(getter, setter) {
      this.setter = setter;
      this._dirty = true;
      this.__v_isReadonly = true;
      this.__v_isRef = true;
      this.dep = /* @__PURE__ */ new Set();
      this.effect = new ReactiveEffect(getter, () => {
        if (!this._dirty) {
          this._dirty = true;
          triggerEffects(this.dep);
        }
      });
    }
    get value() {
      trackEffects(this.dep);
      if (this._dirty) {
        this._dirty = false;
        this._value = this.effect.run();
      }
      return this._value;
    }
    set value(newValue) {
      this.setter(newValue);
    }
  };
  var computed = (funcOrOptions) => {
    let getter;
    let setter;
    let onlyGetter = isFunction(funcOrOptions);
    if (onlyGetter) {
      getter = funcOrOptions;
      setter = () => console.warn("no set");
    } else {
      getter = funcOrOptions.get;
      setter = funcOrOptions.set;
    }
    return new ComputedRefImpl(getter, setter);
  };

  // packages/reactivity/src/watch.ts
  function traverse(source, set = /* @__PURE__ */ new Set()) {
    if (!isObject(source))
      return source;
    if (set.has(source))
      return source;
    set.add(source);
    for (let key in source) {
      traverse(source[key], set);
    }
    return source;
  }
  var watch = (source, callback) => {
    let fn;
    let oldValue;
    let cleanUp;
    if (isReactive(source)) {
      fn = () => traverse(source);
    } else if (isFunction(source)) {
      fn = source;
    } else {
      return;
    }
    const onCleanUp = (cleanFn) => {
      cleanUp = cleanFn;
    };
    const newCallback = () => {
      if (cleanUp) {
        cleanUp();
      }
      const newValue = effect2.run();
      callback(newValue, oldValue, onCleanUp);
      oldValue = newValue;
    };
    const effect2 = new ReactiveEffect(fn, newCallback);
    oldValue = effect2.run();
  };

  // packages/reactivity/src/ref.ts
  var RefImpl = class {
    constructor(rawValue) {
      this.rawValue = rawValue;
      this.__v_isRef = true;
      this.dep = /* @__PURE__ */ new Set();
      this._value = toReactive(rawValue);
    }
    get value() {
      trackEffects(this.dep);
      return this._value;
    }
    set value(newValue) {
      if (newValue !== this.rawValue) {
        this._value = toReactive(newValue);
        this.rawValue = newValue;
        triggerEffects(this.dep);
      }
    }
  };
  var ObjectRefImpl = class {
    constructor(object, key) {
      this.object = object;
      this.key = key;
    }
    get value() {
      return this.object[this.key];
    }
    set Value(newValue) {
      this.object[this.key] = newValue;
    }
  };
  var toReactive = (value) => {
    return isObject(value) ? reactive(value) : value;
  };
  var ref = (value) => {
    return new RefImpl(value);
  };
  var toRef = (object, key) => {
    return new ObjectRefImpl(object, key);
  };
  var toRefs = (object) => {
    const result = isArray(object) ? new Array(object.length) : {};
    for (let key in object) {
      result[key] = toRef(object, key);
    }
    return result;
  };
  var proxyRefs = (object) => {
    return new Proxy(object, {
      get(target, key, recevier) {
        const result = Reflect.get(target, key, recevier);
        return result.__v_isRef ? result.value : result;
      },
      set(target, key, newValue, recevier) {
        const oldValue = target[key];
        if (oldValue.__v_isRef) {
          oldValue.value = newValue;
          return true;
        } else {
          return Reflect.set(target, key, newValue, recevier);
        }
      }
    });
  };

  // packages/runtime-core/src/componentPublicInstance.ts
  var PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
      if (key[0] === "$") {
        console.warn("no get");
        return;
      }
      const { setupState, props, data } = instance;
      return setupState[key] || props[key] || data[key] || void 0;
    },
    set({ _: instance }, key, value) {
      if (key[0] === "$") {
        console.warn("no set");
        return;
      }
      const { setupState, props, data } = instance;
      if (setupState[key]) {
        setupState[key] = value;
      } else if (props[key]) {
        props[key] = value;
      } else if (data[key]) {
        data[key] = value;
      } else {
        return false;
      }
      return true;
    }
  };

  // packages/runtime-core/src/component.ts
  var createComponentInstance = (vNode) => {
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
    };
    instance.ctx = { _: instance };
    return instance;
  };
  var createSetupContext = (instance) => {
    return {
      attrs: instance.attrs,
      slots: instance.slots,
      emit: () => {
      },
      expose: () => {
      }
    };
  };
  var finishComponentSetup = (instance) => {
    const Component = instance.type;
    if (!instance.render) {
      if (!Component.render && Component.template) {
      }
      instance.render = Component.render;
    }
  };
  var handleSetupResult = (instance, setupResult) => {
    if (isFunction(setupResult)) {
      instance.render = setupResult;
    } else if (isObject(setupResult)) {
      instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
  };
  var currentInstance = null;
  var setCurrentInstance = (instance) => {
    currentInstance = instance;
  };
  var getCurrentInstance = () => {
    return currentInstance;
  };
  var setupStatefulComponent = (instance) => {
    instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers);
    const Component = instance.type;
    const { setup } = Component;
    if (setup) {
      currentInstance = instance;
      const setupContext = createSetupContext(instance);
      const setupResult = setup(instance.props, setupContext);
      currentInstance = null;
      handleSetupResult(instance, setupResult);
    } else {
      finishComponentSetup(instance);
    }
  };
  var setupComponent = (instance) => {
    const { props, children } = instance.vNode;
    instance.props = props;
    instance.children = children;
    let isStateful = instance.vNode.shapeFlag & 4 /* STATEFUL_COMPONENT */;
    if (isStateful) {
      setupStatefulComponent(instance);
    }
  };

  // packages/runtime-core/src/apiLifecycle.ts
  var injectHook = (Lifecycle, hook, target) => {
    if (!target) {
      return console.warn("hook error");
    } else {
      const hooks = target[Lifecycle] || (target[Lifecycle] = []);
      const warp = () => {
        setCurrentInstance(target);
        hook.call(target);
        setCurrentInstance(null);
      };
      hooks.push(warp);
    }
  };
  var invokeArrayFns = (fns) => {
    if (fns) {
      for (let i = 0; i < fns.length; i++) {
        fns[i]();
      }
    }
  };
  var createHook = (Lifecycle) => (hook, target = currentInstance) => {
    injectHook(Lifecycle, hook, target);
  };
  var onBeforeMount = createHook("bm" /* BEFORE_MOUNT */);
  var onMounted = createHook("m" /* MOUNTED */);
  var onBeforeUpdate = createHook("bu" /* BEFORE_UPDATE */);
  var onUpdated = createHook("u" /* UPDATED */);

  // packages/runtime-core/src/sequence.ts
  var getSequence = (arr) => {
    const length = arr.length;
    const result = [0];
    let resultLastIndex;
    let start;
    let end;
    let middle;
    const p = new Array(length).fill(0);
    for (let i2 = 0; i2 < length; i2++) {
      let arrI = arr[i2];
      if (arrI) {
        resultLastIndex = result[result.length - 1];
        if (arr[resultLastIndex] < arrI) {
          result.push(i2);
          p[i2] = resultLastIndex;
          continue;
        }
        start = 0;
        end = result.length - 1;
        while (start < end) {
          middle = (start + end) / 2 | 0;
          if (arr[result[middle]] < arrI) {
            start = middle + 1;
          } else {
            end = middle;
          }
        }
        if (arr[result[end]] > arrI) {
          result[end] = i2;
          p[i2] = result[end - 1];
        }
      }
    }
    let i = result.length;
    let last = result[i - 1];
    while (i-- > 0) {
      result[i] = last;
      last = p[last];
    }
    return result;
  };

  // packages/runtime-core/src/vNode.ts
  var Text = Symbol("Text");
  var Fragment = Symbol("Fragment");
  var isSameVNode = (n1, n2) => {
    return n1.type === n2.type && n1.key === n2.key;
  };
  var createVNode = (type, props, children = null) => {
    let shapeFlag = isString(type) ? 1 /* ELEMENT */ : isObject(type) ? 4 /* STATEFUL_COMPONENT */ : 0;
    const vNode = {
      __v_isVNode: true,
      shapeFlag,
      type,
      props,
      children,
      component: null,
      el: null,
      key: props == null ? void 0 : props["key"]
    };
    if (children) {
      let childrenType = 0;
      if (isArray(children)) {
        childrenType = 16 /* ARRAY_CHILDREN */;
      } else {
        children = String(children);
        childrenType = 8 /* TEXT_CHILDREN */;
      }
      vNode.shapeFlag |= childrenType;
    }
    return vNode;
  };

  // packages/runtime-core/src/renderer.ts
  var createRenderer = (renderOptions2) => {
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
    } = renderOptions2;
    const normalize = (children, i) => {
      if (isString(children[i])) {
        children[i] = createVNode(Text, null, children[i]);
      }
      return children[i];
    };
    const mountChildren = (children, el) => {
      for (let i = 0; i < children.length; i++) {
        let newChildren = normalize(children, i);
        patch(null, newChildren, el);
      }
    };
    const mountElement = (vNode, container, anchor) => {
      const { type, props, children, shapeFlag } = vNode;
      let el = vNode.el = hostCreateElement(type);
      if (props) {
        for (let key in props) {
          hostPacthProp(el, key, null, props[key]);
        }
      }
      if (shapeFlag & 8 /* TEXT_CHILDREN */) {
        hostSetElementText(el, children);
      } else if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
        mountChildren(children, el);
      }
      hostInsert(el, container, anchor);
    };
    const processText = (oldVNode, newVNode, container) => {
      if (oldVNode === null) {
        const element = newVNode.el = hostCreateText(newVNode.children);
        hostInsert(element, container);
      } else {
        const el = newVNode.el = oldVNode.el;
        if (newVNode.children !== oldVNode.children) {
          hostSetText(el, newVNode.children);
        }
      }
    };
    const patchProps = (oldProps, newProps, el) => {
      for (let key in newProps) {
        hostPacthProp(el, key, oldProps[key], newProps[key]);
      }
      for (let key in oldProps) {
        if (newProps[key] == null) {
          hostPacthProp(el, key, oldProps[key], void 0);
        }
      }
    };
    const unMountChildren = (children) => {
      for (let i = 0; i < children.length; i++) {
        unMount(children[i]);
      }
    };
    const patchKeyChildren = (c1, c2, el) => {
      let i = 0;
      let e1 = c1.length - 1;
      let e2 = c2.length - 1;
      while (i <= e1 && i <= e2) {
        const n1 = c1[i];
        const n2 = c2[i];
        if (isSameVNode(n1, n2)) {
          patch(n1, n2, el);
        } else {
          break;
        }
        i++;
      }
      while (i <= e1 && i <= e2) {
        const n1 = c1[e1];
        const n2 = c2[e2];
        if (isSameVNode(n1, n2)) {
          patch(n1, n2, el);
        } else {
          break;
        }
        e1--;
        e2--;
      }
      if (i > e1) {
        if (i <= e2) {
          while (i <= e2) {
            const nextPos = e2 + 1;
            const anchor = nextPos < c2.length ? c2[nextPos].el : null;
            patch(null, c2[i], el, anchor);
            i++;
          }
        }
      } else if (i > e2) {
        if (i <= e1) {
          while (i <= e1) {
            unMount(c1[i]);
            i++;
          }
        }
      }
      let s1 = i;
      let s2 = i;
      const keyToNewIndexMap = /* @__PURE__ */ new Map();
      for (let i2 = s2; i2 <= e2; i2++) {
        keyToNewIndexMap.set(c2[i2].key, i2);
      }
      const toBePacth = e2 - s2 + 1;
      const newIndexToOldIndexMap = new Array(toBePacth).fill(0);
      for (let i2 = s1; i2 <= e1; i2++) {
        const oldChild = c1[i2];
        let newIndex = keyToNewIndexMap.get(oldChild.key);
        if (!newIndex) {
          unMount(oldChild);
        } else {
          newIndexToOldIndexMap[newIndex - s2] = i2 + 1;
          patch(oldChild, c2[newIndex], el);
        }
      }
      const increment = getSequence(newIndexToOldIndexMap);
      let j = increment.length - 1;
      for (let i2 = toBePacth - 1; i2 >= 0; i2--) {
        let index = i2 + s2;
        let current = c2[index];
        let anchor = index + 1 < c2.length ? c2[index + 1].el : null;
        if (!newIndexToOldIndexMap[i2]) {
          patch(null, current, el, anchor);
        } else {
          if (i2 !== increment[j]) {
            hostInsert(current.el, el, anchor);
          } else {
            j--;
          }
        }
      }
    };
    const patchChildren = (oldVNode, newVNode, el) => {
      const c1 = oldVNode.children;
      const c2 = newVNode.children;
      const oldShapeFlag = oldVNode.shapeFlag;
      const newShapeFlag = newVNode.shapeFlag;
      if (newShapeFlag & 8 /* TEXT_CHILDREN */) {
        if (oldShapeFlag & 16 /* ARRAY_CHILDREN */) {
          unMountChildren(c1);
        }
        if (c2 !== c1) {
          hostSetElementText(el, c2);
        }
      } else {
        if (oldShapeFlag & 16 /* ARRAY_CHILDREN */) {
          if (newShapeFlag & 16 /* ARRAY_CHILDREN */) {
            patchKeyChildren(c1, c2, el);
          } else {
            unMountChildren(c1);
          }
        } else {
          if (oldShapeFlag & 8 /* TEXT_CHILDREN */) {
            hostSetElementText(el, "");
          }
          if (newShapeFlag & 16 /* ARRAY_CHILDREN */) {
            mountChildren(c2, el);
          }
        }
      }
    };
    const patchElement = (oldVNode, newVNode, container) => {
      const el = newVNode.el = oldVNode.el;
      const oldProps = oldVNode.props || {};
      const newProps = newVNode.props || {};
      patchProps(oldProps, newProps, el);
      patchChildren(oldVNode, newVNode, el);
    };
    const processElement = (oldVNode, newVNode, container, anchor) => {
      if (oldVNode === null) {
        mountElement(newVNode, container, anchor);
      } else {
        patchElement(oldVNode, newVNode, container);
      }
    };
    const processFragment = (oldVNode, newVNode, container) => {
      if (oldVNode == null) {
        mountChildren(newVNode.children, container);
      } else {
        patchChildren(oldVNode, newVNode, container);
      }
    };
    const setupRendererEffect = (instance, container) => {
      effect(function componentEffect() {
        const { bm, m, bu, u } = instance;
        if (!instance.isMounted) {
          if (bm) {
            invokeArrayFns(bm);
          }
          const proxyToUser = instance.proxy;
          const subTree = instance.subTree = instance.render.call(proxyToUser, proxyToUser);
          patch(null, subTree, container);
          instance.isMounted = true;
          if (bm) {
            invokeArrayFns(m);
          }
        } else {
          if (bu) {
            invokeArrayFns(bu);
          }
          const prevTree = instance.subTree;
          const proxyToUser = instance.proxy;
          const nextTree = instance.subTree = instance.render.call(proxyToUser, proxyToUser);
          patch(prevTree, nextTree, container);
          if (u) {
            invokeArrayFns(u);
          }
        }
      });
    };
    const mountComponent = (initialVNode, container) => {
      const instance = initialVNode.component = createComponentInstance(initialVNode);
      setupComponent(instance);
      setupRendererEffect(instance, container);
    };
    const updateComponent = (oldVNode, newVNode, container, anchor) => {
    };
    const processComponent = (oldVNode, newVNode, container, anchor) => {
      if (oldVNode === null) {
        mountComponent(newVNode, container);
      } else {
        updateComponent(oldVNode, newVNode, container, anchor);
      }
    };
    const patch = (oldVNode, newVNode, container, anchor = null) => {
      if (oldVNode === newVNode)
        return;
      if (oldVNode && !isSameVNode(oldVNode, newVNode)) {
        unMount(oldVNode);
        oldVNode = null;
      }
      const { type, shapeFlag } = newVNode;
      switch (type) {
        case Text:
          processText(oldVNode, newVNode, container);
          break;
        case Fragment:
          processFragment(oldVNode, newVNode, container);
          break;
        default:
          if (shapeFlag & 1 /* ELEMENT */) {
            processElement(oldVNode, newVNode, container, anchor);
          }
          if (shapeFlag & 4 /* STATEFUL_COMPONENT */) {
            processComponent(oldVNode, newVNode, container, anchor);
          }
      }
    };
    const unMount = (vNode) => {
      hostRemove(vNode.el);
    };
    const render2 = (vNode, container) => {
      if (vNode == null) {
        if (container._vNode) {
          unMount(container._vNode);
        }
      } else {
        patch(container._vNode || null, vNode, container);
      }
      container._vNode = vNode;
    };
    return {
      render: render2
    };
  };

  // packages/runtime-core/src/h.ts
  function h(type, propsOrChildren, children) {
    const argsLength = arguments.length;
    if (argsLength === 2) {
      if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
        if (isVNode(propsOrChildren)) {
          return createVNode(type, null, [propsOrChildren]);
        }
        return createVNode(type, propsOrChildren);
      } else {
        return createVNode(type, null, propsOrChildren);
      }
    } else {
      if (argsLength > 3) {
        children = Array.from(arguments).slice(2);
      } else if (argsLength === 3 && isVNode(children)) {
        children = [children];
      }
      return createVNode(type, propsOrChildren, children);
    }
  }

  // packages/runtime-dom/src/nodeOps.ts
  var nodeOps = {
    createElement(tagName) {
      return document.createElement(tagName);
    },
    createText(text) {
      return document.createTextNode(text);
    },
    insert(child, parent, anchor = null) {
      parent.insertBefore(child, anchor);
    },
    remove(child) {
      const parentNode = child.parentNode;
      if (parentNode) {
        parentNode.removeChild(child);
      }
    },
    setElementText(el, text) {
      el.textContent = text;
    },
    setText(node, text) {
      node.nodeValue = text;
    },
    querySelector(selector) {
      return document.querySelector(selector);
    },
    parentNode(node) {
      return node.parentNode;
    },
    nextSibling(node) {
      return node.nextSibling;
    }
  };

  // packages/runtime-dom/src/modules/attr.ts
  var patchAttr = (el, key, nextValue) => {
    if (nextValue) {
      el.setAttribute(key, nextValue);
    } else {
      el.removeAttribute(key);
    }
  };

  // packages/runtime-dom/src/modules/class.ts
  var patchClass = (el, nextValue) => {
    if (nextValue === null) {
      el.removeAttribute("class");
    } else {
      el.className = nextValue;
    }
  };

  // packages/runtime-dom/src/modules/event.ts
  var createInvokers = (callback) => {
    const invoker = (event) => invoker.value(event);
    invoker.value = callback;
    return invoker;
  };
  var patchEvent = (el, eventName, nextValue) => {
    let invokers = el._vei || (el._vei = {});
    let exitsEvent = invokers[eventName];
    if (exitsEvent && nextValue) {
      exitsEvent.value = nextValue;
    } else {
      let event = eventName.slice(2).toLowerCase();
      if (nextValue) {
        const invoker = invokers[eventName] = createInvokers(nextValue);
        el.addEventListener(event, invoker);
      } else if (exitsEvent) {
        el.removeEventListener(event, exitsEvent);
        invokers[eventName] = void 0;
      }
    }
  };

  // packages/runtime-dom/src/modules/style.ts
  var patchStyle = (el, preValue, nextValue = {}) => {
    for (let key in nextValue) {
      el.style[key] = nextValue[key];
    }
    if (preValue) {
      for (let key in preValue) {
        if (!nextValue[key]) {
          el.style[key] = null;
        }
      }
    }
  };

  // packages/runtime-dom/src/patchProp.ts
  var patchProp = (el, key, preValue, nextValue) => {
    if (key === "class") {
      patchClass(el, nextValue);
    } else if (key === "style") {
      patchStyle(el, preValue, nextValue);
    } else if (/^on[^a-z]/.test(key)) {
      patchEvent(el, key, nextValue);
    } else {
      patchAttr(el, key, nextValue);
    }
  };

  // packages/runtime-dom/src/index.ts
  var renderOptions = Object.assign(nodeOps, { patchProp });
  var render = (vNode, container) => {
    createRenderer(renderOptions).render(vNode, container);
  };
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=runtime-dom.global.js.map
