import { html, render, repeat } from '../../map/lit-html.js';
import { RouteObserver } from '../mixins.js';
import { Leg, Transport } from '../../generics.js';

import '@proddi/x-icons/x-icon.js';


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

        /**
         * Defines the behavior of selectRoute(). It get's set by the `toggle` attribute. By default toggling isn't
         * active.
         * @attribute {toggle} - foooo
         * @type {boolean}
         */
        this.toggleSelection = this.hasAttribute("toggle");

        this._rootNode = this.getRootNode();

        // initial rendering
        this.onRouteClear();
    }

    /**
     * @experimental
     * @returns {DOMNode} The elements root node
     */
    createRenderRoot() {
        this.attachShadow({mode: 'open'});
        return this.shadowRoot;
    }

    /**
     * @deprecated
     * @returns {DOMNode} The elements root node
     */
    getRootNode() {
        console.warn(`RouteSelector.getRootNode() is deprecated - use .createRenderRoot() instead!`)
        return this.createRenderRoot();
    }

    /**
     * @param {Route} route
     */
    selectRoute(route) {
        if (route === this.routeSource.routeSelected && this.toggleSelection) {
            this.routeSource.deselectRoute(route);
        } else {
            this.routeSource.selectRoute(route);
        }
    }

    /**
     * @param {RouteRequest} request
     */
    onRouteRequest(request) {
//        this.setAttribute("loading", "");
//        this.removeAttribute("error");
//        this.removeAttribute("routes");
//        this.classList.remove("active");
        this.onRouteClear();
    }

    /**
     * @param {RouteResponse} response
     */
    onRouteResponse(response, intermediate, source) {
        render(this.render(response), this._rootNode);
        if (source.routeSelected) {
            this.onRouteSelected(source.routeSelected);
        } else {
//            this.removeAttribute("selected");
        }
        if (!response.error) this.classList.add("active");
//        this.setAttribute(respone.error ? "error" : "routes", "");
//        this.removeAttribute("loading");
    }

    onRouteClear() {
//        render(this._baseRenderer(this, {}, this._routeRenderer), this._rootNode);
//        this.removeAttribute("error");
//        this.removeAttribute("routes");
        this.removeAttribute("selected");
        this.classList.remove("active");
    }

    /**
     * @param {Route} route
     */
    onRouteSelected(route) {
        this.setAttribute("selected", route.id);
        let node = this._rootNode.querySelector(`[data-route="${route.uid}"]`);
        if (node) node.classList.add('active');
        else console.warn("Not existing route selected:", route.id);
    }


    /**
     * @param {Route} route
     */
    onRouteDeselected(route) {
        this.removeAttribute("selected");
        let node = this._rootNode.querySelector(`[data-route="${route.uid}"]`);
        if (node) node.classList.remove('active');
    }

    /**
     * @param {RouteResponse} response
     * @return {TemplateResult}
     */
    render(response) {
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
                    f_ont-size: .80em;
                    line-height: 1.5;
                    color: #495057;
                    box-sizing: border-box;

                    cursor: pointer;
                    position: relative;
                    padding: 4px 12px 4px 50px;
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


                .list-item small {
                    float: right;
                    font-size: .75em;
                    padding-top: .25em;
                    opacity: .8;
                }

                .list-item content {
                    display: block;
                }


                .list-item content.route-modes {
                    white-space: nowrap;
                    font-size: .9em;
                    overflow-x: hidden;
                    text-overflow: ellipsis;
                }

                .list-item.active content.route-modes {
                    te_xt-shadow: 0 0 3px #fff;
                    m_ix-blend-mode: lighten;
                }

                .list-item content.route-lines {
                    background-color: #f0f0f0;
                    width: 100%;
                    border-radius: 0.9rem;
                    height: 0.3rem;
                    margin: 0.2rem 0 0.3rem 0;
                }
                .list-item content.route-lines > span {
                    display: inline-block;
                    vertical-align: top;
                    height: 0.3rem;
                    border-right: 2px solid white;
                    background-color: #ccc;
                }

                .list-item footer {
                    font-size: .9em;
                    opacity: .8;
                }

                .list-item .list-item-icon {
                    position: absolute;
                    left: 12px;
                    top: calc(50% - 12px);
                    width: 24px;
                    height: 24px;
                    fill: currentColor;
                    filter: drop-shadow(2px 2px 1px rgba(0, 0, 0, .2));
                }
                ___.list-item svg.list-item-icon {
                    fill: currentcolor;
                    filter: opacity(90%)
                    f_ilter: invert(100%);
                    _drop-shadow(2px 2px 5px black);
                }
            </style>

            <div class="list-group">
                ${repeat(response.routes || [], (route) => route.id, (route, index) => this.renderRoute(route, response))}
            </div>
        `
    }

    /**
     * @param {Route} route
     * @param {RouteResponse} response
     * @return {TemplateResult}
     */
    renderRoute(route, response) {
        return html`
            <div class="list-item" data-route="${route.uid}"
                    @click=${_ => this.selectRoute(route)}
                    @mouseenter=${_ => this.routeSource.emphasizeRoute(route, "highlighted")}
                    @mouseleave=${_ => this.routeSource.emphasizeRoute(route)}>
                <x-icon class="list-item-icon" icon="mc:${route.router.type || 'transit'}"></x-icon>
                <header><small style="float:right">${route.router.type}</small>${route.duration}</header>
                <content class="route-modes">
                    ${route.legs.filter(leg => leg.transport.type !== "walk").map(leg => html`<span class="leg leg-${leg.transport.type}" title="${leg.summary || ''}" style="color: ${leg.transport.color};">${leg.transport.name}</span>  &rsaquo; `)}
                </content>
                <content class="route-lines">${this.iterAbsoluteLegWidth(route, response).map(([leg, width]) => html`<span class="${leg.transport.type}" title="${leg.summary || ''}" style="width: calc(${width}% - 2px); background-color: ${leg.transport.color};"></span>`)}</content>
                <footer>
                    <small>${route.router.name}</small>
                    Leave: ${route.departure.timeString} -&gt; ${route.arrival.timeString}
                </footer>
            </div>
        `
    }

    /**
     * @param {Route} route
     * @param {RouteResponse} response
     * @return {TemplateResult}
     */
    iterAbsoluteLegWidth(route, response) {
        let departure = response.routes.map(route => route.departure).reduce((prev, curr) => curr.time < prev.time ? curr : prev);
        let arrival = response.routes.map(route => route.arrival).reduce((prev, curr) => curr.time > prev.time ? curr : prev);
        let duration = (arrival.time - departure.time) / 100;
        let waiting = new Leg(departure, route.legs[0].departure, WAITING, [], {id:"0", summary: "wait here"});
        return [waiting].concat(route.legs).map(leg => [leg, (leg.arrival.time - leg.departure.time)/duration]).filter(([leg, width]) => width != 0);
    }
}

// used in .iterAbsoluteLegWidth()
const WAITING = new Transport({type: "wait", name: "wait", color: "transparent", summary: "Waiting..."});


customElements.define('route-selector', RouteSelector);


export { RouteSelector }
