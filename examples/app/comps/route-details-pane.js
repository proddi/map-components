import {RouteDetails} from '../../../src/mc/ui/route-details.js';
import {elementTemplate} from '../../../src/map/tools.js';
import {RouteObserver} from '../../../src/mc/mixins.js';
import {html, render} from '../../../src/mc/lit-html.js';

class RouteDetailsPane extends RouteObserver(HTMLElement) {
    baseRenderer() {
        return html`
        <style>
            :host {
                display: block;
                z-index: 10;
                position: absolute;
                top: 10px;
                left: -30px;
                bottom: 10px;
                width: 300px;
                background: white;
                border: 1px solid #f1f1f2;
                opacity: 0;
                transition: opacity .3s ease, left .3s ease;
                pointer-events: none;
            }
            :host([visible]) {
                left: 10px;
                opacity: 1;
                pointer-events: inherit;
            }
            :host > [role="header"] {
                border-bottom: 1px solid #f1f1f2;
            }
            :host > content > route-details {
                height: calc(100% - 74px);
                overflow-y: auto;
                overflow-x: hidden;
            }
        </style>
        <header></header>
        <content></content>
        <footer></footer>
        `
    }

    placeholderRederer() { return html`JUST A PLACEHOLDER`; }

    constructor() {
        super();

        // extract sub components
        this._headerRenderer = elementTemplate(this.querySelector('template[role="header"]')) || this.placeholderRederer;
        this._headerElement = this.querySelector('[role="header"]');
        this._contentRenderer = elementTemplate(this.querySelector('template[role="content"]')) || this.placeholderRederer;
        this._footerElement = this.querySelector('[role="footer"]');

        // prepare dom
        this.attachShadow({mode: 'open'});
        render(this.baseRenderer(), this.shadowRoot);
    }

    onRouteSelected(route) {
        this.showRoute(route);
    }

    onRouteDeselected() {
        this.clear();
    }

    showRoute(route) {
        render(this._headerRenderer(route), this.shadowRoot.querySelector("header"));
        render(this._contentRenderer(route), this.shadowRoot.querySelector("content"));
        this.setAttribute("visible", "");
//        this.selectItem(route);
    }

    clear() {
        this.removeAttribute("visible");
//        this.deselectItem();
    }
}

customElements.define('route-details-pane', RouteDetailsPane);
