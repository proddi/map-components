import {parseCoordString, parseString, loadScript, loadStyle} from '../generics.js';
import {loadResources3d} from './_tools.js'


/**
 * Shows HERE map. This is the base canvas for other visualisation elements.
 * It requires a {@link MapboxPlatform} component to handle credentials.
 *
 * @example
 * <mapbox-platform token="..."></mapbox-platform>
 *
 * <mapbox-map3d platform="mapbox-platform" center="13.5,52.5" zoom="11">
 * </mapbox-map3d>
 *
 * @see https://developer.here.com/documentation/maps/
 **/
class MapboxMap3d extends HTMLElement {
    constructor() {
        super();
        let platform = document.querySelector(this.getAttribute("platform"));
        let center = parseCoordString(this.getAttribute("center"));
        let zoom   = this.getAttribute("zoom");

        /** @type {Promise<{L:L, mapboxgl:mapboxgl, map:mapboxgl.Map}>} */
        this.whenReady = loadResources3d(parseString(this.getAttribute("token"), window)).then(({L, mapboxgl}) => {
            let map = new mapboxgl.Map({
                style: 'mapbox://styles/mapbox/streets-v10',
                center: center,
                zoom: zoom,
                pitch: 45,
                bearing: -17.6,
                container: this,
            });
            return new Promise((resolve, reject) => {
                map.on('load', function () {
                    resolve({L:L, mapboxgl:mapboxgl, map:map});
                });
            });
        });
    }
}


/**
 * @external {mapboxgl.Map} https://www.mapbox.com/mapbox-gl-js/api/#map
 */

/**
 * @external {mapboxgl} https://www.mapbox.com/mapbox-gl-js/api/
 */


customElements.define("mapbox-map3d", MapboxMap3d);


export { MapboxMap3d }
