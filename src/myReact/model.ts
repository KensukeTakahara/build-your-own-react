export const TEXT_ELEMENT = 'TEXT_ELEMENT' as const
type TagType = string
export type ElementType = typeof TEXT_ELEMENT | TagType | Function

type EffectTagType = 'UPDATE' | 'PLACEMENT' | 'DELETION'

export interface Props {
  nodeValue?: string
  children: Element[]
  [key: string]: any
}

export interface Element {
  type: ElementType
  props: Props
}

type Hook<T> = { state: T; queue: ((arg: T) => void)[] }

export type Fiber =
  | ({
      dom: HTMLElement | Text
      alternate: Fiber
      effectTag: EffectTagType
      parent?: Fiber
      child?: Fiber
      sibling?: Fiber
      hooks?: Hook<any>[]
    } & Element)
  | null
