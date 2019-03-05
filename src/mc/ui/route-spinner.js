import {html, render} from '../../map/lit-html.js';
import {RouteObserver} from '../../mc/mixins.js';

import 'https://unpkg.com/@polymer/paper-spinner/paper-spinner.js';


/**
 * An spinner that's visible when the {@link RouteSource} is requesting.
 *
 * @example <caption>used in route-selector</caption>
 * <router role="route-source" ...></router>
 *
 * <route-selector>
 *   <route-spinner slot="center"></route-spinner>
 * </route-selector>
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
