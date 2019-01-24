import {html, render, repeat} from '../../map/lit-html.js';
import {BaseRouter} from '../../generics.js';
import {RouteObserver} from '../../map/mixins.js';

import '/node_modules/@polymer/paper-item/paper-icon-item.js';
import '/node_modules/@polymer/paper-item/paper-item-body.js';
import '/node_modules/@polymer/iron-icons/iron-icons.js';
import '/node_modules/@polymer/iron-icons/maps-icons.js';


/**
 * Shows journey details of the selected route of a {@link RouteSource}.
 *
 * @example
 * <router role="route-source" ...></router>
 *
 * <route-details></route-details>
 *
 * @extends {RouteObserver}
 * @extends {HTMLElement}
 *
 **/
class RouteDetails extends RouteObserver(HTMLElement) {
    constructor() {
        super();

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

        // initial render
        render(this._baseRenderer({}), this.shadowRoot);
    }

    onRouteSelected(route) {
        render(this._baseRenderer(route, this._legRenderer), this.shadowRoot);
        this.setAttribute("selected", "");
    }

    onRouteDeselected(route) {
        this.removeAttribute("selected");
    }
}


import {Leg, Transport} from '../../generics.js';

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
        :h_ost [role=listbox] {
            opacity: 0;
            transition: opacity .3s ease;
        }
        :h_ost([selected]) [role=listbox] {
            opacity: 1;
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


import {formatDuration, formatTime, formatDistance} from '../../map/tools.js';


function getDefaultRenderer(self) {
    return (leg, route) => html`
      <paper-icon-item data-leg="${route.uid}">
        <iron-icon icon="${foo(leg)}" slot="item-icon"></iron-icon>
        <paper-item-body two-line>
          <div>
            <span style="float:right">${leg.departure.timeString}</span>${leg.summary}
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


function getTransitRenderer(self) {
    return (leg, route) => html`
      <paper-icon-item data-leg="${leg.id}">
        <iron-icon icon="${foo(leg)}" slot="item-icon" style="fill:${leg.transport.color}"></iron-icon>
        <paper-item-body>
          <div>
            <span style="float:right">${leg.departure.timeString}</span>${leg.departure.name}
          </div>
        </paper-item-body>
      </paper-icon-item>

      <paper-icon-item data-leg="${leg.id}" tabIndex="-1">
        <div class="line ${leg.transport.type}" style="border-color: ${leg.transport.color}"></div>
        <paper-item-body two-line>
          <div>
            <div class="leg-details" title="${leg.transport.name} towards ${leg.transport.headsign}" style="color:${leg.transport.color}">
                ${leg.transport.name} → ${leg.transport.headsign}
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


function getWalkRenderer(self) {
    return (leg, route) => html`
      <paper-icon-item data-leg="${leg.id}">
        <iron-icon icon="maps:directions-walk" slot="item-icon" style="fill:rgb(44, 72, 161);"></iron-icon>
        <paper-item-body>
          <div title="${leg.summary}"><span style="float:right;padding-left:5px;">${leg.departure.timeString}</span>${leg.summary}</div>
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
            <span style="float:right">${leg.departure.timeString}</span>Start at ${leg.departure.name}
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
            <span style="float:right">${formatTime(leg.departure.time)}</span>${step.name}
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
            <span style="float:right">${formatTime(leg.arrival.time)}</span>Arrive at ${leg.arrival.name}
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