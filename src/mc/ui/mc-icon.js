import { render, html } from '../../map/lit-html.js';


class McIcon extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: 'open'});
    }

    static get observedAttributes() { return ['icon']; }

    attributeChangedCallback(name, oldValue, value) {
        const pieces = value.split(':');
        const [ns, id] = pieces.length == 2 ? pieces : [null, value];
        render(this.render(this._findUrl(ns), id), this.shadowRoot);
    }

    _findUrl(ns) {
        const link = document.querySelector(`link[rel="mc-icons"]${ns ? `[name="${ns}"]` : ''}`);
        return link ? link.href : "";
    }

    render(url, id) {
        return html`
            <style>
                svg {
                    width: 100%;
                    height: 100%;
                }
            </style>
            <svg xmlns="http://www.w3.org/2000/svg" >
                <use href="${url}#${id}"/>
            </svg>
        `;
    }
}


customElements.define('mc-icon', McIcon);


export { McIcon }
