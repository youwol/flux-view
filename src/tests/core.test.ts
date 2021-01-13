import { Subject } from 'rxjs';
import { create } from 'rxjs-spy'
import { tag } from 'rxjs-spy/cjs/operators';
import { SnapshotPlugin } from 'rxjs-spy/cjs/plugin';
import * as Match from 'rxjs-spy/cjs/match';

import { attr$, child$, render} from '../index';
import { filter } from 'rxjs/operators';

const spy = create();

function getOpenSubscriptions(){

    var snapshotPlugin = spy.find(SnapshotPlugin);
    
    var snapshot = snapshotPlugin['snapshotAll']();
    var matched = Array
        .from(snapshot.observables.values())
        .filter(function (observableSnapshot) { return Match.matches(observableSnapshot['observable'], /.+/); });

    return matched.map( match => {
        
        let openSubscriptions = new Array<any>(...match.subscriptions.keys())
        .filter(element => {
            return !element.closed
        });
        return { tag: match.tag, openSubscriptions }
    }).reduce( (acc,e) => ({...acc, ...{[e.tag]:e.openSubscriptions.length}}) , {}) as any

}

test('constant vDOM', () => {

    let vDom = {
        id:'root',
        class:'root',
        children: [
            {tag: 'label', innerText:'text label', style:{'background-color':'red'}}
        ]
    }
    let div = render(vDom)
    document.body.appendChild(div)
    let root = document.getElementById("root")
    expect(root).toBeTruthy()
    expect(root.classList.contains('root')).toBeTruthy()

    let child = div.querySelector('label')
    expect(child).toBeTruthy()
    expect(child.innerText).toEqual('text label')
    expect(child.style.backgroundColor).toEqual('red')

    div.remove()
})


test('attr$', () => {

    spy.flush();
    
    let sideEffects = []

    let class$ = new Subject()
    let vDom = {
        id:'root',
        class:attr$(
            class$.pipe(tag('class$')), 
            (c) => c , 
            {untilFirst:'default'}),
        innerText: attr$(
            class$.pipe(tag('innerText$')), 
            (c) => c, 
            {wrapper: (d) => `text is ${d}`,
             sideEffects: (data) => sideEffects.push(data) })
    }
    let div = render(vDom)
    document.body.appendChild(div)
    let root = document.getElementById("root")
    expect(root).toBeTruthy()
    expect(root.innerText).toBeFalsy()
    expect(root.classList.toString()).toEqual('default')

    class$.next("class_1")    
    expect(root.classList.toString()).toEqual('class_1')
    expect(root.innerText).toEqual('text is class_1')
    expect(sideEffects.length).toEqual(1)
    expect(sideEffects[0]).toEqual("text is class_1")

    let subs = getOpenSubscriptions()
    expect(subs.class$).toEqual(1)
    div.remove()
    subs = getOpenSubscriptions()
    expect(subs.class$).toEqual(0)
})


test('simple attr$ & child$ ', () => {

    spy.flush();
    
    let selected$ = new Subject<string>()
    let file$ = new Subject<{id:string, name:string}>()

    let fileView= ({id,name}:{id:string,name:string}) => {
        return { 
            tag:'span', 
            id:id, 
            innerText:name,
            class: attr$(
                selected$.pipe( tag('class$'), filter( _id =>  _id == id)),
                (c) => 'selected'),
            onclick: () =>  selected$.next(id)
        } 
    }

    let vDom = {
        id:'browser',
        children:[
            child$( file$.pipe( tag('file$') ),  fileView )
        ]
    }
    let div = render(vDom)
    document.body.appendChild(div)
    let root = document.getElementById("browser")
    expect(root).toBeTruthy()
    expect(root.children[0].tagName).toEqual('FV-PLACEHOLDER')
    file$.next({id:'file0', name:'core.ts'})
    let fileDiv = root.children[0] as HTMLDivElement
    expect(fileDiv.tagName).toEqual('SPAN')
    expect(fileDiv.innerText).toEqual('core.ts')
    

    let event = new MouseEvent('click',{button:0})
    fileDiv.dispatchEvent(event)
    expect(fileDiv.classList.toString()).toEqual('selected')

    let subs = getOpenSubscriptions()
    expect(subs.class$).toEqual(1)
    expect(subs.file$).toEqual(1)
    
    div.remove()
    subs = getOpenSubscriptions()
    expect(subs.class$).toEqual(0)
    expect(subs.file$).toEqual(0)
})


test('unknown element', () => { 

    let vDom = {
        tag:'unknown',
        class:'root'
    }
    const _render = () => {
        render(vDom)
    }
    expect( _render).toThrow(Error)
})
