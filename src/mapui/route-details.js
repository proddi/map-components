import {html, render, repeat} from '../map/lit-html.js';
import {BaseRouter} from '../generics.js';
import {SelectedMixin} from '../map/mixins.js';

import 'https://unpkg.com/@polymer/paper-item/paper-icon-item.js?module';
import 'https://unpkg.com/@polymer/paper-item/paper-item-body.js?module';
import 'https://unpkg.com/@polymer/iron-icons@3.0.1/iron-icons.js?module';
import 'https://unpkg.com/@polymer/iron-icons@3.0.1/maps-icons.js?module';


/**
 * Selector watches a router and emits style events according to user input (mouse)
 *
 * @example
 * <router id="router" ...></router>
 *
 * <route-details router="#router"></route-details>
 *
 * @extends {SelectedMixin}
 * @extends {HTMLElement}
 * @implements {SelectedMixin}
 *
 **/
class RouteDetails extends SelectedMixin(HTMLElement) {
    /** @private */
    constructor() {
        super();

        /**
         * contains the {@link Route} to display.
         * @type {Route}
         */
        this.selectedItem = undefined;

        // get templates
        this._baseRenderer  = baseRenderer;

        let defaultRenderer = getDefaultRenderer(this);
        let transitRenderer = getTransitRenderer(this);
        let carRenderer     = getCarRenderer(this);
        let walkRenderer    = getWalkRenderer(this);
        let arrivalRenderer = getArrivalRenderer(this);

        this._legTypeTemplates = {
            default:    defaultRenderer,
            walk:       walkRenderer,
            car:        carRenderer,
            bus:        transitRenderer,
            tram:       transitRenderer,
            subway:     transitRenderer,
            metro:      transitRenderer,
            train:      transitRenderer,
            highspeed_train:      transitRenderer,
            bus_rapid:  transitRenderer,
            arrival:    arrivalRenderer,
        }
        this._legRenderer = (leg, route) => (this._legTypeTemplates[leg.transport.type] || defaultRenderer)(leg, route);

        // prepare root
        this.attachShadow({mode: 'open'});
        this.clear();
    }

    onItemSelected(route) {
        this.showRoute(route);
    }

    onItemDeselected(route) {
        this.clear();
    }

    showLoading(request) {
        this.clear();
    }

    showRoute(route) {
        render(this._baseRenderer(route, this._legRenderer), this.shadowRoot);
    }

    showResponse(response) {
        this.showRoute(response.routes[0]);
    }

    clear() {
        render(this._baseRenderer({}), this.shadowRoot);
    }
}


import {Leg, Transport} from '../generics.js';

function bar(route) {
    if ((route.legs || []).length) {
        return [new Leg(undefined, route.arrival, new Transport({type:"arrival"}), [])];
    }
    return [];
}


function baseRenderer(route, legTemplate) {
    return html`
    <style>
        :host {
            display: block;
        }
        :host paper-icon-item {
            position: relative;
        }
        :host paper-icon-item .line{
            position: absolute;
            top: -8px;
            left: 26px;
            bottom: -7px;
            border-left: 4px solid rgb(75, 81, 89);
        }
        :host paper-icon-item .line-walk {
            border-color: rgb(44, 72, 161);
            border-left-style: dotted;
        }
        :host paper-icon-item.leg-walk .distance {
            color: rgb(44, 72, 161);
        }
        :host paper-icon-item .line-car {
            border-color: #2c48a1;
            border-left-style: dotted;
        }
    </style>

    <div role="listbox">
        ${repeat((route.legs || []).concat(bar(route)), (leg) => leg.id, (leg, index) => legTemplate(leg, route))}
    </div>
`;
}


import {formatDuration, formatTime, formatDistance} from '../map/tools.js';


function getTransitRenderer(self) {
    return (leg, route) => html`
      <paper-icon-item data-leg="${leg.id}">
        <iron-icon icon="${foo(leg)}" slot="item-icon" style="fill:${leg.transport.color}"></iron-icon>
        <paper-item-body>
          <div>
            <span style="float:right">${leg.departure.timeString}</span>
            <div>${leg.departure.name}</div>
          </div>
        </paper-item-body>
      </paper-icon-item>

      <paper-icon-item data-leg="${leg.id}" tabIndex="-1">
        <div class="line ${leg.transport.type}" style="border-color: ${leg.transport.color}"></div>
        <paper-item-body two-line>
          <div>
            <div class="leg-details" style="color:${leg.transport.color}">
                ${leg.transport.name} → ${leg.transport.headsign}<br>
            </div>
          </div>
          <div secondary>
            Stops: ${leg.steps.length} &nbsp; (${formatDuration(leg.departure.time, leg.arrival.time)})
          </div>

        ${leg.steps.length>4 ? html`<div secondary>...</div>` : ``}
        ${repeat(leg.steps.slice(-4) || [], (step, index) => html`
          <div secondary><span style="float:right">${formatTime(step.time)}</span>${step.name}</div>
        `)}

        </paper-item-body>
      </paper-icon-item>
`;
}


function getDefaultRenderer(self) {
    return (leg, route) => html`
      <paper-icon-item data-leg="${route.uid}">
        <iron-icon icon="${foo(leg)}" slot="item-icon"></iron-icon>
        <paper-item-body two-line>
          <div>
            <span style="float:right">${leg.departure.timeString}</span>
            <div>${leg.summary}</div>
          </div>
          <div secondary>
            <div class="leg-details">
                type: ${leg.transport.type} ${foo(leg)} - color: ${leg.transport.color} - name: ${leg.transport.name}
            </div>
          </div>
        </paper-item-body>
      </paper-icon-item>
`;
}


function getWalkRenderer(self) {
    return (leg, route) => html`
      <paper-icon-item data-leg="${leg.id}">
        <iron-icon icon="maps:directions-walk" slot="item-icon" style="fill:rgb(44, 72, 161);"></iron-icon>
        <paper-item-body>
          <div>
            <span style="float:right">${leg.departure.timeString}</span>
            <div>${leg.summary}</div>
          </div>
        </paper-item-body>
      </paper-icon-item>

      <paper-icon-item data-leg="${leg.id}" class="leg-walk">
        <div class="line line-walk"></div>
        <paper-item-body>
          <div secondary><span class="distance">${formatDistance(leg.distance)}</span> &nbsp; (${formatDuration(leg.departure.time, leg.arrival.time)})</div>
          <div secondary>Steps: ${leg.steps.length}</div>
        </paper-item-body>
      </paper-icon-item>
`;
}


function getCarRenderer(self) {
    return (leg, route) => html`
      <paper-icon-item data-leg="${leg.id}">
        <iron-icon icon="maps:directions-car" slot="item-icon"></iron-icon>
        <paper-item-body two-line>
          <div>
            <span style="float:right">${leg.departure.timeString}</span>
            <div>Drive from at ${leg.departure.name}</div>
          </div>
          <div secondary><span class="distance">${formatDistance(leg.distance)}</span> &nbsp; (${formatDuration(leg.departure.time, leg.arrival.time)})</div>
          <div secondary>Manuevers: ${leg.steps.length}</div>
        </paper-item-body>
      </paper-icon-item>
        ${repeat(leg.steps || [], (step, index) => html`

      <paper-icon-item data-leg-step="${leg.id}-1">
        <div class="line line-car"></div>
        <iron-icon icon="maps:near-me" slot="item-icon"></iron-icon>
        <paper-item-body>
          <div secondary>
            <span style="float:right">${formatTime(leg.departure.time)}</span>
            <div>${step.name}</div>
          </div>
        </paper-item-body>
      </paper-icon-item>

        `)}
`;
}


function getArrivalRenderer(self) {
    return (leg, route) => html`
      <paper-icon-item>
        <iron-icon icon="maps:place" slot="item-icon"></iron-icon>
        <paper-item-body>
          <div>
            <span style="float:right">${formatTime(leg.arrival.time)}</span>
            <div>Arrive at ${leg.arrival.name}</div>
          </div>
        </paper-item-body>
      </paper-icon-item>
`;
}


const _TYPE_MAP = {
    walk:       "maps:directions-walk",
    bike:       "maps:directions-bike",
    car:        "maps:directions-car",
    bus:        "maps:directions-bus",
    bus_rapid:  "maps:directions-bus",
    tram:       "maps:tram",
    subway:     "maps:directions-subway",
    metro:      "maps:directions-railway",
    highspeed_train:    "maps:train",
    train:      "maps:train",
}
function foo(leg) {
    return _TYPE_MAP[leg.transport.type] || "maps:directions-transit";
}

customElements.define('route-details', RouteDetails);


export { RouteDetails }
