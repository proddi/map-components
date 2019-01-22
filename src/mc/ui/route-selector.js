import {html, render, repeat} from '../../map/lit-html.js';
import {elementTemplate} from '../../map/tools.js';
import {RouteObserver} from '../../map/mixins.js';

import '/node_modules/@polymer/paper-item/paper-icon-item.js';
import '/node_modules/@polymer/paper-item/paper-item-body.js';
import '/node_modules/@polymer/iron-icons/iron-icons.js';
import '/node_modules/@polymer/iron-icons/maps-icons.js';


/**
 * Shows an overview of {@link RouteSource}'s {@link Route}s and allows to select them.
 *
 * @example
 * <router role="route-source" ...></router>
 *
 * <route-selector></route-selector>
 *
 * @extends {RouteObserver}
 * @extends {HTMLElement}
 *
 **/
class RouteSelector extends RouteObserver(HTMLElement) {
    constructor() {
        super();

        // get templates
        this._baseRenderer = baseRenderer;
        this._routeRenderer = routeRenderer;

        /**
         * Defines the behavior of selectRoute(). It get's set by the `toggle` attribute. By default toggling isn't
         * active.
         * @attribute {toggle} - foooo
         * @type {boolean}
         */
        this.toggleSelection = this.hasAttribute("toggle");

        // prepare root
        this.attachShadow({mode: 'open'});

        // initial rendering
        this.onRouteClear();
    }

    selectRoute(route) {
        if (route === this.routeSource.routeSelected && this.toggleSelection) {
            this.routeSource.deselectRoute(route);
        } else {
            this.routeSource.selectRoute(route);
        }
    }

    onRouteRequest(request) {
        this.setAttribute("loading", "");
    }

    onRouteResponse(response) {
        render(this._baseRenderer(this, response, this._routeRenderer), this.shadowRoot);
        this.removeAttribute("loading");
    }

    onRouteClear() {
        render(this._baseRenderer(this, {}, this._routeRenderer), this.shadowRoot);
    }

    onRouteSelected(route) {
        this.setAttribute("selected", "");
    }

    onRouteDeselected(route) {
        this.removeAttribute("selected");
    }
}


import {Leg, Transport} from '../../generics.js';


const WAITING = new Transport({type: "wait", name: "wait", color: "transparent", summary: "Waiting..."});

function foo(response, route) {
    let departure = response.routes.map(route => route.departure).reduce((prev, curr) => curr.time < prev.time ? curr : prev);
    let arrival = response.routes.map(route => route.arrival).reduce((prev, curr) => curr.time > prev.time ? curr : prev);
    let duration = (arrival.time - departure.time) / 100;
    let waiting = new Leg(departure, route.legs[0].departure, WAITING, [], {id:"0", summary: "wait here"});
    return [waiting].concat(route.legs).map(leg => [leg, (leg.arrival.time - leg.departure.time)/duration]);
}


function baseRenderer(self, response, routeTemplate) {
    return html`
    <style>
        :host {
            display: block;
            overflow-y: hidden;
            overflow-y: auto;
        }
        :host [role=listbox] {
            opacity: 1;
            transition: opacity .3s ease;
        }
        :host([loading]) [role=listbox] {
            opacity: 0;
        }
        :host .route-lines {
            background-color: #f0f0f0;
            width: 100%;
            border-radius: 0.9rem;
            height: 0.3rem;
            margin: 0.2rem 0 0.3rem 0;
        }
        :host .route-lines > span {
            display: inline-block;
            vertical-align: top;
            height: 0.3rem;
            border-right: 2px solid white;
            background-color: #b7b9bc;
        }
        :host .route-lines > span.walk {
            background-color: #b7b9bc;
        }
        :host .route-lines > span.car {
            background-color: #2c48a1;
        }
        :host .provider {
            float: right;
        }
        :host paper-icon-item {
            cursor: pointer;
        }
        :host paper-icon-item:hover {
            background-color: rgba(128, 128, 128, .12);
        }

        :host > slot[name=center] {
            display: block;
            position: absolute;
            text-align: center;
            top: 40%;
            left: 0;
            right: 0;
        }
    </style>

    <slot name="top"></slot>
    <slot name="center"></slot>
    <div role="listbox">
        ${repeat(response.routes || [], (route) => route.id, (route, index) => routeTemplate(self, route, response))}
    </div>
    <slot name="bottom"></slot>
`;
}


function routeRenderer(self, route, response) {
    return html`
      <paper-icon-item data-route="${route.uid}"
            @click=${_ => self.selectRoute(route)}
            @mouseenter=${_ => self.routeSource.emphasizeRoute(route, "highlighted")}
            @mouseleave=${_ => self.routeSource.emphasizeRoute(route)}>
        <iron-icon icon="maps:directions-transit" slot="item-icon"></iron-icon>
        <paper-item-body three-line>
          <div>${route.duration}</div>
          <div secondary>
            <div class="route-modes">
                ${route.legs.filter(leg => leg.transport.type !== "walk").map(leg => html`<span class="leg leg-${leg.transport.type}" title="${leg.summary || ''}" style="color: ${leg.transport.color};">${leg.transport.name}</span>  &rsaquo; `)}
            </div>
            <div class="route-lines">
                ${foo(response, route).map(([leg, width]) => html`<span class="${leg.transport.type}" title="${leg.summary || ''}" style="width: ${width}%; background-color: ${leg.transport.color};"></span>`)}
            </div>
            <div class="route-details">
                <span class="provider">${route.router.name}</span>
                Leave: ${route.departure.timeString} -&gt; ${route.arrival.timeString}
            </div>
          </div>
        </paper-item-body>
      </paper-icon-item>
`;
}


customElements.define('route-selector', RouteSelector);


export { RouteSelector }
