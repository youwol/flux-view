import { Subscription } from 'rxjs'
import { instanceOfChildrenStream$ } from './advanced-children$'
import { CustomElementsMap } from './factory'
import { VirtualDOM } from './interface'
import { AttributeType, instanceOfStream$, Stream$ } from './stream$'

export const apiVersion = '1'
/**
 * The actual element associated to a {@link VirtualDOM}.
 * It implements the *regular* constructor of the target HTML element on top of which reactive trait is added.
 *
 * The implementation is based on
 * [custom elements](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements).
 *
 * @category Concepts
 */
export class HTMLElement$ extends ReactiveTrait(HTMLElement) {}

class HTMLPlaceHolderElement extends HTMLElement {
    private currentElement: HTMLElement
    constructor() {
        super()
    }

    initialize(stream$: Stream$<VirtualDOM>): Subscription {
        this.currentElement = this

        const apply = (vDom: VirtualDOM) => {
            if (vDom instanceof HTMLElement) {
                this.currentElement.replaceWith(vDom)
                this.currentElement = vDom
                return vDom
            }
            const div = render(vDom)
            this.currentElement.replaceWith(div)
            this.currentElement = div
            return div
        }

        return stream$.subscribe((vDom: VirtualDOM) => {
            return apply(vDom)
        })
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TS2545: A mixin class must have a constructor with a single rest parameter of type 'any[]'.
type Constructor<T extends HTMLElement> = new (...args: any[]) => T

const specialBindings = {
    class: (instance, value) => (instance.className = value),
    style: (instance: HTMLElement, value) => {
        Object.entries(value).forEach(([k, v]) => (instance.style[k] = v))
    },
    customAttributes: (instance, value: { [k: string]: string }) => {
        Object.entries(value).forEach(([k, v]) =>
            instance.setAttribute(k.replace(/[A-Z]/g, '-$&').toLowerCase(), v),
        )
    },
}

function ReactiveTrait<T extends Constructor<HTMLElement>>(Base: T) {
    return class extends Base {
        /**
         * Virtual DOM
         */
        vDom: Readonly<VirtualDOM>

        /**
         * @ignore
         */
        subscriptions = new Array<Subscription>()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TS2545: A mixin class must have a constructor with a single rest parameter of type 'any[]'.
        constructor(...args: any[]) {
            super(...args)
        }

        /**
         * @ignore
         */
        initialize(vDom: VirtualDOM) {
            this.vDom = vDom
        }
        /**
         * @ignore
         */
        connectedCallback() {
            if (!this.vDom) {
                return
            }
            const attributes = Object.entries(this.vDom).filter(
                ([k, v]) => k != 'children' && !instanceOfStream$(v),
            )
            const attributes$ = Object.entries(this.vDom).filter(
                ([k, v]) => k != 'children' && instanceOfStream$(v),
            )

            attributes.forEach(([k, v]: [k: string, v: AttributeType]) => {
                this.applyAttribute(k, v)
            })
            attributes$.forEach(
                ([k, attr$]: [k: string, attr$: Stream$<AttributeType>]) => {
                    this.subscriptions.push(
                        attr$.subscribe((v) => {
                            this.applyAttribute(k, v)
                            return v
                        }, this),
                    )
                },
            )
            if (this.vDom.children && Array.isArray(this.vDom.children)) {
                this.renderChildren(this.vDom.children)
            }

            if (
                this.vDom.children &&
                instanceOfStream$<VirtualDOM[]>(this.vDom.children)
            ) {
                this.subscriptions.push(
                    this.vDom.children.subscribe((children) => {
                        this.textContent = ''
                        this.renderChildren(children)
                        return children
                    }),
                )
            }

            if (
                this.vDom.children &&
                instanceOfChildrenStream$(this.vDom.children)
            ) {
                this.subscriptions.push(this.vDom.children.subscribe(this))
            }
            this.vDom.connectedCallback &&
                this.vDom.connectedCallback(this as unknown as HTMLElement$)
        }

        /**
         * @ignore
         */
        disconnectedCallback() {
            this.subscriptions.forEach((s) => s.unsubscribe())
            this.vDom &&
                this.vDom.disconnectedCallback &&
                this.vDom.disconnectedCallback(this as unknown as HTMLElement$)
        }

        /**
         * @ignore
         */
        renderChildren(
            children: Array<VirtualDOM | Stream$<VirtualDOM> | HTMLElement>,
        ): Array<HTMLElement$> {
            const rendered = []
            children
                .filter((child) => child != undefined)
                .forEach((child) => {
                    if (instanceOfStream$(child)) {
                        const placeHolder = document.createElement(
                            `fv-${apiVersion}-placeholder`,
                        ) as HTMLPlaceHolderElement
                        this.appendChild(placeHolder)
                        this.subscriptions.push(placeHolder.initialize(child))
                        rendered.push(placeHolder)
                    } else if (child instanceof HTMLElement) {
                        this.appendChild(child)
                    } else {
                        const div = render(child)
                        this.appendChild(div)
                        rendered.push(div)
                    }
                })
            return rendered
        }
        /**
         * @ignore
         */
        applyAttribute(name: string, value: AttributeType) {
            const binding = specialBindings[name]
                ? () => specialBindings[name](this, value)
                : () => (this[name] = value)
            binding()
        }

        /**
         * The provided subscription get owned by the element:
         * it will be unsubscribed when the element is removed from the DOM.
         * @param subs: subscriptions to own
         */
        ownSubscriptions(...subs: Subscription[]) {
            this.subscriptions.push(...subs)
        }
    }
}

function factory(tag = 'div'): HTMLElement$ {
    if (!CustomElementsMap[tag]) {
        throw Error(
            `The element ${tag} is not registered in flux-view's factory`,
        )
    }

    return document.createElement(tag, {
        is: `fv-${apiVersion}-${tag}`,
    }) as HTMLElement$
}

/**
 * Transform a {@link VirtualDOM} into a {@link HTMLElement$}.
 *
 * @param vDom the virtual DOM
 * @returns the 'real' DOM element
 * @category Concepts
 * @category Entry Points
 */
export function render(vDom: VirtualDOM): HTMLElement$ {
    if (vDom == undefined) {
        console.error('Got an undefined virtual DOM, return empty div')
        return factory('div')
    }
    const element = factory(vDom.tag)
    element.initialize(vDom)
    return element
}

function registerElement(tag: string, BaseClass) {
    class ExtendedClass extends ReactiveTrait(BaseClass) {
        constructor() {
            super()
        }
    }
    customElements.define(
        `fv-${apiVersion}-${tag}`,
        ExtendedClass as CustomElementConstructor,
        { extends: tag },
    )
}

function register() {
    if (customElements.get(`fv-${apiVersion}-placeholder`)) {
        console.warn(
            `flux-view with api version ${apiVersion} has already defined custom elements`,
        )
        return
    }

    customElements.define(
        `fv-${apiVersion}-placeholder`,
        HTMLPlaceHolderElement,
    )

    Object.entries(CustomElementsMap).forEach(([tag, HTMLElementClass]) => {
        registerElement(tag, HTMLElementClass)
    })
}

register()
