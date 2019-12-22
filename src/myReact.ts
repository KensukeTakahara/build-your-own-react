// 拡張を頑張れば有効なタグの種類を指定できる
const TEXT_ELEMENT = "TEXT_ELEMENT" as const;
type TagType = string;
type ElementType = typeof TEXT_ELEMENT | TagType;

type EffectTagType = "UPDATE" | "PLACEMENT" | "DELETION";

interface Props {
  nodeValue?: string;
  children: Element[];
  [s: string]: any;
}

interface Element {
  type: ElementType;
  props: Props;
}

type Fiber =
  | ({
      dom: HTMLElement | Text;
      alternate: Fiber;
      parent?: Fiber;
      child?: Fiber;
      sibling?: Fiber;
      effectTag: EffectTagType;
    } & Element)
  | null;

const createElement = (
  type: ElementType,
  props: Props,
  ...children: Element[]
): Element => ({
  type,
  props: {
    ...props,
    children: children.map(child =>
      typeof child === "object" ? child : createTextElement(child)
    )
  }
});

const createTextElement = (text: string): Element => ({
  type: TEXT_ELEMENT,
  props: {
    nodeValue: text,
    children: []
  }
});

const toEventType = (key: string) => key.toLocaleLowerCase().substring(2);

// @ts-ignore
const isEvent = (key: string) => key.startsWith("on");
const isProperty = (key: string) => key !== "children" && !isEvent(key);
const isNew = (prev: Props, next: Props) => (key: string) =>
  prev[key] !== next[key];
const isGone = (next: Props) => (key: string) => !(key in next);

const createDom = (element: Element) => {
  if (element.type === TEXT_ELEMENT) {
    return document.createTextNode(element.props.nodeValue!);
  }

  const dom = document.createElement(element.type);

  Object.keys(element.props)
    .filter(isEvent)
    .forEach(name =>
      dom.addEventListener(toEventType(name), element.props[name])
    );

  Object.keys(element.props)
    .filter(isProperty)
    .forEach(name => dom.setAttribute(name, element.props[name]));

  return dom;
};

const setValue = (dom: HTMLElement | Text, key: string, value: string) =>
  dom instanceof HTMLElement
    ? dom.setAttribute(key, value)
    : (dom.nodeValue = value);

const updateDom = (
  dom: HTMLElement | Text,
  prevProps: Props,
  nextProps: Props
) => {
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(key => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach(name =>
      dom.removeEventListener(toEventType(name), prevProps[name])
    );

  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(nextProps))
    .forEach(name => setValue(dom, name, ""));

  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => setValue(dom, name, nextProps[name]));

  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => dom.addEventListener(toEventType(name), nextProps[name]));
};

const commitRoot = () => {
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
};

const commitWork = (fiber: Fiber) => {
  if (!fiber) {
    return;
  }

  const domParent = fiber.parent.dom;
  if (fiber.effectTag === "PLACEMENT" && fiber.dom !== null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom !== null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === "DELETION") {
    domParent.removeChild(fiber.dom);
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
};

const requestIdleCallbackFunc = (window as any).requestIdleCallback;

let nextUnitOfWork: Fiber = null;
let currentRoot: Fiber = null;
let wipRoot: Fiber = null;
let deletions: Fiber[] = [];

const render = (element: Element, container: HTMLElement) => {
  wipRoot = {
    type: container.tagName,
    props: {
      children: [element]
    },
    dom: container,
    alternate: currentRoot,
    effectTag: "PLACEMENT"
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
};

const workLoop = (deadline: any) => {
  let shouldYield = null;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  requestIdleCallbackFunc(workLoop);
};

requestIdleCallbackFunc(workLoop);

const performUnitOfWork = (fiber: Fiber) => {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  const elements = fiber.props.children;
  reconcileChildren(fiber, elements);

  if (fiber.child) {
    return fiber.child;
  }

  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }

    nextFiber = nextFiber.parent;
  }
};

const reconcileChildren = (wipFiber: Fiber, elements: Element[]) => {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling: Fiber = null;

  while (index < elements.length || oldFiber !== null) {
    const element = elements[index];
    let newFiber: Fiber = null;

    const sameType = oldFiber && element && oldFiber.type === element.type;

    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE"
      };
    }

    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT"
      };
    }

    if (oldFiber && !sameType) {
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      wipFiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }
};

export default {
  createElement,
  render
};
