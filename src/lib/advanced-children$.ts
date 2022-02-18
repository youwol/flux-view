/**
 * # Introduction
 *
 * When working with domain data that generates an array of [[VirtualDOM]]
 * the function [[children$]] has already been presented.
 *
 * However, as explained in its documentation, it is not the most efficient
 * solution as each time the source observable emit new data the DOM children
 * are flushed and re-created from scratch.
 *
 * If performance becomes an issue, the functions provided here add extra pieces
 * of logic to avoid flushing all the children and re-rendering them all each time a new elements are emitted.
 *
 * The library provides 2 policies for such case:
 * -   [[AppendOnlyChildrenStream$]]: when a new array of domains data is emitted,
 * corresponding DOM elements are always appended as children, no replacements, no deletions.
 * -   [[ReplaceChildrenStream$]]: when a new array of domains data is emitted, only new elements
 * are created, previous elements that are not part of the new array are removed. Element comparison
 * is by default references comparison (valid if domain data are immutables), but a custom function can be provided.
 *
 * @module advancedChildren$
 */

import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { render } from './core'
import { InterfaceHTMLElement$, VirtualDOM } from './interface'

/**
 *
 * @deprecated use orderOperator
 */
export interface TOptionsWithOrderingIndex<TDomain> {
    /**
     * @param data
     * @deprecated use orderOperator
     */
    orderingIndex?: (data: TDomain) => number
    orderOperator?: never
}
export type TOptions<TDomain> = {
    sideEffects?: (
        parent: InterfaceHTMLElement$,
        update: RenderingUpdate<TDomain>,
    ) => void
} & (
    | TOptionsWithOrderingIndex<TDomain>
    | {
          orderingIndex?: never
          orderOperator?: (d1: TDomain, d2: TDomain) => number
      }
)

/**
 * ## RefElement
 *
 * RefElement references the three component of a view (related
 * to the function [[advancedChildren$]] when *sideEffects* is called):
 * -    domainData: the domain data
 * -    virtualDom: the virtual dom as defined by the developer
 * -    element: the actual [[HTMLElement$]]
 */
export class RefElement<TDomain> {
    /**
     * domainData
     */
    public readonly domainData: TDomain
    /**
     * the virtual DOM as defined by the developer
     */
    public readonly virtualDOM: VirtualDOM
    /**
     * the actual DOM element
     */
    public readonly element: InterfaceHTMLElement$

    constructor({
        domainData,
        virtualDOM,
        element,
    }: {
        domainData: TDomain
        virtualDOM: VirtualDOM
        element: InterfaceHTMLElement$
    }) {
        this.domainData = domainData
        this.virtualDOM = virtualDOM
        this.element = element
    }
}

/**
 * ## RenderingUpdate
 *
 * This class describes an update when DOM has been modified through the use
 * of [[advancedChildren$]]; it provides the list of **added**, **updated**, and **removed**
 * [[RefElement]].
 *
 */
export class RenderingUpdate<TDomain> {
    constructor(
        public readonly added: RefElement<TDomain>[],
        public readonly updated: RefElement<TDomain>[],
        public readonly removed: RefElement<TDomain>[],
    ) {}
}

/**
 * ## ChildrenStream$
 *
 * Base class used to define advanced **children** policy in [[VirtualDOM]] when
 * the source stream emit **array** of domain data.
 *
 * You can derive you own class by providing the implementation of [[update]].
 *
 * Example of use: [[AppendOnlyPolicy]], [[ReplacePolicy]].
 */
export abstract class ChildrenStream$<TDomain> {
    ClassType = 'ChildrenStream$'
    /**
     * Callback that gets called when the DOM has been updated.
     * @param parent parent: parent [[HTMLElement$]]
     * @param update update: description of the update, see [[RenderingUpdate]]
     */
    public readonly sideEffects: (
        parent: InterfaceHTMLElement$,
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
     * @param vDomMap mapping function domain data => [[VirtualDOM]]
     * @param sideEffects see [[sideEffects]]
     * @param orderingFunction see [[orderingFunction]]
     */
    protected constructor(
        public readonly stream$: Observable<Array<TDomain>>,
        public readonly vDomMap: (tDomain: TDomain, ...args) => VirtualDOM,
        { sideEffects, orderingIndex, orderOperator }: TOptions<TDomain>,
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
        parentElement: InterfaceHTMLElement$,
        domainData: Array<TDomain>,
    ): RenderingUpdate<TDomain>

    /**
     * Only for internal use (within [[HTMLElement$]]), should not actually be exposed.
     */
    subscribe(parentElement: InterfaceHTMLElement$) {
        return this.stream$
            .pipe(
                map((domains: TDomain[]) => {
                    return this.update(parentElement, domains)
                }),
            )
            .subscribe(
                (updates) =>
                    this.sideEffects &&
                    this.sideEffects(parentElement, updates),
            )
    }

    protected addChildRef(
        parentElement: InterfaceHTMLElement$,
        ref: RefElement<TDomain>,
    ) {
        this.children.push(ref)
        if (this.orderOperator) {
            this.children.sort((a, b) =>
                this.orderOperator(a.domainData, b.domainData),
            )
        }
        const rank = this.children.indexOf(ref) + 1
        if (rank == this.children.length) {
            parentElement.appendChild(ref.element)
        } else {
            parentElement.insertBefore(ref.element, this.children[rank].element)
        }
    }

    protected removeChildRef(ref: RefElement<TDomain>) {
        this.children.splice(this.children.indexOf(ref), 1)
        ref.element.remove()
    }
}

export function instanceOfChildrenStream$<T>(
    obj: unknown,
): obj is ChildrenStream$<T> {
    return obj && (obj as ChildrenStream$<T>).ClassType === 'ChildrenStream$'
}

/**
 *
 * ## AppendOnlyChildrenStream$
 *
 * Use case: when the emitting source of the array of domain data is always emitting new data
 * for which associated DOM nodes need to be added.
 *
 * In practice it is often used through the companion function [[childrenAppendOnly$]]
 *
 * For instance:
 *
 *```typescript
 * class DomainData{
 *    constructor( public readonly value: string){}
 *}
 *let hello = new DomainData("hello")
 *let world = new DomainData("world")
 *let foo = new DomainData("foo")
 *let stream$ = new BehaviorSubject<DomainData[]>([hello, world])
 *let vDOM = {
 *    children: appendOnlyChildren$(
 *        stream$,
 *        (data: DomainData) => ({innerText: data.value})
 *    )
 *}
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
 *```
 *
 */
export class AppendOnlyChildrenStream$<
    TDomain,
> extends ChildrenStream$<TDomain> {
    public readonly untilFirst
    public readonly sideEffects

    constructor(
        public readonly stream$: Observable<TDomain[]>,
        public readonly vDomMap: (tDomain: TDomain, ...args) => VirtualDOM,
        options: TOptions<TDomain>,
    ) {
        super(stream$, vDomMap, options)
    }

    protected update(
        parentElement: InterfaceHTMLElement$,
        domainData: TDomain[],
    ): RenderingUpdate<TDomain> {
        const added = domainData.map((d) => {
            const vDom = this.vDomMap(d)
            return new RefElement<TDomain>({
                domainData: d,
                virtualDOM: vDom,
                element: render(vDom),
            })
        })
        added.forEach((ref) => this.addChildRef(parentElement, ref))

        return new RenderingUpdate(added, [], [])
    }
}

/**
 *
 * ## childrenAppendOnly$
 *
 * Creation function companion of [[AppendOnlyChildrenStream$]].
 *
 *
 * @param stream$ The stream of array of domain data
 * @param vDomMap The mapping between DomainData and [[VirtualDOM]]
 * @param options
 * -    parent: [[HTMLElement$]] parent element
 * -    update: description of the update using [[RenderingUpdate]]
 * @returns
 * @template TDomain Domain data type
 */
export function childrenAppendOnly$<TDomain>(
    stream$: Observable<TDomain[]>,
    vDomMap: (data: TDomain, ...args: unknown[]) => VirtualDOM,
    options: TOptions<TDomain> = {},
): AppendOnlyChildrenStream$<TDomain> {
    return new AppendOnlyChildrenStream$<TDomain>(
        stream$,
        (data: TDomain, ...args) => vDomMap(data, ...args),
        options,
    )
}

export type TOptionsWithComparison<TDomain> = TOptions<TDomain> & {
    comparisonOperator?: (d1: TDomain, d2: TDomain) => boolean
}

/**
 * ## ReplaceChildrenStream$
 *
 * Use case: when the emitting source of the array of domain data re-use some of its element.
 *
 * In practice, it is often used through the companion function [[childrenWithReplace$]]
 *
 * For instance:
 *
 *```typescript
 * class DomainData{
 *    constructor( public readonly value: string){}
 *}
 *let hello = new DomainData("hello")
 *let world = new DomainData("world")
 *let foo = new DomainData("foo")
 *let stream$ = new BehaviorSubject<DomainData[]>([hello, world])
 *let vDOM = {
 *    children: childrenWithReplace$(
 *        stream$,
 *        (data: DomainData) => ({innerText: data.value})
 *    )
 *}
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
 *```
 * The key points in the above example is that when *stream$.next([hello, foo])* is called:
 * -    ```<div> hello </div>``` was not re-rendered in any way
 * -    ```<div> world </div>``` has been removed
 * -    ```<div> foo </div>``` has been added
 * -    the policy does domain data comparison (to identify which elements are new or old) using reference by default,
 * a custom comparison operator can also be supplied.
 */
export class ReplaceChildrenStream$<TDomain> extends ChildrenStream$<TDomain> {
    /**
     * Comparison operator used to identify which elements need to be added/ updated/ replaced.
     * By default, reference equality is used, ideal when the domain data are immutables.
     */
    public readonly comparisonOperator: (rhs: TDomain, lhs: TDomain) => boolean

    constructor(
        public readonly stream$: Observable<TDomain[]>,
        public readonly vDomMap: (tDomain: TDomain, ...args) => VirtualDOM,
        options: TOptionsWithComparison<TDomain>,
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
        parentElement: InterfaceHTMLElement$,
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
        const addedRefElem = newData.map(
            (d, i) =>
                new RefElement<TDomain>({
                    domainData: d,
                    virtualDOM: newVirtualDOMs[i],
                    element: rendered[i],
                }),
        )
        addedRefElem.forEach((ref) => this.addChildRef(parentElement, ref))

        const deletedRefElem = this.actualElements.filter((candidate) =>
            this.isNotInList(expectedData, candidate.domainData),
        )
        deletedRefElem.forEach((ref) => this.removeChildRef(ref))
        const deletedData = deletedRefElem.map((ref) => ref.domainData)

        this.actualElements = [
            ...this.actualElements.filter((candidate) =>
                this.isNotInList(deletedData, candidate.domainData),
            ),
            ...addedRefElem,
        ]

        return new RenderingUpdate(addedRefElem, [], deletedRefElem)
    }

    private isNotInList(list: TDomain[], candidate: TDomain): boolean {
        return (
            list.find((item) => this.comparisonOperator(item, candidate)) ===
            undefined
        )
    }
}

/**
 * ## childrenWithReplace$
 *
 * Creation function companion of [[ReplaceChildrenStream$]].
 *
 * @param stream$ The stream of array of domain data
 * @param vDomMap The mapping between DomainData and [[VirtualDOM]]
 * @param options
 * -    parent: [[HTMLElement$]] parent element
 * -    update: description of the update using [[RenderingUpdate]]
 * @returns
 * @template TDomain Domain data type
 */
export function childrenWithReplace$<TDomain>(
    stream$: Observable<TDomain[]>,
    vDomMap: (tDomain: TDomain, ...args) => VirtualDOM,
    options: TOptionsWithComparison<TDomain> = {},
): ReplaceChildrenStream$<TDomain> {
    return new ReplaceChildrenStream$<TDomain>(
        stream$,
        (data: TDomain, ...args) => vDomMap(data, ...args),
        options,
    )
}
