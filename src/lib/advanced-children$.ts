import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { HTMLElement$, render } from './core'
import { VirtualDOM } from './interface'

/**
 * Specifies the side effects associated to an update of children.
 *
 * @category Reactive Children
 */
export type ChildrenUpdateTrait<TDomain> = {
    /**
     * Execute side effects once the children have been updated.
     *
     * @param parent parent of the children
     * @param update description of the update
     */
    sideEffects?: (
        parent: HTMLElement$,
        update: RenderingUpdate<TDomain>,
    ) => void
}

/**
 * Specifies the order in which children are included in the parent element.
 *
 * @category Reactive Children
 */
export type OrderingTrait<TDomain> = {
    /**
     * @hidden
     * @deprecated use orderOperator
     */
    orderingIndex?: (data: TDomain) => number
    /**
     * Specifies how the children are ordered in the parent element.
     * Order is defined using this callback.
     *
     * @param d1 Domain data associated to the first element for comparison
     * @param d2 Domain data associated to the second element for comparison
     * @return a value:
     * -    if `>0`, sort `d1` after `d2`
     * -    if `<0`, sort `d1` before `d2`
     */
    orderOperator?: (d1: TDomain, d2: TDomain) => number
}

/**
 * ## RefElement
 *
 * Encapsulates domainData, VirtualDOM & HTMLElement.
 *
 * @category Reactive Children
 */
export type RefElement<TDomain> = {
    /**
     * domainData
     */
    domainData: TDomain
    /**
     * the virtual DOM as defined by the developer
     */
    virtualDOM: VirtualDOM
    /**
     * the actual DOM element
     */
    element: HTMLElement$
}

/**
 * Describes an update when a DOM element has been modified when using {@link childrenAppendOnly$} or
 * {@link childrenFromStore$}.
 *
 * @category Reactive Children
 */
export type RenderingUpdate<TDomain> = {
    added: RefElement<TDomain>[]
    updated: RefElement<TDomain>[]
    removed: RefElement<TDomain>[]
}

/**
 * Base class used to define advanced **children** policy in {@link VirtualDOM} when
 * the source stream emit **array** of domain data.
 *
 * You can derive you own class by providing the implementation of {@link update}.
 *
 * Example of use: {@link AppendOnlyChildrenStream$}, {@link FromStoreChildrenStream$}.
 *
 * @category Advanced
 */
export abstract class ChildrenStream$<TDomain> {
    ClassType = 'ChildrenStream$'
    /**
     * Callback that gets called when the DOM has been updated.
     * @param parent parent: parent {@link HTMLElement$}
     * @param update update: description of the update, see {@link RenderingUpdate}
     */
    public readonly sideEffects: (
        parent: HTMLElement$,
        update: RenderingUpdate<TDomain>,
    ) => void

    /**
     * If orderingIndex is supplied, all children elements are sorted according to the index
     * @deprecated use domainComparator instead
     */
    public readonly orderingIndex: (data: TDomain) => number
    protected readonly orderOperator: (d1: TDomain, d2: TDomain) => number
    private readonly children: RefElement<TDomain>[] = []

    /**
     *
     * @param stream$ input stream
     * @param vDomMap mapping function domain data => {@link VirtualDOM}
     * @param sideEffects see {@link sideEffects}
     * @param orderingFunction see {@link orderOperator}
     */
    protected constructor(
        public readonly stream$: Observable<Array<TDomain>>,
        public readonly vDomMap: (tDomain: TDomain, ...args) => VirtualDOM,
        {
            sideEffects,
            orderingIndex,
            orderOperator,
        }: ChildrenUpdateTrait<TDomain> &
            OrderingTrait<TDomain> &
            ComparisonTrait<TDomain>,
    ) {
        this.vDomMap = vDomMap
        this.sideEffects = sideEffects
        this.orderingIndex = orderingIndex
        if (orderingIndex) {
            this.orderOperator = (d1, d2) =>
                orderingIndex(d1) - orderingIndex(d2)
        } else if (orderOperator) {
            this.orderOperator = orderOperator
        } else {
            this.orderOperator = undefined
        }
    }

    protected abstract update(
        parentElement: HTMLElement$,
        domainData: Array<TDomain>,
    ): RenderingUpdate<TDomain>

    /**
     * Only for internal use (within {@link HTMLElement$}), should not actually be exposed.
     */
    subscribe(parentElement: HTMLElement$) {
        return this.stream$
            .pipe(
                map((domains: TDomain[]) => {
                    return this.update(parentElement, domains)
                }),
            )
            .subscribe((updates) => this.sideEffects?.(parentElement, updates))
    }

    protected addChildRef(
        parentElement: HTMLElement$,
        ref: RefElement<TDomain>,
    ) {
        this.children.push(ref)
        parentElement.appendChild(ref.element)
        this.reorder(parentElement)
    }

    protected removeChildRef(ref: RefElement<TDomain>) {
        this.children.splice(this.children.indexOf(ref), 1)
        ref.element.remove()
    }

    protected reorder(parentElement: HTMLElement$) {
        if (!this.orderOperator) {
            return
        }
        const parentStyle = window.getComputedStyle(parentElement)
        const display = parentStyle.getPropertyValue('display')
        if (display !== 'flex' && display !== 'grid') {
            console.error(
                'To enable dynamic re-ordering of elements in flux-view, parent element should have the css property ' +
                    "'display' set to 'flex' or 'grid'.",
                parentElement,
            )
        }
        // We don't sort in place: we want the VirtualDom children to be aligned with the real ones.
        // Ordering just affects the display property 'order'.
        const sorted = new Array(...this.children)
            .sort((a, b) => this.orderOperator(a.domainData, b.domainData))
            .map(({ element }) => element as HTMLElement)

        new Array(...parentElement.children).forEach(
            (elem: HTMLElement) =>
                (elem.style.order = `${sorted.indexOf(elem)}`),
        )
    }
}

export function instanceOfChildrenStream$<T>(
    obj: unknown,
): obj is ChildrenStream$<T> {
    return obj && (obj as ChildrenStream$<T>).ClassType === 'ChildrenStream$'
}

/**
 * See companion creation function {@link childrenAppendOnly$}.
 *
 * @category Advanced
 */
export class AppendOnlyChildrenStream$<
    TDomain,
> extends ChildrenStream$<TDomain> {
    public readonly untilFirst
    public readonly sideEffects

    constructor(
        public readonly stream$: Observable<TDomain[]>,
        public readonly vDomMap: (tDomain: TDomain, ...args) => VirtualDOM,
        options: ChildrenUpdateTrait<TDomain> & OrderingTrait<TDomain>,
    ) {
        super(stream$, vDomMap, options)
    }

    protected update(
        parentElement: HTMLElement$,
        domainData: TDomain[],
    ): RenderingUpdate<TDomain> {
        const added = domainData.map((d) => {
            const vDom = this.vDomMap(d)
            return {
                domainData: d,
                virtualDOM: vDom,
                element: render(vDom),
            }
        })
        added.forEach((ref) => this.addChildRef(parentElement, ref))

        return { added, updated: [], removed: [] }
    }
}
/**
 * Option definition for the function {@link childrenAppendOnly$}.
 *
 * @category Reactive Children
 */
export type ChildrenAppendOnlyOption<TDomain> = ChildrenUpdateTrait<TDomain> &
    OrderingTrait<TDomain>

/**
 *
 * Use case: when the emitting `source$` of the array of domain data is always emitting new data
 * for which associated DOM nodes need to be added.
 *
 * For instance:
 *
 * ```typescript
 * class DomainData{
 *    constructor( public readonly value: string){}
 * }
 * let hello = new DomainData("hello")
 * let world = new DomainData("world")
 * let foo = new DomainData("foo")
 * let stream$ = new BehaviorSubject<DomainData[]>([hello, world])
 * let vDOM = {
 *    children: appendOnlyChildren$(
 *        stream$,
 *        (data: DomainData) => ({innerText: data.value})
 *    )
 * }
 * body.appendChild(render(vDOM))
 * //<div>
 * //    <div> hello </div>
 * //    <div> world </div>
 * //</div>
 * stream$.next([hello, foo])
 * //<div>
 * //    <div> hello </div>
 * //    <div> foo </div>
 * //    <div> hello </div>
 * //    <div> foo </div>
 * //</div>
 * ```
 *
 * @param stream$ The stream of array of domain data
 * @param vDomMap The mapping between one DomainData and corresponding {@link VirtualDOM}
 * @param option
 * @template TDomain Domain data type
 * @category Reactive Children
 * @category Entry Points
 */
export function childrenAppendOnly$<TDomain>(
    stream$: Observable<TDomain[]>,
    vDomMap: (data: TDomain, ...args: unknown[]) => VirtualDOM,
    option: ChildrenAppendOnlyOption<TDomain> = {},
): AppendOnlyChildrenStream$<TDomain> {
    return new AppendOnlyChildrenStream$<TDomain>(
        stream$,
        (data: TDomain, ...args) => vDomMap(data, ...args),
        option,
    )
}
/**
 * Specifies whether two domain data represents the same {@link VirtualDOM} (or {@link HTMLElement}).
 *
 * @category Reactive Children
 */
export type ComparisonTrait<TDomain> = {
    /**
     * Default is to use reference equality.
     *
     * @param d1 first domain data for comparison
     * @param d2 second domain data for comparison
     * @return `true` if the `d1` and `d2` represents the same element, `false` otherwise.
     */
    comparisonOperator?: (d1: TDomain, d2: TDomain) => boolean
}

/**
 * See companion creation function {@link childrenFromStore$}.
 *
 * @category Advanced
 */
export class FromStoreChildrenStream$<
    TDomain,
> extends ChildrenStream$<TDomain> {
    /**
     * Comparison operator used to identify which elements need to be added/ updated/ replaced.
     * By default, reference equality is used, ideal when the domain data are immutables.
     */
    public readonly comparisonOperator: (rhs: TDomain, lhs: TDomain) => boolean

    constructor(
        public readonly stream$: Observable<TDomain[]>,
        public readonly vDomMap: (tDomain: TDomain, ...args) => VirtualDOM,
        options: ChildrenUpdateTrait<TDomain> &
            OrderingTrait<TDomain> &
            ComparisonTrait<TDomain>,
    ) {
        super(stream$, vDomMap, options)
        if (options.comparisonOperator) {
            this.comparisonOperator = options.comparisonOperator
        } else {
            this.comparisonOperator = (d1, d2) => d1 === d2
        }
    }

    private actualElements: RefElement<TDomain>[] = []

    protected update(
        parentElement: HTMLElement$,
        expectedData: Array<TDomain>,
    ): RenderingUpdate<TDomain> {
        const actualData = this.actualElements.map(
            (refElem) => refElem.domainData,
        )

        const newData = expectedData.filter((candidate) =>
            this.isNotInList(actualData, candidate),
        )
        const newVirtualDOMs = newData.map((d) => this.vDomMap(d))
        const rendered = newVirtualDOMs.map((vDOM) => render(vDOM))
        const addedRefElem = newData.map((d, i) => ({
            domainData: d,
            virtualDOM: newVirtualDOMs[i],
            element: rendered[i],
        }))
        addedRefElem.forEach((ref) => this.addChildRef(parentElement, ref))

        const deletedRefElem = this.actualElements.filter((candidate) =>
            this.isNotInList(expectedData, candidate.domainData),
        )
        deletedRefElem.forEach((ref) => this.removeChildRef(ref))
        const deletedData = deletedRefElem.map((ref) => ref.domainData)

        if (addedRefElem.length === 0 && deletedRefElem.length === 0) {
            // it may be the case that just the order as changed
            this.reorder(parentElement)
        }
        this.actualElements = [
            ...this.actualElements.filter((candidate) =>
                this.isNotInList(deletedData, candidate.domainData),
            ),
            ...addedRefElem,
        ]

        return { added: addedRefElem, updated: [], removed: deletedRefElem }
    }

    private isNotInList(list: TDomain[], candidate: TDomain): boolean {
        return (
            list.find((item) => this.comparisonOperator(item, candidate)) ===
            undefined
        )
    }
}
/**
 * Option definition for the function {@link childrenFromStore$}.
 *
 * @category Reactive Children
 */
export type ChildrenFromStoreOption<TDomain> = ChildrenUpdateTrait<TDomain> &
    OrderingTrait<TDomain> &
    ComparisonTrait<TDomain>

/**
 * @ignore
 * @hidden
 * @deprecated use childrenFromStore$
 */
export function childrenWithReplace$<TDomain>(
    stream$: Observable<TDomain[]>,
    vDomMap: (tDomain: TDomain, ...args) => VirtualDOM,
    options: ChildrenFromStoreOption<TDomain> = {},
): FromStoreChildrenStream$<TDomain> {
    return new FromStoreChildrenStream$<TDomain>(
        stream$,
        (data: TDomain, ...args) => vDomMap(data, ...args),
        options,
    )
}

/**
 * Use case: when the emitting `source$` of the array of domain data recycle some of its element.
 *
 * For instance:
 *
 * ```typescript
 * class DomainData{
 *    constructor( public readonly value: string){}
 * }
 * let hello = new DomainData("hello")
 * let world = new DomainData("world")
 * let foo = new DomainData("foo")
 * let stream$ = new BehaviorSubject<DomainData[]>([hello, world])
 * let vDOM = {
 *    children: childrenWithReplace$(
 *        stream$,
 *        (data: DomainData) => ({innerText: data.value})
 *    )
 * }
 * body.appendChild(render(vDOM))
 * //<div>
 * //    <div> hello </div>
 * //    <div> world </div>
 * //</div>
 * stream$.next([hello, foo])
 * //<div>
 * //    <div> hello </div>
 * //    <div> foo </div>
 * //</div>
 * ```
 * The key points in the above example is that when *stream$.next([hello, foo])* is called:
 * -    ```<div> hello </div>``` was not re-rendered
 * -    ```<div> world </div>``` has been removed
 * -    ```<div> foo </div>``` has been added
 * -    the policy does domain data comparison (to identify which elements are new or old) using reference by default,
 * a custom comparison operator can also be supplied.
 *
 * @param stream$ The stream of array of domain data
 * @param vDomMap The mapping between one DomainData and corresponding {@link VirtualDOM}
 * @param option
 * @template TDomain Domain data type
 * @category Reactive Children
 * @category Entry Points
 */
export function childrenFromStore$<TDomain>(
    stream$: Observable<TDomain[]>,
    vDomMap: (tDomain: TDomain, ...args) => VirtualDOM,
    option: ChildrenFromStoreOption<TDomain> = {},
): FromStoreChildrenStream$<TDomain> {
    return new FromStoreChildrenStream$<TDomain>(
        stream$,
        (data: TDomain, ...args) => vDomMap(data, ...args),
        option,
    )
}
