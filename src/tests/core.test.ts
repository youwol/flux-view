import { BehaviorSubject, Subject } from 'rxjs'
import { create } from 'rxjs-spy'
import * as Match from 'rxjs-spy/cjs/match'
import { tag } from 'rxjs-spy/cjs/operators'
import { SnapshotPlugin } from 'rxjs-spy/cjs/plugin'
import { filter } from 'rxjs/operators'

import {
    attr$,
    child$,
    children$,
    childrenAppendOnly$,
    childrenFromStore$,
    HTMLElement$,
    render,
    RenderingUpdate,
    Stream$,
    VirtualDOM,
} from '../index'
import { apiVersion } from '../lib/core'

const spy = create()

function getOpenSubscriptions(): { [key: string]: unknown } {
    const snapshotPlugin = spy.find(SnapshotPlugin)

    const snapshot = snapshotPlugin['snapshotAll']()
    const matched = Array.from(snapshot.observables.values()).filter(function (
        observableSnapshot,
    ) {
        return Match.matches(observableSnapshot['observable'], /.+/)
    })

    return matched
        .map((match) => {
            const openSubscriptions = new Array(
                ...match.subscriptions.keys(),
            ).filter((element) => {
                return !element.closed
            })
            return { tag: match.tag, openSubscriptions }
        })
        .reduce(
            (acc, e) => ({
                ...acc,
                ...{ [e.tag]: e.openSubscriptions.length },
            }),
            {},
        )
}

test('constant vDOM', () => {
    const vDom = {
        id: 'root',
        class: 'root',
        children: [
            {
                tag: 'label',
                innerText: 'text label',
                style: { 'background-color': 'red' },
            },
        ],
        customAttributes: {
            hasCustomAttributes: true,
        },
    }
    const div = render(vDom)
    document.body.textContent = ''
    document.body.appendChild(div)
    const root = document.getElementById('root')
    expect(root).toBeTruthy()
    expect(root.classList.contains('root')).toBeTruthy()
    expect(root.getAttribute('has-custom-attributes')).toBeTruthy()
    const child = div.querySelector('label')
    expect(child).toBeTruthy()
    expect(child.innerText).toBe('text label')
    expect(child.style.backgroundColor).toBe('red')

    div.remove()
})

test('constant vDOM with HTML element', () => {
    const innerDiv = document.createElement('div')
    innerDiv.innerHTML = 'test inner div'
    innerDiv.classList.add('inner-div')
    innerDiv.style.setProperty('background-color', 'green')
    const vDom = {
        id: 'root',
        class: 'root',
        children: [
            {
                tag: 'label',
                innerText: 'text label',
                style: { 'background-color': 'red' },
            },
            innerDiv,
        ],
    }
    const div = render(vDom)
    document.body.textContent = ''
    document.body.appendChild(div)
    const root = document.getElementById('root')
    expect(root).toBeTruthy()
    expect(root.classList.contains('root')).toBeTruthy()

    const child0 = div.querySelector('label')
    expect(child0).toBeTruthy()
    expect(child0.innerText).toBe('text label')
    expect(child0.style.backgroundColor).toBe('red')

    const child1: HTMLDivElement = div.querySelector('.inner-div')
    expect(child1).toBeTruthy()
    expect(child1.innerHTML).toBe('test inner div')
    expect(child1.style.backgroundColor).toBe('green')

    div.remove()
})

test('attr$', () => {
    spy.flush()

    const sideEffects = []

    const class$: Subject<string> = new Subject()
    const vDom: VirtualDOM & { class: Stream$<string, string> } = {
        id: 'root',
        class: attr$(class$.pipe(tag('class$')), (c) => c, {
            untilFirst: 'default',
        }),
        innerText: attr$(class$.pipe(tag('innerText$')), (c) => c, {
            wrapper: (d) => `text is ${d}`,
            sideEffects: (domain, dom) => sideEffects.push({ domain, dom }),
        }),
    }
    const div = render(vDom)
    document.body.textContent = ''
    document.body.appendChild(div)
    const root = document.getElementById('root')
    expect(root).toBeTruthy()
    expect(root.innerText).toBeFalsy()
    expect(root.classList.toString()).toBe('default')

    class$.next('class_1')
    expect(root.classList.toString()).toBe('class_1')
    expect(root.innerText).toBe('text is class_1')
    expect(sideEffects).toHaveLength(1)
    expect(sideEffects[0].domain).toBe('class_1')
    expect(sideEffects[0].dom).toBe('text is class_1')

    let subs = getOpenSubscriptions()
    expect(subs.class$).toBe(1)
    div.remove()
    subs = getOpenSubscriptions()
    expect(subs.class$).toBe(0)
})

test('attr$ & external subscription', () => {
    spy.flush()

    let sideEffects = []

    const class$ = new BehaviorSubject<string>('default')
    const userSubs = class$.pipe(tag('class2$'))
    const vDom = {
        id: 'root',
        class: attr$(class$.pipe(tag('class$')), (c) => c),
        connectedCallback: (element) => {
            const sub = userSubs.subscribe((c) => sideEffects.push(c))
            element.ownSubscriptions(sub)
        },
        disconnectedCallback: (_element) => {
            sideEffects = []
        },
    }
    const div = render(vDom)
    document.body.textContent = ''
    document.body.appendChild(div)
    let root = document.getElementById('root')
    expect(root).toBeTruthy()
    expect(root.innerText).toBeFalsy()
    expect(root.classList.toString()).toBe('default')
    expect(sideEffects).toHaveLength(1)
    expect(sideEffects[0]).toBe('default')

    let subs = getOpenSubscriptions()
    expect(subs.class$).toBe(1)
    expect(subs.class2$).toBe(1)
    div.remove()
    subs = getOpenSubscriptions()
    expect(subs.class$).toBe(0)
    expect(subs.class2$).toBe(0)

    document.body.appendChild(div)
    root = document.getElementById('root')
    expect(root).toBeTruthy()
    expect(root.innerText).toBeFalsy()
    expect(root.classList.toString()).toBe('default')
    expect(sideEffects).toHaveLength(1)
    expect(sideEffects[0]).toBe('default')
})

test('simple attr$ & child$', () => {
    spy.flush()

    const selected$ = new Subject<string>()
    const file$ = new Subject<{ id: string; name: string }>()

    const fileView = ({ id, name }: { id: string; name: string }) => {
        return {
            tag: 'span',
            id: id,
            innerText: name,
            class: attr$(
                selected$.pipe(
                    tag('class$'),
                    filter((_id) => _id == id),
                ),
                (_c) => 'selected',
            ),
            onclick: () => selected$.next(id),
        }
    }

    const vDom = {
        id: 'browser',
        children: [child$(file$.pipe(tag('file$')), fileView)],
    }
    const div = render(vDom)
    document.body.textContent = ''
    document.body.appendChild(div)
    const root = document.getElementById('browser')
    expect(root).toBeTruthy()
    expect(root.children[0].tagName).toBe(`FV-${apiVersion}-PLACEHOLDER`)
    file$.next({ id: 'file0', name: 'core.ts' })
    const fileDiv = root.children[0] as HTMLDivElement
    expect(fileDiv.tagName).toBe('SPAN')
    expect(fileDiv.innerText).toBe('core.ts')

    const event = new MouseEvent('click', { button: 0 })
    fileDiv.dispatchEvent(event)
    expect(fileDiv.classList.toString()).toBe('selected')

    let subs = getOpenSubscriptions()
    expect(subs.class$).toBe(1)
    expect(subs.file$).toBe(1)

    div.remove()
    subs = getOpenSubscriptions()
    expect(subs.class$).toBe(0)
    expect(subs.file$).toBe(0)
})

test('simple child$ with HTMLElement', () => {
    spy.flush()

    const file$ = new Subject<{ id: string; name: string }>()

    const vDom = {
        id: 'browser',
        children: [
            child$(file$.pipe(tag('file$')), (file) => {
                const innerDiv = document.createElement('span')
                innerDiv.innerText = file.name
                return innerDiv
            }),
        ],
    }

    const div = render(vDom)
    document.body.textContent = ''
    document.body.appendChild(div)
    const root = document.getElementById('browser')
    expect(root).toBeTruthy()
    expect(root.children[0].tagName).toBe(`FV-${apiVersion}-PLACEHOLDER`)
    file$.next({ id: 'file0', name: 'core.ts' })
    const fileDiv = root.children[0] as HTMLDivElement
    expect(fileDiv.tagName).toBe('SPAN')
    expect(fileDiv.innerText).toBe('core.ts')

    let subs = getOpenSubscriptions()
    expect(subs.file$).toBe(1)

    root.remove()

    subs = getOpenSubscriptions()
    expect(subs.file$).toBe(0)
})

test('children$', () => {
    const inner_stream$ = new BehaviorSubject('a')
    let data = ['hello', 'world']
    const array_data$ = new BehaviorSubject(data)

    const view = (text) => {
        return {
            tag: 'span',
            innerText: text,
            class: attr$(inner_stream$.pipe(tag('class$')), (d) => d),
        }
    }

    const vDom = {
        id: 'browser',
        children: children$(array_data$.pipe(tag('children$')), (array) =>
            array.map(view),
        ),
    }

    const check = (root, data, c) => {
        expect(root.children).toHaveLength(data.length)
        data.forEach((d, i) => {
            expect(root.children[i]['innerText']).toEqual(d)
            expect(root.children[i]['classList'].toString()).toEqual(c)
        })
    }

    const div = render(vDom)
    document.body.appendChild(div)
    const root = document.getElementById('browser')
    expect(root).toBeTruthy()
    check(root, data, 'a')

    data = ['tata', 'toto', 'tutu']
    array_data$.next(['tata', 'toto', 'tutu'])
    check(root, data, 'a')

    inner_stream$.next('b')
    check(root, data, 'b')

    let subs = getOpenSubscriptions()
    expect(subs.children$).toBe(1)
    expect(subs.class$).toBe(1)
    div.remove()
    subs = getOpenSubscriptions()
    expect(subs.children$).toBe(0)
    expect(subs.class$).toBe(0)
})

test('advancedChildren$ replace all with values', () => {
    const inner_stream$ = new BehaviorSubject('a')
    let data = ['hello', 'world']
    const array_data$ = new BehaviorSubject(data)

    let dataRemoved = []
    let dataAdded = []

    const view = (text) => {
        return {
            tag: 'span',
            innerText: text,
            class: attr$(inner_stream$.pipe(tag('class$')), (d) => d),
        }
    }

    const vDom = {
        id: 'browser',
        children: childrenFromStore$(
            array_data$.pipe(tag('children$')),
            (data) => view(data),
            {
                sideEffects: (
                    element: HTMLElement$,
                    update: RenderingUpdate<string>,
                ) => {
                    update.added.forEach((added) =>
                        dataAdded.push(added.domainData),
                    )
                    update.removed.forEach((removed) =>
                        dataRemoved.push(removed.domainData),
                    )
                },
            },
        ),
    }

    const check = (root, data, c) => {
        expect(root.children).toHaveLength(data.length)
        data.forEach((d, i) => {
            expect(root.children[i]['innerText']).toEqual(d)
            expect(root.children[i]['classList'].toString()).toEqual(c)
        })
    }

    const div = render(vDom)
    document.body.textContent = ''
    document.body.appendChild(div)
    const root = document.getElementById('browser')
    expect(root).toBeTruthy()
    check(root, data, 'a')
    expect(dataRemoved).toEqual([])
    expect(dataAdded).toEqual(['hello', 'world'])

    dataRemoved = []
    dataAdded = []
    data = ['tata', 'toto', 'tutu']
    array_data$.next(['tata', 'toto', 'tutu'])
    check(root, data, 'a')

    expect(dataRemoved).toEqual(['hello', 'world'])
    expect(dataAdded).toEqual(['tata', 'toto', 'tutu'])

    inner_stream$.next('b')
    check(root, data, 'b')

    let subs = getOpenSubscriptions()
    expect(subs.children$).toBe(1)
    expect(subs.class$).toBe(1)
    div.remove()
    subs = getOpenSubscriptions()
    expect(subs.children$).toBe(0)
    expect(subs.class$).toBe(0)
})

interface DomainData {
    value: string
}

test('advancedChildren$ replace all with references', () => {
    const inner_stream$ = new BehaviorSubject('a')
    const hello = { value: 'hello' }
    const world = { value: 'world' }
    const toto = { value: 'toto' }

    const array_data$ = new BehaviorSubject<DomainData[]>([hello, world])

    const view = (d: DomainData) => {
        return {
            tag: 'span',
            innerText: d.value,
            class: attr$(inner_stream$.pipe(tag('class$')), (d) => d),
        }
    }

    const vDom = {
        id: 'browser',
        children: childrenFromStore$(
            array_data$.pipe(tag('children$')),
            (data) => view(data),
            {
                sideEffects: (
                    element: HTMLElement$,
                    update: RenderingUpdate<DomainData>,
                ) => {
                    update.added.forEach((added) =>
                        dataAdded.push(added.domainData),
                    )
                    update.removed.forEach((removed) =>
                        dataRemoved.push(removed.domainData),
                    )
                },
            },
        ),
    }

    const check = (root, data, c) => {
        const items = Array.from(root.children).map(
            (item: VirtualDOM) => item.innerText,
        )
        expect(items).toHaveLength(data.length)
        data.forEach((d, i) => {
            expect(items[i]).toEqual(d)
            expect(root.children[i]['classList'].toString()).toEqual(c)
        })
    }
    let dataRemoved = []
    let dataAdded = []

    const div = render(vDom)
    document.body.textContent = ''
    document.body.appendChild(div)
    const root = document.getElementById('browser')
    expect(root).toBeTruthy()
    check(root, ['hello', 'world'], 'a')
    expect(dataRemoved).toEqual([])
    expect(dataAdded).toEqual([hello, world])

    dataRemoved = []
    dataAdded = []
    array_data$.next([hello, toto])
    check(root, ['hello', 'toto'], 'a')

    expect(dataRemoved).toEqual([world])
    expect(dataAdded).toEqual([toto])

    inner_stream$.next('b')
    check(root, ['hello', 'toto'], 'b')

    let subs = getOpenSubscriptions()
    expect(subs.children$).toBe(1)
    expect(subs.class$).toBe(1)
    div.remove()
    subs = getOpenSubscriptions()
    expect(subs.children$).toBe(0)
    expect(subs.class$).toBe(0)
})

test('advancedChildren$ append only', () => {
    const classNameStream$ = new BehaviorSubject('a')
    const data = ['hello', 'world']
    const array_data$ = new BehaviorSubject(data)

    const view = (text) => {
        return {
            tag: 'span',
            innerText: text,
            class: attr$(classNameStream$.pipe(tag('class$')), (d) => d),
        }
    }

    const vDom = {
        id: 'browser',
        children: childrenAppendOnly$(
            array_data$.pipe(tag('children$')),
            (data) => view(data),
        ),
    }

    const check = (root, data, className) => {
        const _items = Array.from(root.children).map(
            (item: VirtualDOM) => item.innerText,
        )
        expect(root.children).toHaveLength(data.length)
        data.forEach((d, i) => {
            expect(root.children[i]['innerText']).toEqual(d)
            expect(root.children[i]['classList'].toString()).toEqual(className)
        })
    }

    const div = render(vDom)
    document.body.textContent = ''
    document.body.appendChild(div)
    const root = document.getElementById('browser')
    expect(root).toBeTruthy()
    check(root, ['hello', 'world'], 'a')

    array_data$.next(['tata', 'toto', 'tutu'])
    check(root, ['hello', 'world', 'tata', 'toto', 'tutu'], 'a')

    classNameStream$.next('b')
    check(root, ['hello', 'world', 'tata', 'toto', 'tutu'], 'b')

    let subs = getOpenSubscriptions()
    expect(subs.children$).toBe(1)
    expect(subs.class$).toBe(1)
    div.remove()
    subs = getOpenSubscriptions()
    expect(subs.children$).toBe(0)
    expect(subs.class$).toBe(0)
})

test('advancedChildren$ append only with sort', () => {
    const classNameStream$ = new BehaviorSubject('a')
    const data = [2, 1, 10]
    const array_data$ = new BehaviorSubject(data)

    const view = (nbr) => {
        return {
            tag: 'span',
            innerText: nbr,
            class: attr$(classNameStream$.pipe(tag('class$')), (d) => d),
        }
    }

    const vDom = {
        id: 'browser',
        style: {
            display: 'flex',
        },
        children: childrenAppendOnly$(
            array_data$.pipe(tag('children$')),
            (data) => view(data),
            {
                orderingIndex: (data) => data,
            },
        ),
    }

    const check = (root, data, className) => {
        const items = Array.from(root.children).sort(
            (a: HTMLElement, b: HTMLElement) =>
                parseInt(a.style.order) - parseInt(b.style.order),
        )
        expect(items).toHaveLength(data.length)
        data.forEach((d, i) => {
            expect(items[i]['innerText']).toEqual(d)
            expect(items[i]['classList'].toString()).toEqual(className)
        })
    }

    const div = render(vDom)
    document.body.textContent = ''
    document.body.appendChild(div)
    const root = document.getElementById('browser')
    expect(root).toBeTruthy()
    check(root, [1, 2, 10], 'a')

    array_data$.next([3, 8])
    check(root, [1, 2, 3, 8, 10], 'a')

    let subs = getOpenSubscriptions()
    expect(subs.children$).toBe(1)
    expect(subs.class$).toBe(1)
    div.remove()
    subs = getOpenSubscriptions()
    expect(subs.children$).toBe(0)
    expect(subs.class$).toBe(0)
})

test('problems', () => {
    const vDomUnknown = {
        tag: 'unknown',
        class: 'root',
    }
    expect(() => render(vDomUnknown)).toThrow(Error)
    expect(render(undefined).tagName).toBe('DIV')
    const vDomUndefined = {
        class: 'root',
        children: [undefined],
    }
    const div = render(vDomUndefined)
    expect(div.children).toHaveLength(0)
})
