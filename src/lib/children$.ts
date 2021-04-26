import { access } from "fs";
import { Observable } from "rxjs";
import { map, tap } from "rxjs/operators";
import { InterfaceHTMLElement$, VirtualDOM } from "./interface";
import { Stream$ } from "./stream$";

declare var render: any

/**
 * ## RefElement
 * 
 * RefElement references the three component of a view (related 
 * to the function [[children$]] when *sideEffects* is called):
 * -    domainData: the domain data
 * -    virtualDom: the virtual dom as defined by the developer
 * -    element: the actual [[HTMLElement$]]
 */
export class RefElement<TDomain>{
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

    constructor({domainData, virtualDOM, element}) {
        this.domainData = domainData
        this.virtualDOM = virtualDOM
        this.element = element
    }
}


/**
 * ## RenderingUpdate
 * 
 * This class describes an update when DOM has been modified through the use 
 * of [[children$]]; it provides the list of **added**, **updated**, and **removed**
 * [[RefElement]].
 * 
 */
export class RenderingUpdate<TDomain>{

    constructor( 
        public readonly added:RefElement<TDomain>[],
        public readonly updated:RefElement<TDomain>[],
        public readonly removed:RefElement<TDomain>[]
        ){}
}


interface ChildrenPolicy<TDomain> {
}


/**
 * ## AppendOnlyPolicy
 * 
 * Policy to be used within the function [[children$]] to work with a stream of array of domain data, 
 * always emitting new data that needs to be displayed in addition to the previous ones.
 * 
 *  e.g.:
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
*    children: children$(
*        stream$,
*        (data: DomainData) => ({innerText: data.value})
*        {
*            policy: new AppendOnlyPolicy()
*        }
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
 */
export class AppendOnlyPolicy<TDomain> implements ChildrenPolicy<TDomain>{
}


/**
 * ## ReplacePolicy
 * 
 * Policy to be used within the function [[children$]] to work with 
 * a stream of **array** of domain data where items can be re-emitted 
 * multiple times (or removed). 
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
*    children: children$(
*        stream$,
*        (data: DomainData) => ({innerText: data.value})
*        {
*            policy: new ReplacePolicy()
*        }
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
* a custom comparison operator can also be supplied (see [[comparisonOperator]])
* 
 */
export class ReplacePolicy<TDomain> implements ChildrenPolicy<TDomain>{

    /**
     * Comparison operator used to identify which elements need to be added/ updated/ replaced.
     * By default reference equality is used, ideal when the domain data are immutables.
     */
    public readonly comparisonOperator : (rhs:TDomain,lhs:TDomain)=> boolean

    /**
     * 
     * @param comparisonOperator see [[comparisonOperator]] 
     */
    constructor( {
        comparisonOperator
    }: {
        comparisonOperator?: (rhs:TDomain,lhs:TDomain)=> boolean
    } = {}){
        this.comparisonOperator = comparisonOperator || ((a,b) => a==b)
    }
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

    /**
     * Callback that gets called when the DOM has been updated.
     * @param parent parent: parent [[HTMLElement$]]
     * @param update update: description of the update, see [[RenderingUpdate]]
     */
    public readonly sideEffects : ( parent: InterfaceHTMLElement$, update:RenderingUpdate<TDomain>) => void

    /**
     * 
     * @param stream$ input stream 
     * @param map mapping function domain data => [[VirtualDOM]]
     * @param sideEffects see [[sideEffects]] 
     */
    constructor(
        public readonly stream$: Observable<Array<TDomain>>,
        public readonly map:  (a : TDomain , ...args)=> VirtualDOM ,
        { 
            sideEffects 
        }: 
        { 
            sideEffects?: ( parent: InterfaceHTMLElement$, update:RenderingUpdate<TDomain>) => void 
        }) {
        this.map = map
        this.sideEffects = sideEffects
    }

    abstract update(
        parentElement: InterfaceHTMLElement$, 
        domainData: Array<TDomain>) : RenderingUpdate<TDomain>

    /**
     * Only for internal use (within [[HTMLElement$]]), should not actually be exposed.
     */
    subscribe( parentElement: InterfaceHTMLElement$ ) {
        
        return this.stream$.pipe( 
            map( (domains: any) => {                
                return this.update(parentElement, domains)
            })
        ).subscribe(
            (updates) => this.finalize(parentElement, updates)
        )
    }

    private finalize(
        parentElement: InterfaceHTMLElement$, 
        updates:  RenderingUpdate<TDomain>
        ){
        this.sideEffects && this.sideEffects(parentElement, updates)
    }
}


class AppendOnlyChildrenStream$<TDomain> extends ChildrenStream$<TDomain> {

    public readonly untilFirst
    public readonly sideEffects

    constructor(
        public readonly stream$: Observable<Array<TDomain>>,
        public readonly map:  (a : TDomain , ...args)=> VirtualDOM ,
        public readonly policy: AppendOnlyPolicy<TDomain> ,
        options: any
        ) {
        super(stream$, map, options)
    }

    update(
        parentElement: InterfaceHTMLElement$, 
        domainData: Array<TDomain>
        ) : RenderingUpdate<TDomain> {

        let vDOMs = domainData.map( domain => this.map(domain))
        let rendered = parentElement.renderChildren(vDOMs)
        let added = domainData.map( (d,i) => 
            new RefElement<TDomain>({domainData: d, virtualDOM: vDOMs[i], element:rendered[i]}) 
        )

        return new RenderingUpdate(added, [], [])
    }
}

class ReplaceChildrenStream$<TDomain> extends ChildrenStream$<TDomain> {

    public readonly untilFirst
    public readonly sideEffects

    constructor(
        public readonly stream$: Observable<Array<TDomain>>,
        public readonly map:  (a : TDomain , ...args)=> VirtualDOM ,
        public readonly policy: ReplacePolicy<TDomain> ,
        options: any
        ) {
        super(stream$, map, options)
    }

    actualElements : RefElement<TDomain>[] = []

    
    update(
        parentElement: InterfaceHTMLElement$, 
        domainData: Array<TDomain>
        ) : RenderingUpdate<TDomain> {

            let actualData = this.actualElements.map( refElem => refElem.domainData)
            let newData = domainData
            .filter( d1 =>  actualData.find( d0 => this.policy.comparisonOperator(d0,d1)) == undefined)

            let deletedRefElem = this.actualElements
            .filter( d0 => domainData.find( d1 => this.policy.comparisonOperator(d0.domainData, d1)) == undefined)
            
            let vDOMs = newData.map( d => this.map(d))
            deletedRefElem.forEach( elem => elem.element.remove())

            let rendered = parentElement.renderChildren(vDOMs)
            let added = newData.map( (d,i) => 
                new RefElement<TDomain>({domainData: d, virtualDOM: vDOMs[i], element:rendered[i]}) 
            ) 
                
            let update = new RenderingUpdate(added, [], deletedRefElem )

            this.actualElements = [
                ...this.actualElements.filter( d =>  domainData.includes(d.domainData)),
                ...added 
            ]
            return update
        }
}

/**
*
* The function **children$** is used to define the display rules for a stream 
* of **array** of domain data. 
* 
* See for instances [[ReplacePolicy]] or [[AppendOnlyPolicy]].
* 
 * @param stream$ The stream of array of domain data
 * @param vDomMap The mapping between DomainData and [[VirtualDOM]]
 * @param policy The policy for children management, e.g. [[AppendOnlyPolicy]], [[ReplacePolicy]]
 * @param sideEffects Callback called after modification of the view, provided arguments are:
 * -    parent: [[HTMLElement$]] parent element
 * -    update: description of the update using [[RenderingUpdate]]
 * @returns 
 * @template TDomain Domain data type
 */
export function children$<TDomain=unknown>(

    stream$: Observable<Array<TDomain>>,
    vDomMap: (TDomain, ...args: any[]) => VirtualDOM,
    {   
        policy,
        sideEffects
    }: 
    { 
        policy?: ChildrenPolicy<TDomain>,
        sideEffects?: ( parent: InterfaceHTMLElement$, update:RenderingUpdate<TDomain>) => void 
    }
    ){
    if(!policy)
        policy = new ReplacePolicy()

    if (policy instanceof(ReplacePolicy))
        return new ReplaceChildrenStream$<TDomain>(
            stream$, 
            (data: TDomain, ...args:any[]) => vDomMap(data, ...args),
            policy,
            { sideEffects }
            )

    if (policy instanceof(AppendOnlyPolicy))
        return new AppendOnlyChildrenStream$<TDomain>(
            stream$, 
            (data: TDomain, ...args:any[]) => vDomMap(data, ...args),
            policy,
            { sideEffects }
            )

    throw Error("Provided policy not known")
}
