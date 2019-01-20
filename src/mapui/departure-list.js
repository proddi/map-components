import {html, render, repeat} from '../map/lit-html.js';
import {elementTemplate} from '../map/tools.js';
import {SelectorMixin, RouterMixin} from '../map/mixins.js';


/**
 * @extends {RouterMixin}
 * @extends {SelectorMixin}
 */
class DepartureList extends RouterMixin(SelectorMixin(HTMLElement)) {
    constructor() {
        super();

        // get templates
        this._baseRenderer = baseRenderer;
        this._stopRenderer = stopRenderer;

        // prepare root
        this.attachShadow({mode: 'open'});
    }

    onMultiboardResponse(response) {
        this.showResponse(response);
        this.setItems(response.routes, respose.request, response);
    }

    showResponse(response) {
        render(this._baseRenderer(this, response, this._stopRenderer), this.shadowRoot);
    }

}


function baseRenderer(self, response, stopTemplate) {
    return html`
    <style>
        :host {
            display: block;
            overflow-y: hidden;
            overflow-y: auto;
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
    </style>

    <div role="listbox">
        <div>${response.error}</div>
        ${repeat(response.stops || [], (stop) => stop.id, (stop, index) => stopTemplate(self, stop, response))}
    </div>
`;
}


function stopRenderer(self, stop, response) {
    return html`
      <paper-icon-item data-stop="${stop.id}">
        <iron-icon icon="maps:directions-transit" slot="item-icon"></iron-icon>
        <paper-item-body three-line>
          <div>${stop.title} (${stop.router.name})</div>
          <div secondary>
            <div class="route-modes">
                ${stop.departures.map(dep => html`${dep.time.toISOString()} - <span class="leg leg-${dep.transport.type}" title="${dep.summary || ''}" style="color: ${dep.transport.color};">${dep.transport.name}</span> towards ${dep.transport.headsign}<br>`)}
            </div>
          </div>
        </paper-item-body>
      </paper-icon-item>
`;
}


customElements.define('departure-list', DepartureList);


export { DepartureList }
