import {Address} from '../generics.js';
import {html, render} from 'https://unpkg.com/lit-html?module';
import {repeat} from "https://unpkg.com/lit-html/directives/repeat?module";
import {MockupRouter} from './mockup-router.js';
import {elementTemplate} from '../maps/tools.js';



/**
 * Provides recorded {Response}'s without a need for credentials.
 */
class DemoRouter extends MockupRouter {
    baseRenderer(routes, itemRenderer) {
        return html`
            <style>
                :host {
                    display: block;
                    margin-top: .5em;
                    margin-bottom: .5em;
                }
                :host span {
                    border: 1px solid rgba(128, 128, 128, .5);
                    box-shadow: 1px 1px 2px rgba(128, 128, 128, .5);
                    border-radius: 2px;
                    padding: 1px 5px;
                    cursor: pointer;
                    margin-left: 5px;
                    margin-right: 5px;
                }
                :host span:hover {
                    background-color: rgba(128, 128, 128, .15);
                }
            </style>

            <div role="listbox">
                ${repeat(Object.entries(routes), (route, index) => itemRenderer(this, route[0], route[1][0], route[1][1]))}
            </div>
        `;
    }

    /**
     * The default renderer to create a link
     * @param {BaseRouter} router
     * @param {string} name
     * @param {Address} start
     * @param {Address} dest
     */
    itemRenderer(router, name, start, dest) {
        return html`
            <span @click=${_ => router.update({start:start, dest:dest})}>${name}</span>
        `
    }

    constructor() {
        super();

        this.src = this.getAttribute("base") + "{start}-{dest}.json";

        this.locations = {
            A:          new Address({lng:13.31709, lat:52.54441, name:"A"}),
            B:          new Address({lng:13.56, lat:52.41, name:"B"}),
            BERLIN:     new Address({lng:13.447128295898438, lat:52.512864781394114, name:"Berlin"}),
            HALLE:      new Address({lng:11.973157884785905, lat:51.48050248106511, name:"Halle"}),
            UTRECHT:    new Address({lng:5.134984018513933, lat:52.07354489152308, name:"Utrecht"}),
            DORDRECHT:  new Address({lng:4.658216001698747, lat:51.80320799021636, name:"Dordrecht"}),
            LONDON_A:   new Address({lng:-0.38328552246099434, lat:51.53735345562071, name:"LONDON_A"}),
            LONDON_B:   new Address({lng:0.21958923339838066, lat:51.44329522308777, name:"LONDON_B"}),
        }

        this.routes = {
            "Berlin A->B": ["A", "B"],
            "Ger:Berlin->Halle": ["BERLIN", "HALLE"],
            "Ned:Utrecht->Dordrecht": ["UTRECHT", "DORDRECHT"],
            "London:A->B": ["LONDON_A", "LONDON_B"],
        };

        this.attachShadow({mode: 'open'});

        let itemRenderer = elementTemplate(this.querySelector('template[role="button"]')) || this.itemRenderer;
        render(this.baseRenderer(this.routes, itemRenderer), this.shadowRoot);
    }
}


customElements.define("demo-router", DemoRouter);


export { DemoRouter }
