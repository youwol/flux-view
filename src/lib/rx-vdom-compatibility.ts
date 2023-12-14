import { VirtualDOM } from './interface'
import {
    childrenAppendOnly$,
    ChildrenAppendOnlyOption,
    childrenFromStore$,
    ChildrenFromStoreOption,
} from './advanced-children$'
import {
    attr$,
    AttrOption,
    child$,
    ChildOption,
    children$,
    ChildrenOption,
} from './stream$'
import { Observable } from 'rxjs'

// Following types are simplified type definition coming from rx-vdom
// Dependency rx-vdom is not used because:
// *  it would imply circular dependency rx-vdom -> flux-view -> rx-vdom
// *  consuming projects of flux-view would need to add rx-vdom as dependency

type ChildrenPolicy = 'append' | 'replace' | 'sync'

type RxChildren<T extends ChildrenPolicy> = {
    policy: T
    source$: Observable<unknown[]>
    vdomMap: () => unknown[]
}
type RxChild = {
    source$: Observable<unknown>
    vdomMap: () => unknown
}
type RxAttribute = {
    source$: Observable<unknown>
    vdomMap: () => unknown
}

function isRxChildren<Policy extends ChildrenPolicy>(
    v: unknown,
    policy: Policy,
): v is RxChildren<Policy> {
    const asRx = v as RxChildren<Policy>
    return (
        asRx?.source$ !== undefined &&
        asRx?.vdomMap !== undefined &&
        asRx?.policy === policy
    )
}

function isRxChild(v: unknown): v is RxChild {
    const asRx = v as RxChild
    return asRx?.source$ !== undefined && asRx?.vdomMap !== undefined
}

function isRxAttribute(v: unknown): v is RxAttribute {
    const asRx = v as RxChild
    return asRx?.source$ !== undefined && asRx?.vdomMap !== undefined
}

export function applyRxVdomMapper(vdom: VirtualDOM) {
    const children = vdom.children

    if (isRxChildren<'append'>(children, 'append')) {
        vdom.children = childrenAppendOnly$(
            children.source$,
            children.vdomMap,
            children as unknown as ChildrenAppendOnlyOption<unknown>,
        )
    }
    if (isRxChildren<'replace'>(children, 'replace')) {
        vdom.children = children$(
            children.source$,
            children.vdomMap,
            children as unknown as ChildrenOption<unknown>,
        )
    }
    if (isRxChildren<'sync'>(children, 'sync')) {
        vdom.children = childrenFromStore$(
            children.source$,
            children.vdomMap,
            children as unknown as ChildrenFromStoreOption<unknown>,
        )
    }
    if (Array.isArray(children)) {
        vdom.children = children.map((child: unknown) => {
            return isRxChild(child)
                ? child$(
                      child.source$,
                      child.vdomMap,
                      child as unknown as ChildOption<unknown>,
                  )
                : child
        })
    }
    Object.entries(vdom).forEach(([k, v]) => {
        if (k !== 'children' && isRxAttribute(v)) {
            vdom[k] = attr$(
                v.source$,
                v.vdomMap,
                v as unknown as AttrOption<unknown>,
            )
        }
    })
}
