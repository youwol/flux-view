<h1 align="center">Flux-view</h1>

<p>
    <a href="https://github.com/kefranabg/readme-md-generator/graphs/commit-activity" target="_blank">
        <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
    </a>
    <a href="https://github.com/kefranabg/readme-md-generator/blob/master/LICENSE" target="_blank">
        <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" />
    </a>
</p>




## What is it?

Flux-view is a tiny library to render HTML documents using reactive programing primitives
(tiny meaning less than 10kB uncompressed - rxjs not included).
The library core concept is to allow binding DOM's attributes and children to RxJS streams in an HTML document:

```typescript
import { interval } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { render, attr$ } from '@youwol/flux-view'

const nCount = 10
// timer$: tick 10 times every seconds
const timer$ = interval(1000).pipe(  
    take(nCount), 
    map( tick => nCount - tick) 
)  

let vDom = { 
    tag:'div', 
    innerText: 'count down:', 
    children:[
        {   tag:'div',
            innerText: attr$( 
                // input stream (aka domain stream)
                timer$, 
                // rendering mapping
                (countDown:number) => `Remaining: ${countDown} s` 
            )
        }
    ]
}
let div : HTMLElement = render(vDom)
```
Few things to higlight:
- the dataflow of the application is described using RxJS. It provides an efficient and elegant way to deal with events and asynchronicity. The dataflow is explicit and usually composed of pure functions.
- the DOM is represented by a JSON data-structure (called virtual DOM or vDOM). All regular attributes of the DOM exist along with the *children* attributes to list children of the node.
- any attribute can be defined either by plain data or a stream (be it combination of multiple streams)

> For those having knowledge of RxJS and HTML, learning how to use the library will take a couple of minutes: the all API contains only 4 functions : *render*, *attr$*, *child$*, *children$*; the three latters are here essentially the same, they are differentiated as syntactic sugar. If not the case, learning how to use the library is learning reactive programming and HTML5.

## More elaborated examples

More elaborated example are provided in *codesandbox*:
- <a href='https://codesandbox.io/s/github/youwol/flux-view/blob/master/src/demos/todos?file=/index.html'>Todos application</a>: A todo application copied from the example of the *Vue* library and 'translated' into *flux-view*. The original code of the *View* version can be found <a href='https://codesandbox.io/s/github/vuejs/vuejs.org/tree/master/src/v2/examples/vue-20-todomvc?from-embed=&file=/index.html:63-108'>here</a>.
- <a href='https://codesandbox.io/s/github/youwol/flux-view/blob/master/src/demos/timer?file=/index.html'>Count down</a>: A simple count down, includes some reactivity regarding mouse move.

Demos sources are in the folder */src/demos* (opening index.html in a browser will do the work).


# Install

Using npm:
```sh
npm install @youwol/flux-view
```
Using yarn:
```sh
yarn add @youwol/flux-view
```

And import the functions in your code:

```typescript
import {attr$, child$, render} from "@youwol/flux-view"
```

Or you can start scratching an index.html using CDN ressources like that:
```html
<html>
    <head>
        <script src="https://unpkg.com/rxjs@6/bundles/rxjs.umd.min.js">
        </script>
        <script src="https://unpkg.com/@youwol/flux-view@0.0.2/dist/@youwol/flux-view.js">
        </script>
    </head>

    <body id="container">

        <script>
            let [flux, rxjs] = [window['@youwol/flux-view'], window['rxjs']]  

            let vDom = { innerText: flux.attr$( rxjs.of("Hi! Happy fluxing!"), (d)=>d) }  

            document.getElementById("container").appendChild(flux.render(vDom))
        </script>
    </body>
</html>
```
# API

## Virtual DOM & render function

The virtual DOM (vDOM) is described by a JSON data-structure with following attributes (all are optionals):
-  The tag of a node is defined using the 'tag' attribute - default to 'div'
-  All regular attributes of HTMLElement that can be set can be used
-  The children are defined as a list using the 'children' attribute 
-  the attribute 'style' can be used to set some styles (provide as a Map<string, string)>)
-  the attribute 'connectedCallback' allows to provide a function that will be executed when
the element is actually added to the document. It takes as argument the corresponding HTMLElement. 
-  the attribute 'disconnectedCallback' allows to provide a function that will be executed when
the element is removed from the document. It takes as argument the corresponding HTMLElement. 

Any of those attributes but 'tag', 'connectedCallback' and 'disconnectedCallback' can be: 
- a plain value (with a type consistent to the corresponding type used by the HTMLElement)
- an observable to a plain value (using *attr$*, *child$* or *children* - described hereafter).

To turn a vDOM into a regular HTMLElement, use the function *render*:

```typescript
import { BehaviorSubject } from 'rxjs';
import { render } from '@youwol/flux-view'

let option$ = new BehaviorSubject<string>('option0')
let sub = option$.subscribe( option => {/*some behavior*/})
let vDom = {
    class:'d-flex justify-content-center',
    children:[
        {
            tag:'select',
            children:[
                {tag:'option', innerText:'option 1'},
                {tag:'option', innerText:'option 2'},
            ],
            onchange: (ev) => option$.next( ev.target.value)
        }
    ],
    connectedCallback: (elem) => {        
        /*This makes the subscription managed by the DOM, see part 'Lifecycle' */
        elem.ownSubscriptions(sub)
    }
}
let div = render(vDOom)
```
## **attr$**, **child$** functions

The functions **attr$**, and **child$** functions are actually the same, they differ only by the type used
in their definition.

It follows this common type's definition (the third arguments is optional):
 ```typescript
function ( 
    stream$: Observable<TData>,
    viewMap: (TData) => TResult,
    { 
        untilFirst, 
        wrapper, 
        sideEffects
    }: 
    {   untilFirst?: TResult, 
        wrapper?: (TResult) => TResult, 
        sideEffects?: (TData, HTMLElement) => void  
    } = {},
)
```
where:
- **stream$** is the domain's data stream defined as a RxJS observable
- **viewMap** is a function that convert the domain's data to a vDOM attribute. 
In the case of the function *attr$*, *TResult* is the type of the target attibute.
In the case of the function *child$*, *TResult* is *VirtualDOM*. 
In the case of the function *children$*, *TResult* is *Array\<VirtualDOM\>*. 
- **untilFirst** is the data that will be used until the first emitted element in *stream$* is obtained. If not provided, the attribute/child does not exist until first emission.
    In such case, using a *BehaviorSubject* of RxJS (observable that directly emit a predefined value) is an alternative that can also be used.

```typescript
let vDom = { 
    tag:'div', innerText: 'count down:', 
    children:[
        {   tag:'div',
            innerText: attr$( 
                timer$, 
                ( countDown:number ) => `Remaining: ${countDown} s`,
                { untilFirst: "Waiting first count down..."}
            )
        }
    ]
}

```
- **wrapper** is a function that is used to alter the data returned by **viewMap**. it is often used to factorize part of the viewMap function that are 'constant' with respect to the data in **stream$**. 
For instance the following code factorizes the class *count-down-item*: 
```typescript
let vDom = { 
    tag:'div', innerText: 'count down:', 
    children:[
        {   tag:'div',
            class:  attr$( 
                timer$, 
                ( countDown:number ) => countDown <5 ? 'text-red' : 'text-green',
                { wrapper: (classColor) => `count-down-item ${classColor}`} 
            ),
            innerText: attr$( timer$, (countDown:number) => `${countDown} s`)
        }
    ]
}
```
- **sideEffects** is a function that provides a handle to execute side effects once the
attribute/child has been set/added; both the domain's data and the rendered HTMLElement are provided to this function.


## **children$** function

When working with array of domain data **flux-view** provides the function **children**.
This function is similar to **attr$** and **child$** defined above but add an extra piece 
of logic to avoid flushing all the children and re-rendering them all each time a new array is emitted.
The library provides 2 policies for such case:
-    **ReplaceChildrenPolicy**: when a new array of domains data is emitted, only new elements
are created, previous elements that are not part of the new array are removed. Element comparison
is by default references comparison (valid if domain data are immutables), but a custom function can provided. 
-   **AppendOnlyPolicy**: when a new array of domains data is emitted, 
corresponding DOM elements are always appended, no replacements, no deletions.

The reader can find more information in the [documentation](https://youwol.github.io/flux-view/dist/docs/modules/children_.html#children_-1).


# Technical details

## Lifecycle

Behind the scene, one central task of *flux-view*  is to keep track of internal subscriptions and manage their lifecycle, without any concern for the consumer of the library.

The rule is straightforward: only the subscriptions related to DOM elements included 
in the document are kept alive. When an element is removed (in any ways), all the 
related streams are unsubscribed recursively. Latter on, if the element is reinserted in the document, all the related streams are re-subscribed.


## A note about performances

Most of the popular frameworks (e.g. *React*, *Angular*, *Vue*) use an approach 
that bind a state to a virtual dom and 'auto-magically' identify and update relevant portions of the DOM that actually change when the state modification. This magic is at the price of a more complex API and at some undesired redrawing if care is not taken.

In *flux-view*, the user is in charge to chose how the binding between DOM's 
attributes/children and observables is realized. 
For instance, in the previous example, there is only the attribute *innerText* of the 
inner div that is actually updated: when timer$ emit a new value, only this property is updated. A less efficient implementation would be:

 ```typescript
let vDom = { 
    tag:'div', innerText: 'count down:', 
    children:[
        child$(
            timer$, 
            (countDown:number) => ({ tag: 'div', innerText:`Remaining: ${countDown} s`})
        ) 
    ]
}
```
In this case, the entire inner div is re-rendered when *timer$* emit a new value.
