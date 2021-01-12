<h1 align="center">Flux-view 👋</h1>

<p>
    <img alt="Version" src="https://img.shields.io/badge/version-0.0.0-blue.svg?cacheSeconds=2592000" />
    <a href="https://github.com/kefranabg/readme-md-generator#readme" target="_blank">
        <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
    </a>
    <a href="https://github.com/kefranabg/readme-md-generator/graphs/commit-activity" target="_blank">
        <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
    </a>
    <a href="https://github.com/kefranabg/readme-md-generator/blob/master/LICENSE" target="_blank">
        <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" />
    </a>
</p>

> Flux-view is a tiny library to render HTML documents using reactive programing primitives.
Tiny meaning less than 10kB uncompressed - rxjs not included.


# Presentation

The library core concept is to allow binding DOM's attributes and children to RxJS streams in an HTML document:

```typescript

import { interval } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { render, attr$ } from 'flux-view'

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

> For those having knowledge of RxJS and HTML, learning how to use the library will take a couple of minutes: the all API contains only three functions : *render*, *attr$*, and *child$*; the two latters are here essentially the same, they are differentiated as syntactic sugar. If not the case, learning how to use the library is learning reactive programming and HTML5 (which won't be a waste of time if you ask me).

# More elaborated examples


More elaborated example are provided in *codesandbox*:
- <a href='https://codesandbox.io/s/github/youwol/flux-view/blob/master/src/demos/todo?file=/index.html'>Todos application</a>: A todo application copied from the example of the *Vue* library and 'translated' into *flux-view*. The original code can be found <a href='https://codesandbox.io/s/github/vuejs/vuejs.org/tree/master/src/v2/examples/vue-20-todomvc?from-embed=&file=/index.html:63-108'>here</a>.

Their sources are in the folder */src/demos* (opening index.html in a browser will do the work)

# A note about performances

Most of the popular frameworks (e.g. *React*, *Angular*, *Vue*) use an approach 
that bind a state to a virtual dom and automagically identify and update relevant portions of the DOM that actually change when the state modification. This magic is at the price of a more complex API and at some undesired redrawing if care is not taken.

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

There is yet one performance issue with *flux-view* that arises when a binding between
an observable of a collection and the children of a node is desired. 
At that time the library force to use the *child$* function wich in turn redraw the all collection, even if only one item has been added/removed/modified. This issue will be solved soon in upcoming versions (by exposing a *children$' that will provide required features). 

# API

## Virtual DOM & render function

The virtual DOM (vDOM) is described by a JSON data-structure:
-  The tag of a node is defined using the 'tag' attribute 
-  All regular attributes of HTMLElement can be set
-  The children are defined as a list using the 'children' attribute 
-  the attribute 'style' can be used to set some style attributes (provide as a Map<string, string)>)

Any of those attributes but the tag can be: 
- a plain value (with a type consistent to the corresponding type used by the HTMLElement)
- an observable to a plain value (using *attr$* or *child$* - described hereafter).

To turn a vDOM into a regular HTMLElement, use the function *render*.

## *attr$* & *child$* functions

The functions *attr$* and *child$* are actually the same, they differ only by the type used
in their definition.
Both follows this type's definition (the third arguments is optional):
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
- *stream$* is the domain's data stream defined as a RxJS observable
- *viewMap* is a function that convert the domain's data to a vDOM attribute. In the case of the function *attr$* the type *TResult* correspond to the type
of the target attibute, while in the function *child$*, *TResult* is a vDOM 
- *untilFirst* is the data that will be used until the first emitted element in *stream$* is obtained. If not provided, the attribute/child does not exist until first emission.
    In such case, using a *BehaviorSubject* of RxJS (observable that directly emit a predifined value) is an alternative that can also be used.

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
- *wrapper* is a function that is used to alter the data returned by *viewMap*. it is often used to factorize part of the viewMap function that are 'constant' with respect to the data in $stream$*. 
For instance the following code factorizes the class *count-down-item*: 
```typescript
let vDom = { 
    tag:'div', innerText: 'count down:', 
    children:[
        {   tag:'div',
            class:  attr$( 
                timer$, 
                ( countDown:number ) => countDown <5 ? 'text-red' : 'text-green',
                { wrapper: (class) => `count-down-item ${class}`} 
            ),
            innerText: attr$( timer$, (countDown:number) => `${countDown} s`)
        }
    ]
}
```
- sideEffects is a function that provides a handle to execute side effects once the
attribute/child as been set/added; both the domain's data and the rendered HTMLElement are provided to this function. For instance, a common use case is to focus an input after being dynamically added to the DOM.


## Lifecycle

Behind the scene, one central task of *flux-view*  is to keep track of internal subscriptions and manage their lifecycle, without any concern for the consumer of the library.

The rule is straightforward: only the subscriptions related to DOM elements included 
in the document are kept alive. When an element is removed (in any ways), all the 
related streams are unsubscribed recursively. Latter on, if the element is reinserted in the document, all the related streams are resuscribed.
