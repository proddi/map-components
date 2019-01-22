import {html, render} from '../../map/lit-html.js';
import {RouteObserver} from '../../map/mixins.js';


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
class RouteError extends RouteObserver(HTMLElement) {
    constructor() {
        super();

        this.attachShadow({mode: 'open'});

        // initial render
        render(baseRenderer({}), this.shadowRoot);
    }

    onRouteRequest(request) {
        this.removeAttribute("error");
    }

    onRouteResponse(response) {
        render(baseRenderer(response), this.shadowRoot);
        if (response.error) this.setAttribute("error", "");
    }
}


function baseRenderer(response) {
    return html`
    <style>
        :host {
            display: block;
        }
        :host > div {
            text-align: center;
            color: red;
            opacity: 0;
            transition: opacity .3s ease;
            padding: 20px;
        }
        :host([error]) > div {
            opacity: 1;
        }
    </style>
    <div>${response.error || ""}</div>
`;
}


customElements.define('route-error', RouteError);


export { RouteError }
