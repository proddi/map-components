import { parseCoordString, findRootElement} from '../generics.js';
import { MapboxPlatform } from './platform.js';


/**
 * Shows HERE map. This is the base canvas for other visualisation elements.
 * It requires a {@link HerePlatform} component to handle credentials.
 *
 * @example
 * <mapbox-platform token="..."></mapbox-platform>
 *
 * <mapbox-map platform="mapbox-platform" center="13.5,52.5" zoom="11">
 * </mapbox-map>
 *
 * @see https://www.mapbox.com/api-documentation/#maps
 **/
class MapboxMap extends HTMLElement {
    connectedCallback() {
        let platform = findRootElement(this, this.getAttribute("platform"), MapboxPlatform);
        let center = parseCoordString(this.getAttribute("center"));
        let zoom   = this.getAttribute("zoom");

        /** @type {Promise<{L: L, map:L.mapbox.map}>} */
        this.whenReady = platform.whenReady.then(({L}) => {
            let map = L.mapbox.map(this, 'mapbox.streets', {
                zoomControl: false
            }).setView(center, zoom);
            return {L:L, map:map};
        });
    }
}


customElements.define("mapbox-map", MapboxMap);


export { MapboxMap }
