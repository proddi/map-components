import {html, render, repeat} from '../../map/lit-html.js';


const converters = {
    String: {
        fromAttribute: (value, type) => String(value),
        toAttribute: (value, type) => (value === null || value === undefined) ? null : value,
    },
    Number: {
        fromAttribute: (value, type) => Number(value),
        toAttribute: (value, type) => ""+value,
    },
    Boolean: {
        fromAttribute: (value, type) => value === "" ? true : Boolean(value),
        toAttribute: (value, type) => value ? "" : null,
    },
    Array: {
        fromAttribute: (value, type) => value ? JSON.parse(decodeURIComponent(value)) : [],
        toAttribute: (value, type) => value.length === 0 ? null : encodeURIComponent(JSON.stringify(value)),
    },
    StringArray: {  /*  experiment to stringify nicely: skills="foo,bar,buzz" */
        fromAttribute: (value, type) => value === null ? [] : value.split(",").map(val => decodeURIComponent(val)),
        toAttribute: (value, type) => value.length === 0 ? null : value.map(val => encodeURIComponent(val)).join(","),
    },
    Object: {
        fromAttribute: (value, type) => value ? JSON.parse(decodeURIComponent(value)) : {},
        toAttribute: (value, type) => Object.keys(value).length === 0 ? null : encodeURIComponent(JSON.stringify(value)),
    },
};


const defaultConverter = converters.String;


/**
 * A simple base class for creating fast, lightweight web components.
 * @experimental
 */
class Element extends HTMLElement {

    /**
     * User-supplied object that maps property names to PropertyDeclaration objects containing options for configuring the property.
     * @abstract
     * @return {PropertyDefinition[]}
     */
    static get properties() {
        return {};
    }

    /**
     * Creates a property accessor on the element prototype if one does not exist.
     * @param {string} name - The property's name.
     * @param {PropertyDefinition} prop - The definition of the property.
     */
    static createProperty(name, prop) {
        if (prop.attribute) {
            this._attributesMap = this._attributesMap || {};
            this._attributesMap[prop.attribute] = prop;
        }
        if (!prop.noAccessors) {
            Object.defineProperty(this.prototype, name, {
                get: function() {
                    return (this._propertiesValues || {})[name];
                },
                set: function(value) {
                    const values = (this._propertiesValues = this._propertiesValues || {});
                    if (values[name] !== value) {
                        values[name] = value;
                        if (prop.reflect) {
                            const attribValue = prop.converter.toAttribute(value);
                            switch (attribValue) {
                                case undefined:
                                    break;
                                case null:
                                    this.removeAttribute(prop.attribute);
                                    break;
                                default:
                                    this.setAttribute(prop.attribute, attribValue);
                            }
                        }
                        this.requestUpdate(name, value);
                    }
                },
                enumerable: true,
                configurable: true,
            });
        }
    }

    /**
     * Invoked each time one of the custom element's attributes is added, removed, or changed.
     * This function is used to implement {@link Element#properties}.
     * @protected
     * @see https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#Using_the_lifecycle_callbacks
     */
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            const proto = this.constructor;
            if (proto._attributesMap) {
                const prop = proto._attributesMap[name];
                /** @ignore */
                this[prop.name] = prop.converter.fromAttribute(newValue);
            }
        }
    }

    /**
     * Used to define the observed attributes. This function is used to implement {@link Element#properties}.
     * @protected
     * @see https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#Using_the_lifecycle_callbacks
     */
    static get observedAttributes() {
        const properties = Object.entries(this.properties).map(([name, prop]) => Object.assign({}, prop, {
                name: name,
                attribute: prop.attribute === undefined
                        ? name.replace(/([a-z0-9_])([A-Z])/g, (_, lc, uc) => [lc, uc.toLowerCase()].join("-"))
                        : prop.attribute,
                converter: prop.converter || converters[prop.type && (prop.type.name || prop.type)] || defaultConverter,
            }));

        properties.forEach(prop => this.createProperty(prop.name, prop));

        return properties.filter(prop => prop.attribute).map(prop => prop.attribute);
    }

    /** @private */
    constructor() {
        super();

        this._updateRequest = null;

        this._changedProperties = {};

        /**
         * Node or ShadowRoot into which element DOM should be rendered. Defaults to an open shadowRoot.
         * @protected
         * @type {Element|DocumentFragment}
         */
        this.renderRoot = this.createRenderRoot();

        this.requestUpdate();
    }

    /**
     *
     * @protected
     * @return {Element|DocumentFragment} Returns a node into which to render.
     */
    createRenderRoot() {
        return this.attachShadow({mode : 'open'});
    }

    /**
     * Returns the current html fragment.
     * @abstract
     * @return {TemplateResult} - Must return a {@link TemplateResult} from {@link lit-html}.
     */
    render() {
        return html``;
    }

    /**
     * Manually start an update
     * @return {Promise} - A Promise that is resolved when the update completes.
     */
    requestUpdate(name, value) {
        if (name) {
            this._changedProperties[name] = value;
        }
//        console.log("request", this._updateRequest, ...args);
        if (!this._updatePromise) {
            this._updatePromise = new Promise((resolve) => requestAnimationFrame(resolve))
                .then(time => {
//                    console.log("render", this._updateRequest, ...args);
                    try {
                        return this.performUpdate(this._changedProperties);
                    } finally {
                        this._updatePromise = null;
                        this._changedProperties = {};
                    }
                })
                ;
        }
        return this._updatePromise;
    }

    async performUpdate(changedProperties) {
        render(this.render(), this.renderRoot);
        if (this.firstUpdated) {
            this.firstUpdated(changedProperties);
            this.firstUpdated = null;
        }
        this.updated && this.updated(changedProperties);
    }
}


/**
 * ```
 * {
 *   type: String,      // Defines the type of the property. This affects the convertion from- and to attributes.
 *   attribute: "foo",  // (optional) name of the attribute if different from prop name
 *   noAccessor: true,  // (optional) No accessor will be created
 *   reflect: true,     // (optional) If true the related attribute will be set to value on changes.
 * }
 * ```
 * @typedef {object} PropertyDefinition
 * @property {string} attribute - The name of the attribute.
 * @property {object} converter
 * @property {boolean} noAccessor - No accessor will be created.
 * @property {boolean} reflect - If true the related attribute will be set to value on changes.
 * @property {object|string} type - Defines the type of the property. This affects the convertion from- and to attributes.
 * @property {function()} hasChanged - A callback that indicates a property change. When not returning true updateRequest() will be performed.
 */

/**
 * @external {lit-html} https://lit-html.polymer-project.org/
 */


export {
    html, repeat,
    Element,
}
