require('./style.css');
import { fromEvent, interval } from 'rxjs';
import { finalize, map, take } from 'rxjs/operators';
import { render, child$, attr$ } from '../../../index'

import { create } from 'rxjs-spy'
import { tag } from 'rxjs-spy/operators';

// the rxjs spy is used to make sure no remaining subscription are dandling at the end
const spy = create();
spy.show();

// -----
// the next lines are somehow the state+logic of the application
// -----
const maxCount = 10
const timer$ = interval(500).pipe(
    tag("timer"),  // tags are included to facilitate debugging of rxjs subscriptions, not here in prod
    take(maxCount), 
    map( (t)=>maxCount-t-1),
    finalize( () => {
        // when the count down is over => we remove the view 
        document.getElementById("barbouille").remove() 
        // and ensure no open subscriptions
        setTimeout( () => spy.show(), 0 ) // Timeout to let this stream unsubscribe
    })
);
const mouseMove$ = fromEvent<MouseEvent>(document, 'mousemove').pipe(tag("mousemove"));
const isClose = (ev: MouseEvent, div: HTMLDivElement)=> Math.abs(ev.y - div.offsetTop) < 100 
const isDanger = (t:number) => t<maxCount/2

// This is a rather 'complicated' example of attribute binding, but illustrative (it will be the class attr.).
// Until first mousemove => `d-flex justify-content-between bg-primary`
// After first mousemove:  
//      if the mouse is 'close' to the associated div => `d-flex justify-content-between bg-primary`
//      else => `d-flex justify-content-between bg-secondary`
let class$ =  attr$(
    mouseMove$, 
    (ev: MouseEvent, div: HTMLDivElement) => isClose(ev, div) ? 'bg-primary' : 'bg-secondary', 
    {untilFirst: 'bg-primary', wrapper: (v) => `d-flex justify-content-between ` + v }
)

// Definition of the counter child, the second argument is the mapping between 'domain' and view (virtual dom).
// Even if not the case here, the virtual dom can feature nested structure with 'attr$' and 'child$'
let countDiv$ = child$( 
    timer$,
    (t:number) => ({ 
        innerText: t, class: isDanger(t) ? 'text-danger bg-light px-3' : 'text-success bg-light px-3' ,
    }),
    { untilFirst: { class:"fas fa-spinner fa-spin" } }
)

// construction of the virtual DOM (when no 'tag' is used in an element => it is implicitely a div)
let vDom = {
    class: class$, 
    children: [
        {  innerText: "header" , id:'header' , class:'w-100 text-center'},
        countDiv$,
        {   innerText: "footer" , id:'footer', class:'w-100 text-center'},
  ]}

// We render the div
let div = render(vDom)
// And  append it to the DOM (this is actually when subscriptions start)
document.getElementById("barbouille").appendChild(div)
