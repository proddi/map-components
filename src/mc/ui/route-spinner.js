import {html, render} from '../../map/lit-html.js';
import {RouteObserver} from '../../map/mixins.js';

import '/node_modules/@polymer/paper-spinner/paper-spinner.js';


/**
 * Selector watches a router and emits style events according to user input (mouse)
 *
 * @example
 * <router id="router" ...></router>
 *
 * <route-selector router="#router"></route-selector>
 *
 * @extends {RouteObserver}
 * @extends {HTMLElement}
 *
 **/
class RouteSpinner extends RouteObserver(HTMLElement) {
    constructor() {
        super();

        this.attachShadow({mode: 'open'});

        render(baseRenderer(), this.shadowRoot);

        this._spinner = this.shadowRoot.querySelector("[role=spinner]");
    }

    onRouteRequest(request) {
        this._spinner.setAttribute("active", "");
        this.setAttribute("active", "");
    }

    onRouteResponse(response, intermediate) {
        if (!intermediate) {
            this._spinner.removeAttribute("active");
            this.removeAttribute("active");
        }
    }
}


function baseRenderer() {
    return html`
    <style>
        :host {
            display: block;
            text-align: center;
            height: 0;
        }
        paper-spinner {
            padding: 16px;
        }
    </style>
    <paper-spinner role="spinner"></paper-spinner>
`;
}


customElements.define('route-spinner', RouteSpinner);


export { RouteSpinner }
