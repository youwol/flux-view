/**
 * # Introduction
 *
 * ## VirtualDom & rendering
 *
 * The [[ VirtualDOM | virtual DOM]] is described by a JSON data-structure that mimics the structure of an HTML Node.
 * The benefit of using this (virtual) description is that it allows using [RxJs Observables](https://rxjs-dev.firebaseapp.com/guide/observable)
 * where in a regular description only plain values are accepted.
 *
 *
 * To turn a vDOM into a regular HTMLElement, use the function **render**:

 *```typescript
 * import { interval } from 'rxjs';
 * import { map, take } from 'rxjs/operators';
 * import { render, attr$ } from '@youwol/flux-view'
 *
 *
 * const nCount = 10
 * // timer$: tick 10 times every seconds
 * const timer$ = interval(1000).pipe(
 *     take(nCount),
 *     map( tick => nCount - tick)
 * )
 *
 * let vDom = {
 *     tag:'div',
 *     innerText: 'count down:',
 *     children:[
 *         {   tag:'div',
 *             innerText: attr$(
 *                 // input stream (aka domain stream)
 *                 timer$,
 *                // rendering mapping
 *                (countDown:number) => `Remaining: ${countDown} s`
 *             )
 *        }
 *     ]
 * }
 * let div : HTMLElement = render(vDom)
 * ```
 *
 *
 * ## **attr$**, **child$** and **children** functions
 *
 * The functions [[attr$]], [[child$]], and  [[children$]] functions are actually the same,
 * they differ only by their usages (a definition).

> The [[children$]] function is not efficient in terms of rendering. When performance matters, the function
> [[advancedChildren$]] should be used.

* It follows this common type's definition (the third arguments is optional):
* ```typescript
*function (
*    stream$: Observable<TData>,
*    viewMap: (TData) => TResult,
*    {
*        untilFirst,
*        wrapper,
*        sideEffects
*    }:
*    {   untilFirst?: TResult,
*        wrapper?: (TResult) => TResult,
*        sideEffects?: (TData, HTMLElement) => void
*    } = {},
*)
```
where:
- **stream$** is the domain's data stream defined as a RxJS observable
- **viewMap** is a function that convert the domain's data to a vDOM attribute.
In the case of the function *attr$*, *TResult* is the type of the target attribute.
In the case of the function *child$*, *TResult* is *VirtualDOM*.
In the case of the function *children$*, *TResult* is *Array\<VirtualDOM\>*.
- **untilFirst** is the data that will be used until the first emitted element in *stream$* is obtained. If not provided, the attribute/child does not exist until first emission.
    In such case, using a *BehaviorSubject* of RxJS (observable that directly emit a predefined value) is an alternative that can also be used.

```typescript
 * let vDom = {
 *   tag:'div', innerText: 'count down:',
 *   children:[
 *       {   tag:'div',
 *           innerText: attr$(
 *               timer$,
 *               ( countDown:number ) => `Remaining: ${countDown} s`,
 *               { untilFirst: "Waiting first count down..."}
 *           )
 *       }
 *   ]
*}

```
- **wrapper** is a function that is used to alter the data returned by **viewMap**. it is often used to factorize part of the viewMap function that are 'constant' with respect to the data in **stream$**.
For instance the following code factorizes the class *count-down-item*:
```typescript
* let vDom = {
*    tag:'div', innerText: 'count down:',
*    children:[
*        {   tag:'div',
*            class:  attr$(
*                timer$,
*                ( countDown:number ) => countDown <5 ? 'text-red' : 'text-green',
*                { wrapper: (classColor) => `count-down-item ${classColor}`}
*            ),
*            innerText: attr$( timer$, (countDown:number) => `${countDown} s`)
*        }
*    ]
* }
```
- **sideEffects** is a function that provides a handle to execute side effects once the
attribute/child has been set/added; both the domain's data and the rendered HTMLElement are provided to this function.

 *
 * @module stream$
 */

import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { VirtualDOM } from './interface'

/**
 * A RxJs observable that represents a DOM's attribute, child or children.
 *
 * @param TDomain the domain data type
 * @param TDom the DOM data type: either :
 *     - [[AttributeType]] for attributes (see [[attr$]])
 *     - [[VirtualDOM]] for child (see [[child$]])
 *     - Array<[[VirtualDOM]]> for children (see [[children$]])
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
     * Implementation function that supposed to be called only by [[HTMLElement$]].
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
 * Create a stream of DOM understandable element (attribute, child or children) from a RxJS observable.
 * It is usually called indirectly using [[attr$]], [[child$]] or [[children$]].
 *
 * @param source$  domain's data stream defined as a RxJS observable
 * @param vDomMap function that convert the domain's data to a vDOM attribute:
 * -    in the case of the function [[attr$]], *TDom* is [[AttributeType]].
 * -    in the case of the function [[child$]], *TDom* is [[VirtualDOM]].
 * -    in the case of the function [[children$]], *TDom* is Array<[[VirtualDOM]]>.
 * @param untilFirst is the data that will be used until the first emitted element in *stream$* is obtained.
 *  If not provided, the attribute/child does not exist until first emission.
 *  In such case, using a *BehaviorSubject* of RxJS (observable that directly emit a predefined value) is an alternative that can also be used.
 * @param wrapper is a function that is used to alter the data returned by *vDomMap*.
 * It is often used to factorize part of the viewMap function that are 'constant' with respect to the data in $stream$*
 * @param sideEffects is a function that provides a handle to execute side effects once the
 * attribute/child as been set/added; both the domain's data and the rendered HTMLElement are provided to this function.
 * For instance, a use case would be to focus an input after being dynamically added to the DOM.
 * @returns a stream usable in [[VirtualDOM]]
 */
export function stream$<
    TDomain,
    TDom extends AttributeType | VirtualDOM | Array<VirtualDOM>,
>(
    source$: Observable<TDomain>,
    vDomMap: (tDomain: TDomain, ...args) => TDom,
    {
        untilFirst,
        wrapper,
        sideEffects,
    }: {
        untilFirst?: TDom
        wrapper?: (tDom: TDom) => TDom
        sideEffects?: (tDomain: TDomain, tDom: TDom) => void
    } = {},
) {
    return new Stream$<TDomain, TDom>(
        source$,
        (data: TDomain, ...args) => vDomMap(data, ...args),
        { untilFirst, wrapper, sideEffects },
    )
}
/**
 * Type alias for attributes in [[VirtualDOM]]
 */
export type AttributeType =
    | number
    | string
    | boolean
    | { [key: string]: number | string | boolean }

/**
 * Type specialization of [[stream$]] for TDom = [[VirtualDOM]]
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
 */
export const child$ = stream$

/**
 * Type specialization of [[stream$]] for TDom = [[AttributeType]]
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
 */
export const attr$ = stream$

/** Type specialization of [[stream$]] for TDom = Array<[[VirtualDOM]]>
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
 * > In the above example, each time the domain$ observable emit new values,
 * > all the children of the *parent-element* are first deleted, then the new children are
 * > created and inserted. Quite often it is possible to use a more efficient approach,
 * > see [[advancedChildren$]].
 */
export const children$ = stream$
