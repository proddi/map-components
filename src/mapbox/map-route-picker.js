import {BaseRouter, findRootElement} from '../generics.js';
import {MapboxMap} from './map.js';

/**
 * Adds start+stop map-marker to map and bind them to the router. When markers dragged the router gets updated.
 *
 * @example
 * <here-platform app-id="..." app-code="..."></here-platform>
 * <router id="router"></router>
 *
 * <here-map platform="here-platform" center="13.5,52.5" zoom="11">
 *   <here-map-route-picker router="#router"></here-map-route-picker>
 * </here-map>
 **/
class MapboxMapRoutePicker extends HTMLElement {
    connectedCallback() {
        let mapComp = findRootElement(this, this.getAttribute("map"), MapboxMap);
        let router  = findRootElement(this, this.getAttribute("router"), BaseRouter);

        mapComp.whenReady.then(({L, map}) => {
            let startMarker = L.marker(new L.LatLng(52.5, 13.5), {
                icon: L.mapbox.marker.icon({ 'marker-color': 'ff8888' }),
                draggable: true
            });
            let destMarker = L.marker(new L.LatLng(52.5, 13.5), {
                icon: L.mapbox.marker.icon({ 'marker-color': '8888ff' }),
                draggable: true
            });
            startMarker.addTo(map);
            destMarker.addTo(map);

            function update() {
                router.update({start: startMarker.getLatLng(), dest: destMarker.getLatLng(),});
            }

            startMarker.on('dragend', update);
            destMarker.on('dragend', update);


            // Router
            router.addEventListener("request", ev => {
                let request = ev.detail;
                startMarker.setLatLng(request.start);
                destMarker.setLatLng(request.dest);
                map.fitBounds([request.start, request.dest]);
            });
            if (router.currentRequest) {
                startMarker.setLatLng(router.currentRequest.start);
                destMarker.setLatLng(router.currentRequest.dest);
            }

        });
    }
}


customElements.define("mapbox-map-route-picker", MapboxMapRoutePicker);


export { MapboxMapRoutePicker }
