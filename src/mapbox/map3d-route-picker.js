import {findRootElement} from '../generics.js';


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
class MapboxMap3dRoutePicker extends HTMLElement {
    constructor() {
        super();
        let mapComp = findRootElement(this, this.getAttribute("map"), customElements.get("mapbox-map3d"));
        let router = document.querySelector(this.getAttribute("router"));

        mapComp.whenReady.then(({L, map, mapboxgl}) => {
            let startMarker = new mapboxgl.Marker({ color: "ff8888", draggable: true }).setLngLat([13.5, 52.5]);
            let destMarker = new mapboxgl.Marker({ color: "8888ff", draggable: true }).setLngLat([13.45, 52.5]);
            startMarker.addTo(map);
            destMarker.addTo(map);

            function update() {
                router.update(startMarker.getLngLat(), destMarker.getLngLat());
            }

            startMarker.on('dragend', update);
            destMarker.on('dragend', update);


            // Router
            router.addEventListener("request", ev => {
                let request = ev.detail;
                startMarker.setLngLat(request.start);
                destMarker.setLngLat(request.dest);
            });
            if (router.currentRequest) {
                startMarker.setLngLat(router.currentRequest.start);
                destMarker.setLngLat(router.currentRequest.dest);
            }

        });
    }
}


customElements.define("mapbox-map3d-route-picker", MapboxMap3dRoutePicker);


export { MapboxMap3dRoutePicker }
