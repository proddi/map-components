import {html, render, repeat} from '../../map/lit-html.js';
import {BaseRouter} from '../../generics.js';
import {RouteObserver} from '../../map/mixins.js';

import {formatDuration, formatTime, formatDistance} from '../../map/tools.js';

import './mc-icon.js';


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

        this.attachShadow({mode: 'open'});
    }

    selectLeg(leg) {
        if (leg !== this.selectedLeg) {
            if (this.selectedLeg) this.shadowRoot.querySelector(`[data-leg="${this.selectedLeg.id}"]`).classList.remove('active');
            this.selectedLeg = leg;
            if (this.selectedLeg) this.shadowRoot.querySelector(`[data-leg="${this.selectedLeg.id}"]`).classList.add('active');
        }
    }

    onRouteSelected(route) {
        render(this.render(route), this.shadowRoot);
        this.setAttribute("selected", "");
    }

    onRouteDeselected(route) {
        this.selectedLeg = null;
        this.removeAttribute("selected");
    }

    _toggleLegElement(leg, selector, cssClass="hidden") {
        this.shadowRoot.querySelector(`[data-leg="${leg.id}"] ${selector}`).classList.toggle(cssClass);
    }

    render(route) {
        return html`
            <style>
                :host {
                    display: block;
                    overflow-y: hidden;
                    overflow-y: auto;
                }
                .list-group {
                    padding-bottom: 1px;
                    padding-left: 0;
                    margin-bottom: 0;
                }
                .list-item {
                    font-size: .80em;
                    color: #495057;
                    box-sizing: border-box;

                    /* cursor: pointer; */
                    position: relative;
                    background-color: transparent;
                    transition: background-color .2s ease;
                    border-radius: 3px;
                }
                .list-item:hover {
                    background-color: #eee;
                }
                .list-item.active {
                    background-color: rgba(55, 88, 123, .2);
                }

                /* GENERIC BODY STYLES */
                .list-item > header,
                .list-item > content,
                .list-item > ul {
                    display: block;
                    margin: 6px 0;
                }
                .list-item > ul {
                    padding: 0;

                }
                .list-item > header,
                .list-item > content,
                .list-item > ul > li {
                    position: relative;
                    padding: 3px 12px 3px 50px;
                }

                .list-item ul.steps > li {
                    background-color: transparent;
                    transition: background-color .2s ease;
                    cursor: pointer;
                }

                .list-item ul.steps > li:hover {
                    background-color: rgba(0, 0, 0, .075);
                }

                /* HEADER STYLES */

                /* CONTENT STYLES */
                .list-item content > div {
                    font-size: .9em;
                    opacity: .7;
                }

                .list-item content .distance {
                    color: rgb(44, 72, 161);
                }

                .list-item content ul {
                    margin: 0;
                    list-style: none;
                    p_adding: 10px 0;
                }
                .l_ist-item content ul {
                    margin: 2px -12px 2px -50px;
                }

                .l_ist-item content ul > li {
                    padding: 6px 0;
                }

                .list-item > ul.stops > li {
                    padding-top: 2px;
                    padding-bottom: 2px;
                }
                .list-item > ul.stops > li:after {
                    position: absolute;
                    top: calc(50% - 6px);
                    left: 18px;
                    width: 6px;
                    height: 6px;
                    content: "";
                    border: 3px solid var(--line-color);
                    background: white;
                    border-radius: 6px;
                    transition: background .15s ease;
                    z-index: 3;
                }
                .list-item > ul.steps > li:hover:after {
                    background: var(--line-color);
                }

                .list-item .steps-toggle {
                    color: rgb(44, 72, 161);
                    cursor: pointer;
                }

                .list-item .steps-toggle:hover {
                    text-decoration: underline;
                }

                .list-item.steps-hidden ul {
                    display: none;
                }



                /* GENERIC STYLES */
                time {
                    float: right;
                    padding-left: 7px;
                }

                .no-wrap {
                    white-space: nowrap;
                }

                .ellipsis {
                    text-overflow: ellipsis;
                    overflow-x: hidden;
                }

                /* HEADER STYLES */


                /* GFX STYLES */
                .leg-icon {
                    position: absolute;
                    left: 12px;
                    top: 0;
                    width: 24px;
                    height: 24px;
                    fill: var(--line-color);
                }

                .maneuver-icon {
                    position: absolute;
                    left: 12px;
                    top: 5px;
                    width: 16px;
                    height: 16px;
                    fill: #2c48a1;

                }

                .list-item .line {
                    position: absolute;
                    top: 27px;
                    left: 22px;
                    bottom: -4px;
                    border-left: 4px solid var(--line-color, rgb(75, 81, 89));
                    z-index: 2;
                }
                .list-item .line.line-walk {
                    border-left-style: dotted;
                }
                .list-item .line.line-car {
                    border-left-style: dotted;
                }


            </style>

            <div role="listbox">
                ${repeat((route.legs || []), (leg) => leg.id, (leg, index) => this.renderLeg(leg))}
                ${this.arrivalRenderer(route)}
            </div>
        `;
    }

    arrivalRenderer(route) {
        return html`
            <div class="list-item">
                <mc-icon class="leg-icon" icon="mc:place"></mc-icon>
                <header><time>${formatTime(route.arrival.time)}</time>Arrive at ${route.arrival.name}</header>
            </div>
        `;
    }

    renderLeg(leg) {
        const renderer = this[`${leg.transport.type}LegRenderer`] || this.defaultLegRenderer;
        return renderer.call(this, leg);
    }

    defaultLegRenderer(leg) {
        return html`
            <div class="list-item" data-leg="${leg.id}"
                    style="--line-color: ${leg.transport.color || 'rgb(75, 81, 89)'}"
                    @click=${_ => this.selectLeg(leg)}>
                <mc-icon class="leg-icon" icon="${foo(leg)}"></mc-icon>
                <div class="line"></div>
                <header><time datetime="PT2H30M">${leg.departure.timeString}</time>${leg.summary}</header>
                <content>
                    <div>type: ${leg.transport.type} ${foo(leg)} - color: ${leg.transport.color} - name: ${leg.transport.name}</div>
                </content>
            </div>
        `;
    }

    walkLegRenderer(leg) {
        return html`
            <div class="list-item" data-leg="${leg.id}" style="--line-color: #2c48a1"
                    @click=${_ => this.selectLeg(leg)}>
                <mc-icon class="leg-icon" icon="mc:walk"></mc-icon>
                <div class="line line-walk"></div>
                <header><time>${leg.departure.timeString}</time>${leg.summary}</header>
                <content>
                    <div><span class="distance">${formatDistance(leg.distance)}</span> &nbsp; (${formatDuration(leg.departure.time, leg.arrival.time)})</div>
                    <div>Steps: ${leg.steps.length}</div>
                </content>
            </div>
        `;
    }

    busLegRenderer(leg) {
        return this.transitLegRenderer(leg);
    }

    tramLegRenderer(leg) {
        return this.transitLegRenderer(leg);
    }

    metroLegRenderer(leg) {
        return this.transitLegRenderer(leg);
    }

    subwayLegRenderer(leg) {
        return this.transitLegRenderer(leg);
    }

    trainLegRenderer(leg) {
        return this.transitLegRenderer(leg);
    }

    highspeed_trainLegRenderer(leg) {
        return this.transitLegRenderer(leg);
    }

    bus_rapidLegRenderer(leg) {
        return this.transitLegRenderer(leg);
    }

    transitLegRenderer(leg) {
        return html`
            <div class="list-item steps-hidden" data-leg="${leg.id}"
                    style="--line-color: ${leg.transport.color || 'rgb(75, 81, 89)'}"
                    @click=${_ => this.selectLeg(leg)}>
                <div class="line line-transit" style="border-color: ${leg.transport.color}"></div>
                <mc-icon class="leg-icon" icon="${foo(leg)}" st_yle="fill:${leg.transport.color}"></mc-icon>
                <header class="no-wrap">
                    <time>${leg.departure.timeString}</time>${leg.departure.name}
                </header>
                <content class="steps-hidden">
                    <header class="no-wrap" title="${leg.transport.name} towards ${leg.transport.headsign}" style="color: var(--line-color)">${leg.transport.name} → ${leg.transport.headsign}</header>
                    <div>
                        <span class="steps-toggle" @click=${_ => this._toggleLegElement(leg, "", "steps-hidden")}>Stops: ${leg.steps.length}</span> &nbsp; (${formatDuration(leg.departure.time, leg.arrival.time)})
                    </div>
                </content>
                <ul class="steps stops">
                ${repeat(leg.steps || [], (step, index) => html`
                    <li class="no-wrap ellipsis"><time>${formatTime(step.time)}</time>${step.name}</li>
                `)}
                </ul>
            </div>
        `;
    }

    carLegRenderer(leg) {
        return html`
            <div class="list-item" data-leg="${leg.id}" style="--line-color: #2c48a1"
                    @click=${_ => this.selectLeg(leg)}>
                <div class="l_ine line-car"></div>
                <mc-icon class="leg-icon" icon="mc:car"></mc-icon>
                <header>
                    <time>${leg.departure.timeString}</time>Start at ${leg.departure.name}
                </header>
                <content>
                    <div><span class="distance">${formatDistance(leg.distance)}</span> &nbsp; (${formatDuration(leg.departure.time, leg.arrival.time)})</div>
                    <div>
                        <span class="steps-toggle" @click=${_ => this._toggleLegElement(leg, "", "steps-hidden")}>Manuevers: ${leg.steps.length}</span>
                    </div>
                </content>
                <ul class="steps maneuvers">
                ${repeat(leg.steps || [], (step, index) => html`
                    <li>
                        <mc-icon class="maneuver-icon" icon="maneuvers:turn-left"></mc-icon>
                        <div class="ellipsis"><time>${formatTime(leg.departure.time)}</time>${step.name}</div>
                    </li>
                `)}
                </ul>
            </div>
        `;
    }

}


const _TYPE_MAP = {
    walk:       "mc:walk",
    bike:       "mc:bike",
    car:        "mc:car",
    bus:        "mc:bus",
    bus_rapid:  "mc:bus",
    tram:       "mc:tram",
    subway:     "mc:subway",
    metro:      "mc:metro",
    highspeed_train:    "mc:train",
    train:      "mc:train",
}
function foo(leg) {
    return _TYPE_MAP[leg.transport.type] || "mc:transit";
}

customElements.define('route-details', RouteDetails);


export { RouteDetails }
