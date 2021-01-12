require('./style.css');
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';

import { render, child$, attr$ } from '../../../index'
import { classes } from './style'
import { map } from 'rxjs/operators';


class Item {
    constructor(public readonly id: number, public readonly name: string, public readonly done: boolean) { }
}

class AppState {

    static STORAGE_KEY = "todos-barbouille";

    public readonly items$ = new BehaviorSubject<Array<Item>>(JSON.parse(localStorage.getItem(AppState.STORAGE_KEY) || "[]"))
    public readonly completed$ : Observable<boolean>
    public readonly remaining$ : Observable<Array<Item>>
    
    constructor() {
        this.items$.subscribe(items => {
            localStorage.setItem(AppState.STORAGE_KEY, JSON.stringify(items));
        })
        this.completed$ = this.items$.pipe( map( items => items.reduce( (acc,item) => acc && item.done, true)))
        this.remaining$ = this.items$.pipe( map( items => items.filter( (item) => item.done)))
    }

    toggleAll() {
        let completed = this.getItems().reduce((acc,item) => acc && item.done, true)
        this.items$.next(this.getItems().map(item => new Item(item.id, item.name, !completed)))
    }

    addItem(name: string) {
        let item = new Item(Date.now(), name, false)
        this.items$.next([...this.getItems(), item])
        return item
    }

    deleteItem(id: number) {
        this.items$.next(this.getItems().filter( item => item.id != id) )
    }

    toggleItem(id: number) {
        let items = this.getItems().map(item => item.id == id ? new Item(item.id, item.name, !item.done) : item)
        this.items$.next(items)
    }

    setFilter( filterFct: (item:Item) =>boolean){
        this.items$.next( this.getItems().filter( filterFct))
    }

    setName( id: number, name: string){
        let items = this.getItems().map(item => item.id == id ? new Item(item.id, name, item.done) : item)
        this.items$.next(items)
    }

    private getItems() {
        return this.items$.getValue()
    }
}

enum FilterMode{
    ALL = 1,
    ACTIVE = 2,
    COMPLETED = 3
}

class AppView{

    public readonly filterMode$ = new BehaviorSubject<FilterMode>(FilterMode.ALL)
    public readonly selectedItems$ : Observable<Array<Item>>

    private readonly filterFcts = {
        [FilterMode.ALL]: (item) => true,
        [FilterMode.ACTIVE]: (item) => !item.done,
        [FilterMode.COMPLETED]: (item) => item.done
    }

    constructor(public readonly state: AppState){

        this.selectedItems$ = combineLatest([state.items$, this.filterMode$]).pipe(
            map( ([items,mode]) => items.filter( item => this.filterFcts[mode](item) ) )
        )
    }

    setFilter( mode: FilterMode){
        this.filterMode$.next(mode)
    }

    render() : HTMLElement {
        return render({
            tag: 'section', class: 'todoapp',
            children: [
                AppView.headerView(this.state),
                AppView.listView(this),
                AppView.footerView(this)
            ],
        }) as HTMLElement
    }

    static headerView(state: AppState) {
        
        let completed$ = attr$(  state.completed$,   (completed) => completed ? 'text-dark' : 'text-light', 
            {wrapper:(d) => `${d} ${classes.chevron}` })

        return {
            tag: 'header', class: 'header', children: [
                {   tag: 'h1', innerText: 'todos' },
                {   class: ' d-flex align-items-center',
                    children: [
                        {   tag: 'i', class: completed$, onclick: () => state.toggleAll() },
                        {
                            tag: 'input', autofocus: 'autofocus', autocomplete: 'off',
                            placeholder: "What needs to be done?", class: 'new-todo',
                            onkeypress: (ev) => { (ev.key == "Enter") && state.addItem(ev.target.value) && (ev.target.value="") }                               
                        }
                    ]
                }
            ]
        }
    }

    static itemView(state: AppState, item: Item) {
        
        let edited$ = new BehaviorSubject<boolean>(false)
        let content = child$( 
            edited$, 
            (edited) => edited
                ?   {   tag: 'input', type:'text', value: item.name,
                        onclick: (ev) => ev.stopPropagation(),
                        onkeypress: (ev) => { (ev.key == "Enter")&&  state.setName(item.id, ev.target.value) },
                        onblur : (ev) => state.setName(item.id, ev.target.value)  
                    }
                :   {   tag: 'span', innerText: item.name, class:item.done ? 'text-muted' : 'text-dark',
                        style: { 
                            font: "24px 'Helvetica Neue', Helvetica, Arial, sans-serif", 
                                'text-decoration': item.done ? 'line-through' :''
                        },
                        ondblclick: (ev) => edited$.next(true)
                    },
            {   sideEffects : (_, elem) => elem.focus() }
        )
        return {
            class: classes.itemViewContainer, 
            children: [
                {   class: classes.itemCheckContainer, 
                    onclick: () => state.toggleItem(item.id),
                    children: [ 
                        {class: item.done ? classes.itemSuccess : ''}]
                },
                content,
                {   tag:'i', class: classes.itemDelete,
                    onclick: () => state.deleteItem(item.id)
                }
            ]
        }
    }

    static listView(view: AppView) {

        return child$(
            view.selectedItems$,
            (items) => {
                return {
                    class: 'fa-flex flex-column',
                    children: items.map(item => AppView.itemView(view.state, item))
                }
            })
    }

    static footerView(appView: AppView) {
        
        let class$ = (target) => attr$( appView.filterMode$, (mode) => mode==target ? 'selected' : '')
        return {
            class:'d-flex align-items-center px-3 border-top py-2 text-secondary', children:[
                {   tag: 'span', 
                    innerText: attr$(appView.state.remaining$, (items) => items.length, {
                        wrapper:(d) => `${d} item${d>1?'s':''} left`})
                },
                {   class:'d-flex align-items-center mx-auto',
                    children:[
                        {   tag:'a', innerText: 'All', class: class$(FilterMode.ALL), href:'#/all',
                            onclick: () => appView.setFilter(FilterMode.ALL)
                        },
                        {   tag:'a', innerText: 'Active', class: class$(FilterMode.ACTIVE), href:'#/active', 
                            onclick: () => appView.setFilter(FilterMode.ACTIVE)   
                        },
                        {   tag:'a', innerText: 'Completed', class: class$(FilterMode.COMPLETED), href:'#/completed',
                            onclick: () => appView.setFilter(FilterMode.COMPLETED)
                        }
                    ]
                }
            ]
        }
    }
}
let state = new AppState()
let div = new AppView(state).render()
document.getElementById("flux-view").appendChild(div)