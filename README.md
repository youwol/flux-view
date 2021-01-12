<h1 align="center">Welcome to barbouille 👋</h1>
<p>
    <img alt="Version" src="https://img.shields.io/badge/version-0.0.0-blue.svg?cacheSeconds=2592000" />
    <a href="https://github.com/kefranabg/readme-md-generator#readme" target="_blank">
        <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
    </a>
    <a href="https://github.com/kefranabg/readme-md-generator/graphs/commit-activity" target="_blank">
        <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
    </a>
    <a href="https://github.com/kefranabg/readme-md-generator/blob/master/LICENSE" target="_blank">
        <img alt="License: MIT" src="https://img.shields.io/github/license/kefranabg/barbouille" />
    </a>
</p>

## Presentation

Flux-view is a tiny (less than 10kB not compressed - rxjs not included) library to render HTML documents using reactive programing primitives.
Its building concept is to allow to bind HTML DOM's attributes and children to streams and not only to plain value.

To illustrate, here is a simple example :
```typescript

import { interval } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { render, attr$ } from 'flux-view'

const nCount = 10
const timer$ = interval(1000).pipe( take(nCount), map( tick => nCount - tick) )  // tick 10 times every seconds

let vDom = { 
    tag:'div', innerText: 'count down:', 
    children:[
        {   tag:'div',
            innerText: attr$( timer$, (countDown:number) => `Remaining: ${countDown} s` )
        }
    ]
}
let div = render(vDom)
```
Few things to higlight:
- the dataflow of the application is described using RxJS. It provides an efficient and elegant way to deal with events and asynchronicity. In particular, the dataflow of your application is made explicit and usually composed of pure functions.
- the (virtual) DOM is represented by a JSON data-structure. All regular attributes of the DOM can be set here, children are defined through the 'children' attribute (not illustrated above)
- attributes and children of the virtual DOM (vDOM) can be defined either by plain data or streams (through the function *attr$* or *child$* respectively)
- there is very little concepts added by *flux-view* to the ones coming from HTML and RxJS. The all API includes 3 functions (described in what follows): *render*, *attr$*, and *child$*. Besides, learning reactive programming (here using RxJS) is usefull for many domains of software develoment.

A usual 'TODOS' application, mimicking
<a href='https://codesandbox.io/s/github/vuejs/vuejs.org/tree/master/src/v2/examples/vue-20-todomvc?from-embed=&file=/index.html'> the example of Vue   </a>, can be read in 
the demos/todo/src/main.ts. The example reach barely 100 lines of code (styles not included) somewhat similar or even smaller than the implementation using *Vue*.

### A note about Performances

Unlike others frameworks (e.g. *React*, *Angular*, *Vue*), *flux-view* does not bind a state to a virtual dom and does not need to automagically identify and update some portions of the DOM that actually change regarding some state modification. 
This magic is at the price of a more complex API and at some undesired redrawing if care is not taken.

In *flux-view*, this is the responsability to the user to target binding between DOM's 
attributes/children and observables the most granular as possible (if needed). 
For instance, in the previous example, there is only the attribute *innerText* of the 
inner div that is actually updated: when timer$ emit a new value there is only this property that is updated.

A less efficient implementation would be:

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
At that time the library force to use the *child$* function wich in turn redraw the all collection, even if only one item has been added/removed/modified. This issue will be solved in upcoming weeks by exposing a *children$' function that prevent such issue. 

## Install library

```sh
yarn install
```

## Demos

Demos are availables in src/demos. Navigate into one folder and execute:

```sh
yarn
yarn start
```

## API

### Virtual DOM $ render function

The virtual DOM (vDOM) is described by a JSON data-structure. The tag of a node is defined
using the 'tag' attribute and all regular attributes of HTMLElement can be set. 
The children of a node are provided using a list of vDOM through the 'children' attribute.
Be it a child or an attribute, the data associated can be either: 
- a plain value (with a type consistent to the corresponding type used by the HTMLElement)
- an observable to a plain value (using *attr$* or *child$* - described hereafter).

To turn a vDOM into a regular HTMLElement, use the function *render*.

### The functions *attr$* & *child$*

The functions *attr$* and *child$* are very similar and both aim at plugin an observable to a part of the DOM: *attr$* for an attribute of the DOM and *child$* for a child of the DOM.

Both API follows this type's definition, the third arguments is optional:
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
- *viewMap* is a function that convert the domain's data to a data used
in a vDOM. In the case of the function *attr$* the type *TResult* correspond to the type
of the target attibute, while in the function *child$*, *TResult*=*VirtualDOM* 
- *untilFirst* is the data that will be used until the first emitted element in *stream$* is obtained. If not provided, the attribute/child does not exist until first emission.
    In such case, using a *BehaviorSubject* of RxJS (observable that directly emit a predined value) is an alternative that can also be used.

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
- *wrapper* is a function that is used to alter the data returned by *viewMap* always 
in the same way, it is often used to factorize part of the viewMap function that does
not depends on the actual value of the incoming data. For instance the following code
factorize the class *count-down-item* (note that 'class' can be used in lieu of 'className'): 
```typescript
let vDom = { 
    tag:'div', innerText: 'count down:', 
    children:[
        {   tag:'div',
            className:  attr$( 
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
attribute/child as been set/added; both the domain's data and the rendered HTMLElement are procided to this function. One use case would be for instance to focus a child after its addition to the DOM.


### Lifecycle

Behind the scene, one central task of *flux-view*  is to keep track of internal subscriptions and manage their lifecycle, without any concern for the consumer.
The rule is straightforward: only the subscriptions related to DOM elements included 
in the document are kept alived. When an element is removed (in any ways), all the 
related streams are unsubscribed recursively. 
If the element is reinserted in the document it triggers the re-subscriptions of the streams.
