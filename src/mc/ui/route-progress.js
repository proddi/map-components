import {html, render} from '../../map/lit-html.js';
import {RouteObserver} from '../../map/mixins.js';

import '/node_modules/@polymer/paper-progress/paper-progress.js';


/**
 * Shows the loading progress of the attached {@link RouteSource}.
 *
 * @example
 * <router role="route-source" ...></router>
 * <route-selector>
 *   <route-progress></route-progress>
 * </route-selector>
 *
 * @extends {RouteObserver}
 * @extends {HTMLElement}
 *
 **/
class RouteProgress extends RouteObserver(HTMLElement) {
    constructor() {
        super();

        this.attachShadow({mode: 'open'});

        render(this._bodyTemplate(), this.shadowRoot);

        this._progress = this.shadowRoot.querySelector("[role=progress]");
    }

    onRouteRequest(request) {
//        this._progress.setAttribute("active", "");
        this.setAttribute("active", "");
    }

    onRouteResponse(response, intermediate) {
        if (!intermediate) {
//            this._progress.removeAttribute("active");
//            setTimeout(_ => this.removeAttribute("active"), 300);
            this.removeAttribute("active");
        }
    }


    _bodyTemplate() {
        return html`
        <style>
            :host {
                display: block;
            }
            :host > [role=progress] {
                width: 100%;
                opacity: 1;
                transition: opacity 1s ease;
            }
            :host(:not([active])) > [role=progress] {
                opacity: 0;
            }
        </style>
        <paper-progress role="progress" indeterminate></paper-progress>
    `;
    }

}


customElements.define('route-progress', RouteProgress);


export { RouteProgress }
