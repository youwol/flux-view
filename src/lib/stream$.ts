import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { VirtualDOM } from './interface'

/**
 * A RxJs observable that represents a DOM's attribute ({@link attr$}), child ({@link child$}) or children ({@link children$}).
 *
 * @param TDomain the domain data type
 * @param TDom the DOM data type: either :
 *     - {@link AttributeType} for attributes
 *     - {@link VirtualDOM} for child
 *     - list of {@link VirtualDOM}> for children
 *
 * @category Advanced
 */
export class Stream$<TDomain, TDom = TDomain> {
    ClassType = 'Stream$'

    public readonly untilFirst: TDom
    public readonly wrapper: (tDom: TDom) => TDom
    public readonly sideEffects: (tDomain: TDomain, tDom: TDom) => void

    /**
     * @param source$  domain's data stream defined as a RxJS observable
     * @param vDomMap mapping
     * @param vDomMap function that convert the domain's data to a vDOM attribute
     * @param untilFirst is the data that will be used until the first emitted element in *stream$* is obtained.
     *  If not provided, the attribute/child does not exist until first emission.
     * @param wrapper is a function that is used to alter the data returned by *vDomMap*.
     * @param sideEffects is a function that provides a handle to execute side effects once the
     * attribute/child as been set/added; both the domain's data and the rendered HTMLElement are provided to this function.
     */
    constructor(
        public readonly source$: Observable<TDomain>,
        public readonly vDomMap: (tDomain: TDomain, ...args) => TDom,
        {
            untilFirst,
            wrapper,
            sideEffects,
        }: {
            untilFirst?: TDom
            wrapper?: (tDom: TDom) => TDom
            sideEffects?: (tDomain: TDomain, tDom: TDom) => void
        },
    ) {
        this.untilFirst = untilFirst
        this.wrapper = wrapper
        this.sideEffects = sideEffects
    }

    /**
     * Implementation function that supposed to be called only by {@link HTMLElement$}.
     */
    subscribe(realizeDom: (tDom: TDom, ...args) => TDom, ...withData) {
        const mappedSource$: Observable<[TDom, TDomain]> = this.source$.pipe(
            map((d: TDomain) => [this.vDomMap(d, ...withData), d]),
        )

        this.untilFirst && this.finalize(realizeDom, this.untilFirst, undefined)

        return mappedSource$.subscribe(([v, d]: [TDom, TDomain]) => {
            this.finalize(realizeDom, v, d)
        })
    }

    private finalize(
        realizeDom: (tDom: TDom, ...args) => TDom,
        value: TDom,
        d: TDomain,
    ) {
        const vWrapped = this.wrapper ? this.wrapper(value) : value
        const v1 = realizeDom(vWrapped)
        this.sideEffects && this.sideEffects(d, v1)
    }
}

export function instanceOfStream$<TDomain, TDom = TDomain>(
    obj: unknown,
): obj is Stream$<TDomain, TDom> {
    return obj && (obj as Stream$<TDomain, TDom>).ClassType === 'Stream$'
}

/**
 * Type alias for attributes in {@link VirtualDOM}.
 *
 * @category Reactive Attribute
 */
export type AttributeType =
    | number
    | string
    | boolean
    | { [key: string]: number | string | boolean }

/**
 * Option definition for the function {@link child$}.
 *
 * @category Reactive Child
 */
export type ChildOption<TDomain> = {
    /**
     * Virtual DOM to display before any item have been emitted from the `source$` used in {@link child$}.
     */
    untilFirst?: VirtualDOM
    /**
     * @param tDom Virtual DOM returned by the mapping function in {@link child$}
     * @return actual Virtual DOM to use in the rendering (serves as factorizing some final transformations).
     */
    wrapper?: (tDom: VirtualDOM) => VirtualDOM
    /**
     * Execute side effects once the element has been updated.
     *
     * @param tDomain value of the domain data
     * @param vDom final virtual DOM value
     */
    sideEffects?: (tDomain: TDomain, vDom: VirtualDOM) => void
}

/**
 *
 * Defines a reactive child to be used within {@link VirtualDOM}.
 *
 * ``` typescript
 * let domain$ : Observable<{name:string}>
 *
 * let vDOM = {
 *      tag: 'div',
 *      children:[
 *          child$(
 *              domain$,
 *              ({name}) => ({innerText: 'Hello '+ name}),
 *              {   sideEffects: (vDom, htmlElem) => console.log(vDom, htmlElem),
 *                  untilFirst: ({innerText: 'No name available yet'})
 *              }
 *          )
 *     )
 * }
 * ```
 *
 * @param source$ source observable of domain data
 * @param mappingFct mapping function to {@link VirtualDOM}
 * @param option: options
 * @template TDomain type of the domain data
 * @category Reactive Child
 * @category Entry Points
 */
export function child$<TDomain>(
    source$: Observable<TDomain>,
    mappingFct: (tDomain: TDomain) => VirtualDOM,
    option: ChildOption<TDomain> = {},
) {
    return new Stream$<TDomain, VirtualDOM>(
        source$,
        (data: TDomain) => mappingFct(data),
        option,
    )
}

/**
 * Option definition for the function {@link attr$}.
 *
 * @category Reactive Attribute
 */
export type AttrOption<TDomain, TAttr = AttributeType> = {
    /**
     * Value of the attribute to use before any item have been emitted from the `source$` used in {@link attr$}.
     */
    untilFirst?: TAttr
    /**
     * @param attr Attribute value returned by the mapping function in {@link attr$}
     * @return actual attribute value to use in the rendering (serves as factorizing some final transformations).
     */
    wrapper?: (attr: TAttr) => TAttr
    /**
     * Execute side effects once the attribute has been updated.
     *
     * @param tDomain value of the domain data
     * @param vDom final attribute value
     */
    sideEffects?: (tDomain: TDomain, tDom: TAttr) => void
}
/**
 * Defines a reactive attribute to be used within {@link VirtualDOM}.
 *
 * ``` typescript
 * let domain$ : Observable<{name:string}>
 *
 * let vDOM = {
 *      tag: 'div',
 *      innerText: attr$(
 *          domain$,
 *          ({name}) => name,
 *          {   wrapper: (name) => 'Hello '+ name,
 *              sideEffects: (vDom, htmlElem) => console.log(vDom, htmlElem),
 *              untilFirst: 'No name available yet'
 *          }
 *      )
 * }
 * ```
 * @param source$ source observable of domain data
 * @param mappingFct mapping function to {@link AttributeType}
 * @param option: options
 * @template TDomain type of the domain data
 * @template TAttr type of the attribute
 * @category Reactive Attribute
 * @category Entry Points
 */
export function attr$<TDomain, TAttr = AttributeType>(
    source$: Observable<TDomain>,
    mappingFct: (tDomain: TDomain) => TAttr,
    option: AttrOption<TDomain, TAttr> = {},
) {
    return new Stream$<TDomain, TAttr>(
        source$,
        (data: TDomain) => mappingFct(data),
        option,
    )
}

/**
 *
 * Option definition for the function {@link children$}.
 *
 * @category Reactive Children
 */
export type ChildrenOption<TDomain> = {
    /**
     * List of the {@link VirtualDOM} to use before any item have been emitted from the `source$` used in {@link children$}.
     */
    untilFirst?: VirtualDOM[]
    /**
     * @param vDOMs List of the {@link VirtualDOM} value returned by the mapping function in {@link attr$}
     * @return actual list of {@link VirtualDOM} to use in the rendering (serves as factorizing some final transformations).
     */
    wrapper?: (vDOMs: VirtualDOM[]) => VirtualDOM[]
    /**
     * Execute side effects once the list of {@link VirtualDOM} has been updated.
     *
     * @param tDomain value of the domain data
     * @param vDom final list of {@link VirtualDOM}
     */
    sideEffects?: (tDomain: TDomain, vDOMs: VirtualDOM[]) => void
}

/**
 *
 * Defines a reactive list of children to be used within {@link VirtualDOM}.
 * This function trigger a complete refresh at each emission of `source$`: all actual children are removed,
 * and all children returned by `mappingFct` are created.
 * Better optimized behaviors are proposed in {@link childrenAppendOnly$} and {@link childrenFromStore$}
 *
 * ``` typescript
 * let domain$ : Observable<{name:string}[]>
 *
 * let vDOM = {
 *      tag: 'div',
 *      id: 'parent-element',
 *      children: children$(
 *          domains$,
 *          (elements) => elements.map( ({name}) => ({innerText: 'Hello'})
 *      )
 * }
 * ```
 *
 * @param source$ source observable of domain data
 * @param mappingFct mapping function to a list of {@link VirtualDOM}
 * @param option: options
 * @template TDomain type of the domain data
 * @category Reactive Children
 * @category Entry Points
 */
export function children$<TDomain>(
    source$: Observable<TDomain>,
    mappingFct: (tDomain: TDomain) => VirtualDOM[],
    option: ChildrenOption<TDomain> = {},
) {
    return new Stream$<TDomain, VirtualDOM[]>(
        source$,
        (data: TDomain) => mappingFct(data),
        option,
    )
}
