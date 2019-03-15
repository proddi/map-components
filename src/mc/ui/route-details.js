import { html, render, repeat } from '../../mc/lit-html.js';
import { RouteObserver } from '../mixins.js';
import { formatDuration, formatTime, formatDistance } from '../../map/tools.js';

import '@proddi/x-icons/x-icon.js';


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

        this.legRenderer = {
            default:    leg => this.defaultLegRenderer(leg),
            walk:       leg => this.walkLegRenderer(leg),
            bike:       leg => this.carLegRenderer(leg, "bike"),
            car:        leg => this.carLegRenderer(leg, "car"),
            train:      leg => this.transitLegRenderer(leg),
            bus:        leg => this.transitLegRenderer(leg),
            tram:       leg => this.transitLegRenderer(leg),
            metro:      leg => this.transitLegRenderer(leg),
            subway:     leg => this.transitLegRenderer(leg),
            monorail:   leg => this.transitLegRenderer(leg),
        }

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
                    f_ont-size: .80em;
                    line-height: 1.5;
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
                /* remove margin for the first elements .... ???
                .list-item:first-child > :first-child {
                    margin-top: 0;
                }
                */
                .list-item > ul {
                    padding: 0;
                    list-style: none;

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
                .list-item content.info {
                    font-size: .9em;
                    opacity: .7;
                }

                .list-item content ul {
                    margin: 0;
                    list-style: none;
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


                /* ===== GENERIC STYLES ===== */
                .no-wrap {
                    white-space: nowrap;
                }

                .ellipsis {
                    text-overflow: ellipsis;
                    overflow-x: hidden;
                }

                time {
                    float: right;
                    padding-left: 7px;
                }

                .distance {
                    color: rgb(44, 72, 161);
                }

                /* HEADER STYLES */



                /* GFX STYLES */
                .leg-icon {
                    position: absolute;
                    left: 12px;
                    top: 6px;
                    width: 24px;
                    height: 24px;
                    color: var(--line-color);
                    filter: drop-shadow(2px 2px 1px rgba(0, 0, 0, .2));
                }

                .maneuver-icon {
                    position: absolute;
                    left: 22px;
                    top: 5px;
                    width: 16px;
                    height: 16px;
                    color: #2c48a1;
                    filter: drop-shadow(2px 2px 1px rgba(0, 0, 0, .2));
                }

                .line {
                    position: absolute;
                    top: 33px;
                    left: 22px;
                    bottom: -10px;
                    border-left: 4px solid var(--line-color, rgb(75, 81, 89));
                    z-index: 2;
                }


                /* ===== LEG TYPE SPECIFIC STYLES ===== */
                .list-item.walk-item > ul.steps > li {
                    margin-left: 30px;
                }

                .list-item.walk-item .line {
                    border-left-style: dotted;
                }

                .list-item.car-item .line {
                    border-left-style: dashed;
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
                <x-icon class="leg-icon" icon="transit:place"></x-icon>
                <header><time>${formatTime(route.arrival.time)}</time>Arrive at ${route.arrival.name}</header>
            </div>
        `;
    }

    renderLeg(leg) {
        const [basetype] = `${leg.transport.type}/`.split("/", 1);
        const renderer = this.legRenderer[leg.transport.type] || this.legRenderer[basetype] || this.legRenderer.default;
        return renderer(leg);
    }

    defaultLegRenderer(leg) {
        return html`
            <div class="list-item" data-leg="${leg.id}"
                    style="--line-color: ${leg.transport.color || 'rgb(75, 81, 89)'}"
                    @click=${_ => this.selectLeg(leg)}>
                <x-icon class="leg-icon" icon="${foo(leg)}"></x-icon>
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
            <div class="list-item walk-item steps-hidden" data-leg="${leg.id}" style="--line-color: #2c48a1"
                    @click=${_ => this.selectLeg(leg)}>
                <x-icon class="leg-icon" icon="transit:walk"></x-icon>
                <div class="line walk-line"></div>
                <header><time>${leg.departure.timeString}</time>${leg.summary}</header>
                <content class="info"><span class="steps-toggle" @click=${_ => this._toggleLegElement(leg, "", "steps-hidden")}>See ${leg.steps.length} directions for this ${formatDistance(leg.distance)} walk</span> &nbsp; (${formatDuration(leg.departure.time, leg.arrival.time)})</content>
                <ul class="steps">
                ${repeat(leg.steps || [], (step, index) => html`
                    <li>
                        <x-icon class="maneuver-icon" icon="maneuver:${step.maneuver}" title="manuever: ${step.maneuver}"></x-icon>
                        <div class="ellipsis"><time>${formatTime(step.time)}</time>${step.name}</div>
                        <div><span class="distance">${formatDistance(leg.distance)}</span></div>
                    </li>
                `)}
                </ul>
            </div>
        `;
    }

    transitLegRenderer(leg) {
        return html`
            <div class="list-item transit-item steps-hidden" data-leg="${leg.id}"
                    style="--line-color: ${leg.transport.color || 'rgb(75, 81, 89)'}"
                    @click=${_ => this.selectLeg(leg)}>
                <div class="line transit-line"></div>
                <x-icon class="leg-icon" icon="${foo(leg)}"></x-icon>
                <header class="no-wrap ellipsis">
                    <time>${leg.departure.timeString}</time>${leg.departure.name}
                </header>
                <content class="no-wrap ellipsis" title="${leg.transport.name} towards ${leg.transport.headsign}" style="color: var(--line-color)">${leg.transport.name} → ${leg.transport.headsign}</content>
                <content class="info"><span class="steps-toggle" @click=${_ => this._toggleLegElement(leg, "", "steps-hidden")}>Stops: ${leg.steps.length}</span> &nbsp; (${formatDuration(leg.departure.time, leg.arrival.time)})</content>
                <ul class="steps stops">
                ${repeat(leg.steps || [], (step, index) => html`
                    <li class="no-wrap ellipsis"><time>${formatTime(step.time)}</time>${step.name}</li>
                `)}
                </ul>
            </div>
        `;
    }

    carLegRenderer(leg, type="car") {
        return html`
            <div class="list-item ${type}-item steps-hidden" data-leg="${leg.id}" style="--line-color: #2c48a1"
                    @click=${_ => this.selectLeg(leg)}>
                <div class="line ${type}-line"></div>
                <x-icon class="leg-icon" icon="transit:${type}"></x-icon>
                <header><time>${leg.departure.timeString}</time>Start at ${leg.departure.name}</header>
                <content>
                    <div><span class="distance">${formatDistance(leg.distance)}</span> &nbsp; (${formatDuration(leg.departure.time, leg.arrival.time)})</div>
                </content>
                <content class="info"><span class="steps-toggle" @click=${_ => this._toggleLegElement(leg, "", "steps-hidden")}>Manuevers: ${leg.steps.length}</span></content>
                <ul class="steps maneuvers">
                ${repeat(leg.steps || [], (step, index) => html`
                    <li>
                        <x-icon class="maneuver-icon" icon="maneuver:turn-left"></x-icon>
                        <div class="ellipsis"><time>${formatTime(leg.departure.time)}</time>${step.name}</div>
                    </li>
                `)}
                </ul>
            </div>
        `;
    }

}


const _TYPE_MAP = {
    walk:       "transit:walk",
    bike:       "transit:bike",
    car:        "transit:car",
    bus:        "transit:bus",
//    bus_rapid:  "transit:bus",
    tram:       "transit:tram",
    subway:     "transit:subway",
    metro:      "transit:metro",
//    highspeed_train:    "transit:train",
    train:      "transit:train",
}
function foo(leg) {
    const [basetype] = `${leg.transport.type}/`.split("/", 1);
    const icon = _TYPE_MAP[basetype];
    if (!icon) console.warn(`No icon for transport type "${leg.transport.type}" -`, leg);
    return icon || "transit:transit";
}

customElements.define('route-details', RouteDetails);


export { RouteDetails }
