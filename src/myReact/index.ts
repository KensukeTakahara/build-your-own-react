import { Element, Fiber } from './model'
import { createElement, createDom, updateDom } from './dom'
import { reconcileChildren as reconcileChildrenBase } from './reconciliation'

let nextUnitOfWork: Fiber = null
let currentRoot: Fiber = null
let wipRoot: Fiber = null
let deletions: Fiber[] = []

const reconcileChildren = reconcileChildrenBase(deletions)

const commitDeletion = (fiber: Fiber, domParent: HTMLElement | Text) => {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom)
  } else {
    commitDeletion(fiber.child, domParent)
  }
}

const commitWork = (fiber: Fiber) => {
  if (!fiber) {
    return
  }

  let domParentFiber = fiber.parent
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent
  }

  const domParent = domParentFiber.dom
  if (fiber.effectTag === 'PLACEMENT' && fiber.dom !== null) {
    domParent.appendChild(fiber.dom)
  } else if (fiber.effectTag === 'UPDATE' && fiber.dom !== null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props)
  } else if (fiber.effectTag === 'DELETION') {
    commitDeletion(fiber, domParent)
  }
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

const commitRoot = () => {
  deletions.forEach(commitWork)
  commitWork(wipRoot.child)
  currentRoot = wipRoot
  wipRoot = null
}

const requestIdleCallbackFunc = (window as any).requestIdleCallback
let wipFiber: Fiber = null
let hookIndex = 0

const updateFunctionComponent = (fiber: Fiber) => {
  if (fiber.type instanceof Function) {
    wipFiber = fiber
    hookIndex = 0
    wipFiber.hooks = []
    const children = [fiber.type(fiber.props)]
    reconcileChildren(fiber, children)
  }
}

const updateHostComponent = (fiber: Fiber) => {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }

  reconcileChildren(fiber, fiber.props.children)
}

const performUnitOfWork = (fiber: Fiber) => {
  const isFunctionComponent = fiber.type instanceof Function
  if (isFunctionComponent) {
    updateFunctionComponent(fiber)
  } else {
    updateHostComponent(fiber)
  }

  if (fiber.child) {
    return fiber.child
  }

  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }

    nextFiber = nextFiber.parent
  }
}

const workLoop = (deadline: any) => {
  let shouldYield = null
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
    shouldYield = deadline.timeRemaining() < 1
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot()
  }

  requestIdleCallbackFunc(workLoop)
}

requestIdleCallbackFunc(workLoop)

const useState = <T>(initial: T) => {
  const oldHook = wipFiber.alternate && wipFiber.alternate.hooks && wipFiber.alternate.hooks[hookIndex]
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [] as ((arg: T) => void)[]
  }

  const actions = oldHook ? oldHook.queue : []
  actions.forEach(action => {
    hook.state = action(hook.state)
  })

  const setState = (action: (arg: T) => void) => {
    hook.queue.push(action)
    wipRoot = {
      ...currentRoot,
      alternate: currentRoot
    }
    nextUnitOfWork = wipRoot
    deletions = []
  }

  wipFiber.hooks.push(hook)
  hookIndex++
  return [hook.state, setState]
}

const render = (element: Element, container: HTMLElement) => {
  wipRoot = {
    type: container.tagName,
    props: {
      children: [element]
    },
    dom: container,
    alternate: currentRoot,
    effectTag: 'PLACEMENT'
  }
  deletions = []
  nextUnitOfWork = wipRoot
}

export default {
  createElement,
  render,
  useState
}
