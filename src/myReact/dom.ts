import { Props, Element, ElementType, TEXT_ELEMENT } from './model'

const createTextElement = (text: string): Element => ({
  type: TEXT_ELEMENT,
  props: {
    nodeValue: text,
    children: []
  }
})

export const createElement = (type: ElementType, props: Props, ...children: Element[]): Element => ({
  type,
  props: {
    ...props,
    children: children.map(child => (typeof child === 'object' ? child : createTextElement(child)))
  }
})

const toEventType = (key: string) => key.toLocaleLowerCase().substring(2)

const setValue = (dom: HTMLElement | Text, key: string, value: string) =>
  dom instanceof HTMLElement ? dom.setAttribute(key, value) : (dom.nodeValue = value)

// @ts-ignore
const isEvent = (key: string) => key.startsWith('on')
const isProperty = (key: string) => key !== 'children' && !isEvent(key)
const isNew = (prev: Props, next: Props) => (key: string) => prev[key] !== next[key]
const isGone = (next: Props) => (key: string) => !(key in next)

export const createDom = (element: Element) => {
  if (element.type instanceof Function) {
    return null
  }

  if (element.type === TEXT_ELEMENT) {
    return document.createTextNode(element.props.nodeValue!)
  }

  const dom = document.createElement(element.type)

  Object.keys(element.props)
    .filter(isEvent)
    .forEach(name => dom.addEventListener(toEventType(name), element.props[name]))

  Object.keys(element.props)
    .filter(isProperty)
    .forEach(name => dom.setAttribute(name, element.props[name]))

  return dom
}

export const updateDom = (dom: HTMLElement | Text, prevProps: Props, nextProps: Props) => {
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(key => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach(name => dom.removeEventListener(toEventType(name), prevProps[name]))

  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(nextProps))
    .forEach(name => setValue(dom, name, ''))

  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => setValue(dom, name, nextProps[name]))

  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => dom.addEventListener(toEventType(name), nextProps[name]))
}
