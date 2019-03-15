/**
 * The available locations to lookup.
 * @type {Object}
 */
const locations = {
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


export { locations, }
