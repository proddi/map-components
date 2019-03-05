Web Components for Maps
=======================

This is a prototype to use the advantage of [Web Components](https://developer.mozilla.org/en/docs/Web/Web_Components)
to easily build maps without enforcing the usage of a specific framework.

- [examples](examples/)

- [documentation](https://proddi.github.io/map-components/build/docs/)


Concepts
--------

- normalized `Maps`, `Router`, `Search` from different providers (Google, HERE, MapBox).
- declarative compositing of scenarios.

Support:
--------

- Google: routing
- HERE: Map, Transit routing, Route picking, Route rendering
- MapBox: Map, Route picking, Route rendering


Examples:
---------

You just need a webserver to browse the examples.

You can use e.g. [dev-https](https://github.com/proddi/dev-httpd):

A fully functional map with transit route and drag'n'drop markers to change the route.

    <body>
        <here-platform id="here-platform" app-id="${HERE_APP_ID}" app-code="${HERE_APP_CODE}"></here-platform>

        <here-transit-router id="here-router"
            app-id="${HERE_APP_ID}"
            app-code="${HERE_APP_CODE}"
            start="13.40,52.53"
            dest="13.56,52.41"
            time="2018-12-22T19:17:07">
        </here-transit-router>

        <here-map center="13.5,52.5" zoom="11" style="height:500px" platform="#here-platform">
            <!-- picker is the input tool -->
            <here-map-route-picker id="picker" router="#here-router"></here-map-route-picker>
            <!-- visualize router's routes -->
            <here-map-routes router="#here-router" styles="#picker"></here-map-routes>
        </here-map>

        <div style="position:fixed;right:0;top:0;width:300px;background:rgba(255,255,255,.8)">
            <route-selector id="route-selector" router="#here-router"></route-selector>
        </div>
    </body>


Components:
-----------

- `Router` - The worker of search and routing. Other components can use them for routing as well. The lib contains routers
for `HERE` and `Google`. (`Mapbox` planned).

- `Map` - The visualization continers. Other components use them to draw routes. The lib contains maps for `HERE`,
`Google` and `Mapbox`

- Common and vendor specific `UI` elements.


Data flow:
----------

- Simple:

```
    <Router:selector>                                           <Map>
           ^                                                      ^
           |                                                      |
  (selector interface)                                        (draw on)
           |                                                      |
           +----------------- <map-routes:selectable> ------------+
```

- Advanced: (interface), [component]

```
    [Router:selector]         [map-routes:selectable] --> (draw) --> [Map]
           ^                             |
           |                    (selector interface)
  (selector interface)                   |
           |                             v
           +----------- <route-selector:selectable:selector>
                                         ^
                                         +-- (selector intf) -- <route-details>
```

- Advanced: (selector=providing routes, selectable=listener)

```
               <Router#selector>                                 # provides routes (no selection)
                      ^
                      |
      <route-selector#selectable#selector>                       # re-provides routes with selection feature
                      ^
                      |
                +-----+-----------------+
   <Map>        |                       |
     <map-routes#selectable>       <route-details#selectable>    # visualizations incl. selection
   </Map>

```

- RouteSource<SelectorMixin> + Request + Response

- RouteObserver    (<map-routes routes-source="here-transit-router"></map-routes>)


Usage
=====

Build the build:

_not yet implemented_ (What is a good packaging? Webpack?)

Build docs:

    make docs

Clean workspace:

    make clean


Ideas
=====

- [HistoryLocation](https://emberjs.com/api/ember/3.2/classes/HistoryLocation) component that works with Maps, Routers[, slectors]
