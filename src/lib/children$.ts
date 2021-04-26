import { access } from "fs";
import { Observable } from "rxjs";
import { map, tap } from "rxjs/operators";
import { InterfaceHTMLElement$, VirtualDOM } from "./interface";
import { Stream$ } from "./stream$";

declare var render: any

type RefElement<TDomain> = {
    domainData: TDomain,
    virtualDOM: VirtualDOM,
    element: InterfaceHTMLElement$
}
export class RenderingUpdate<TDomain>{

    constructor( 
        public readonly added:RefElement<TDomain>[],
        public readonly updated:RefElement<TDomain>[],
        public readonly removed:RefElement<TDomain>[]
        ){}
}

interface ChildrenPolicy<TDomain> {
}

export class AppendOnlyPolicy<TDomain> implements ChildrenPolicy<TDomain>{
}

export class ReplacePolicy<TDomain> implements ChildrenPolicy<TDomain>{

    public readonly comparisonOperator : (rhs:TDomain,lhs:TDomain)=> boolean
    constructor( {
        comparisonOperator
    }: {
        comparisonOperator?: (rhs:TDomain,lhs:TDomain)=> boolean
    } = {}){
        this.comparisonOperator = comparisonOperator || ((a,b) => a==b)
    }
}


export abstract class ChildrenStream$<TDomain> {

    public readonly untilFirst
    public readonly sideEffects

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


export class AppendOnlyChildrenStream$<TDomain> extends ChildrenStream$<TDomain> {

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
        let added = domainData.map( (d,i) => ({domainData: d, virtualDOM: vDOMs[i], element:rendered[i]}))
        return new RenderingUpdate(added, [], [])
    }
}

export class ReplaceChildrenStream$<TDomain> extends ChildrenStream$<TDomain> {

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
            let added = newData.map( (d,i) => ({domainData: d, virtualDOM: vDOMs[i], element:rendered[i]}))
            let update = new RenderingUpdate(added, [], deletedRefElem )

            this.actualElements = [
                ...this.actualElements.filter( d =>  domainData.includes(d.domainData)),
                ...added 
            ]
            return update
        }
}


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

/*
function appendOnly$(a,b,c){}

function testLogSimple(){

    let logs$ = new Observable<any>()

    let vDOM = {
        children: appendOnly$(
            logs$,
            (log) => ({innerText: log.text}),
            {
                maxCount: 100
            }
        )
    }
}

function testLog(){

    let logs$ = new Observable<any>()

    let vDOM = {
        children: children$(
            { append$: logs$, 
              
            },
            (log) => ({innerText: log.text})
        )
    }
}
*/