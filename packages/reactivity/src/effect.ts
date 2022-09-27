let uid = 0

export let activeEffect = undefined

export class ReactiveEffect {
  // 树型结构处理activeEffect
  public parent = null
  // 实例上新增active 代表effect默认是激活状态
  public isActive = true
  // effect记录key
  public deps = []
  public id = uid++
  constructor(public fn, public scheduler) {}
  // 执行effect
  run() {
    // 非激活状态 只需要执行函数 不需要依赖收集
    if (!this.isActive) {
      return this.fn()
    }
    // 依赖收集
    try {
      this.parent = activeEffect
      activeEffect = this
      // 清除之前的依赖 重新收集
      clearEffect(this)
      return this.fn()
    } finally {
      activeEffect = this.parent
      this.parent = null
    }
  }
  // 停止effect 3.2版本新引入api
  stop() {
    if (this.isActive) {
      this.isActive = false
      clearEffect(this)
    }
  }
}

function clearEffect(effect) {
  // 多对多之间的依赖 互相清空 此种方法只能清空effect与key之间的依赖 不能清空key与effect之间的依赖
  // effect.deps = []
  const { deps } = effect
  for (let i = 0 ; i < deps.length; i++) {
    deps[i].delete(effect)
  }
  effect.deps.length = []
}

export function effect(fn, options: any = {}) {
  // 创建响应式effect options.scheduler在派发跟新的时候调用传入的方法而非run()
  const _effect = new ReactiveEffect(fn, options.scheduler)
  // 默认执行一次effect
  _effect.run()
  const runner = _effect.run.bind(_effect)
  runner.effect = _effect
  return runner
}

const targetMap = new WeakMap()

export function trackEffects(dep) {
  if (activeEffect) {
    let isTrack = !dep.has(activeEffect)
    if (isTrack) {
      // key记录effect
      dep.add(activeEffect)
      // effect记录key对应是set
      activeEffect.deps.push(dep)
    }
  }
}

// 依赖收集
export function track(target, key) {
  // WeakMap {object: Map {key: set(effect)}}
  if (!activeEffect) return
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }
  let dep = depsMap.get(key)
  if (!dep) {
    depsMap.set(key, (dep = new Set()))
  }
  trackEffects(dep)
}

export function triggerEffects(effects) {
  // 拷贝一份effects 防止run()方法中清除依赖后又收集依赖 解决set删除新增然后遍历死循环的问题
  effects = new Set(effects)
  effects.forEach(effect => {
    // 防止死循环
    if (effect !== activeEffect) {
      if (effect.scheduler) {
        // 传入scheduler调用scheduler
        effect.scheduler()
      } else {
        effect.run()
      }
    }
  });
}

// 派发更新
export function trigger(target, key, newValue, oldValue) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return
  let effects = depsMap.get(key)
  if (effects) {
    triggerEffects(effects)
  }
}