import {Address} from '../generics.js';
import {html, render, repeat} from '../mc/lit-html.js';
import {MockupRouter} from './mockup-router.js';
import {elementTemplate} from '../map/tools.js';
import {qs, qp, whenElementReady} from '../mc/utils.js';


/**
 * Provides recorded {@link Response}'s without a need for credentials.
 */
class DemoRouter extends MockupRouter {
    /**
     * Type of the router - _"demo"_ for this router.
     * @const
     * @type {string}
     */
    get type() { return 'demo'; }

    constructor() {
        super();

        let base = this.getAttribute("base");
        this.src = base ? base + "{start}-{dest}.json" : this.src;

        /**
         * The target router to be updated with new routes. This is optional.
         * @type {BaseRouter|null}
         */
        this.router = null;
        whenElementReady(qs(this.getAttribute("router") || qp("[role=router]")))
            .then(router => this.router = router)
            .catch(_ => {})  // ignore error
            ;

        /**
         * The available locations to lookup.
         * @type {Object}
         */
        this.locations = {
            A:          new Address({lng:13.31709, lat:52.54441, name:"A"}),
            B:          new Address({lng:13.56, lat:52.41, name:"B"}),
            BERLIN:     new Address({lng:13.447128295898438, lat:52.512864781394114, name:"Berlin"}),
            HALLE:      new Address({lng:11.973157884785905, lat:51.48050248106511, name:"Halle"}),
            UTRECHT:    new Address({lng:5.134984018513933, lat:52.07354489152308, name:"Utrecht"}),
            DORDRECHT:  new Address({lng:4.658216001698747, lat:51.80320799021636, name:"Dordrecht"}),
            LONDON_A:   new Address({lng:-0.38328552246099434, lat:51.53735345562071, name:"LONDON_A"}),
            LONDON_B:   new Address({lng:0.21958923339838066, lat:51.44329522308777, name:"LONDON_B"}),
            PELHAM:     new Address({lng:-73.80951026774704, lat:40.9111206612218, name:"Pelham, NYC"}),
            JFK:        new Address({lng:-73.7893817794975, lat:40.64110273169828, name:"JFK Airport"}),
        }

        this.routes = {
            "Berlin A->B": ["A", "B"],
            "Ger:Berlin->Halle": ["BERLIN", "HALLE"],
            "Ned:Utrecht->Dordrecht": ["UTRECHT", "DORDRECHT"],
            "London:A->B": ["LONDON_A", "LONDON_B"],
            "NYC:Pelham->JFK": ["PELHAM", "JFK"],
        };

        this.attachShadow({mode: 'open'});

        this.showRoutes = this.hasAttribute("show-routes");

        if (this.showRoutes) {
            let itemRenderer = elementTemplate(this.querySelector('template[role="button"]')) || this.itemRenderer;
            render(this.baseRenderer(this.routes, itemRenderer), this.shadowRoot);
        }
    }

    baseRenderer(routes, itemRenderer) {
        return html`
            <style>
                :host {
                    display: block;
                    margin-top: .5em;
                    margin-bottom: .5em;
                    line-height: 1.5em;
                }
                :host span {
                    border: 1px solid rgba(128, 128, 128, .5);
                    box-shadow: 1px 1px 2px rgba(128, 128, 128, .5);
                    border-radius: 2px;
                    padding: 1px 5px;
                    cursor: pointer;
                    margin-left: 5px;
                    margin-right: 5px;
                    white-space: nowrap;
                }
                :host span:hover {
                    background-color: rgba(128, 128, 128, .15);
                }
            </style>

            <div role="listbox">
                ${repeat(Object.entries(routes), (route, index) => itemRenderer.call(this, route[0], route[1][0], route[1][1]))}
            </div>
        `;
    }

    /**
     * The default renderer to create a link
     * @param {string} name
     * @param {Address} start
     * @param {Address} dest
     */
    itemRenderer(name, start, dest) {
        return html`
            <span @click=${_ => (this.router || this).update({start:start, dest:dest})}>${name}</span>
        `
    }
}


customElements.define("demo-router", DemoRouter);


export { DemoRouter }
