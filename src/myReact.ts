// 拡張を頑張れば有効なタグの種類を指定できる
const TEXT_ELEMENT = "TEXT_ELEMENT" as const;
type TagType = string;
type ElementType = typeof TEXT_ELEMENT | TagType;

interface Props {
  nodeValue?: string;
  children?: Element[];
  [s: string]: any;
}

interface Element {
  type: ElementType;
  props: Props;
}

const createElement = (
  type: ElementType,
  props: Props,
  ...children: Element[]
) => ({
  type,
  props: {
    ...props,
    children: children.map(child =>
      typeof child === "object" ? child : createTextElement(child)
    )
  }
});

const createTextElement = (text: string) => ({
  type: TEXT_ELEMENT,
  props: {
    nodeValue: text
  }
});

const render = (element: Element, container: HTMLElement) => {
  if (element.type === TEXT_ELEMENT) {
    const dom = document.createTextNode(element.props.nodeValue!);
    container.append(dom);
    return;
  }

  const dom = document.createElement(element.type);
  const isProperty = (key: string) => key !== "children";
  Object.keys(element.props)
    .filter(isProperty)
    .forEach(name => dom.setAttribute(name, element.props[name]));

  element.props.children.forEach(child => render(child, dom));
  container.append(dom);
};

export default {
  createElement,
  render
};
