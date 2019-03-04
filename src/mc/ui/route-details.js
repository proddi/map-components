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
                    d_isplay: flex;
                    f_lex-direction: column;
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
                    padding: 4px 12px 10px 50px;
                    background-color: transparent;
                    transition: background-color .2s ease;
                    border-radius: 3px;
                }
                .list-item:hover {
                    background-color: #eee;
                }
                .list-item.active {
                    c_olor: white;
                    background-color: #007bff;
                    background-color: rgba(55, 88, 123, .2);
                    b_ackground-color: #d2dce8;
                }

                /* HEADER STYLES */
                .list-item header,
                .list-item content {
                    position: relative;
                    margin: 8px 0;
                    t_ext-overflow: ellipsis;
                    o_verflow-x: hidden;
                    w_hite-space: nowrap;
                }


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
                    padding: 10px 0 0 0;
                }
                .list-item content ul li {
                    padding: 6px 0;
                }

                .list-item content ul.stops li {
                    position: relative;
                    padding: 2px 0;
                }
                .list-item content ul.stops li:after {
                    position: absolute;
                    top: calc(50% - 6px);
                    left: -32px;
                    width: 6px;
                    height: 6px;
                    content: "";
                    border: 3px solid var(--line-color);
                    background: white;
                    border-radius: 6px;
                    transition: background .15s ease;
                    z-index: 3;
                }
                .list-item content ul.stops li:hover:after {
                    background: var(--line-color);
                }

                .list-item content .steps-toggle {
                    color: rgb(44, 72, 161);
                    cursor: pointer;
                }

                .list-item content .steps-toggle:hover {
                    text-decoration: underline;
                }

                .list-item content.steps-hidden ul.stops {
                    display: none;
                }



                /* GENERIC STYLES */
                time {
                    float: right;
                    padding-left: 7px;
                }

                .no-wrap {
                    text-overflow: ellipsis;
                    overflow-x: hidden;
                    white-space: nowrap;
                }

                /* HEADER STYLES */


                .list-item > .list-item-icon {
                    position: absolute;
                    left: 12px;
                    top: 12px;
                    width: 24px;
                    height: 24px;
                    fill: var(--line-color);
                }


                .list-item > header > .list-item-icon {
                    position: absolute;
                    left: -38px;
                    top: calc(50% - 12px);
                    width: 24px;
                    height: 24px;
                }




                /* vertical lines */
                .list-item .line {
                    position: absolute;
                    top: 40px;
                    left: 22px;
                    bottom: -9px;
                    border-left: 4px solid var(--line-color, rgb(75, 81, 89));
                    z-index: 2;
                }
                .list-item .line.line-walk {
                    b_order-color: rgb(44, 72, 161);
                    border-left-style: dotted;
                }
                .list-item .line.line-car {
                    b_order-color: #2c48a1;
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
                <mc-icon class="list-item-icon" icon="mc:place"></mc-icon>
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
                <mc-icon class="list-item-icon" icon="${foo(leg)}"></mc-icon>
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
                <mc-icon class="list-item-icon" icon="mc:walk"></mc-icon>
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
            <div class="list-item" data-leg="${leg.id}"
                    style="--line-color: ${leg.transport.color || 'rgb(75, 81, 89)'}"
                    @click=${_ => this.selectLeg(leg)}>
                <div class="line line-transit" style="border-color: ${leg.transport.color}"></div>
                <mc-icon class="list-item-icon" icon="${foo(leg)}" st_yle="fill:${leg.transport.color}"></mc-icon>
                <header class="no-wrap">
                    <time>${leg.departure.timeString}</time>${leg.departure.name}
                </header>
                <content class="steps-hidden">
                    <header class="no-wrap" title="${leg.transport.name} towards ${leg.transport.headsign}" style="color: var(--line-color)">${leg.transport.name} → ${leg.transport.headsign}</header>
                    <div>
                        <span class="steps-toggle" @click=${_ => this._toggleLegElement(leg, "content", "steps-hidden")}>Stops: ${leg.steps.length}</span> &nbsp; (${formatDuration(leg.departure.time, leg.arrival.time)})
                    </div>
                    <ul class="stops">
                    ${repeat(leg.steps || [], (step, index) => html`
                        <li><div class="no-wrap"><time>${formatTime(step.time)}</time>${step.name}</div></li>
                    `)}
                    </ul>
                </content>
            </div>
        `;
    }

    carLegRenderer(leg) {
        return html`
            <div class="list-item" data-leg="${leg.id}" style="--line-color: #2c48a1"
                    @click=${_ => this.selectLeg(leg)}>
                <div class="line line-car"></div>
                <mc-icon class="list-item-icon" icon="mc:car"></mc-icon>
                <header>
                    <time>${leg.departure.timeString}</time>Start at ${leg.departure.name}
                </header>
                <content>
                    <div><span class="distance">${formatDistance(leg.distance)}</span> &nbsp; (${formatDuration(leg.departure.time, leg.arrival.time)})</div>
                    <div>Manuevers: ${leg.steps.length}</div>
                    <ul class="manuevers">
                    ${repeat(leg.steps || [], (step, index) => html`
                        <li class="no-wrap"><time>${formatTime(leg.departure.time)}</time>${step.name}</li>
                    `)}
                    </ul>
                </content>
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
