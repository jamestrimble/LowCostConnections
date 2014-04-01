var mapStyle = [
  {
    "featureType": "landscape",
    "stylers": [
      { "visibility": "simplified" },
      { "lightness": 84 }
    ]
  },{
    "featureType": "poi",
    "stylers": [
      { "lightness": 77 }
    ]
  },{
    "featureType": "road",
    "stylers": [
      { "saturation": -90 },
      { "lightness": 74 }
    ]
  },{
    "elementType": "labels",
    "stylers": [
      { "lightness": 61 }
    ]
  },{
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      { "lightness": 20 }
    ]
  },{
    "featureType": "administrative",
    "elementType": "geometry.stroke",
    "stylers": [
      { "lightness": 61 }
    ]
  }
];

// Create the Google Map…
var map = new google.maps.Map(d3.select("#map").node(), {
  zoom: 5,
  center: new google.maps.LatLng(47, 10),
  mapTypeId: google.maps.MapTypeId.ROADMAP,
  styles: mapStyle
  });


zIndex = 0;

// Load the airport data. When the data comes back, create an overlay.
d3.json("airports.json", function(data) {
  var routePlanner = new RoutePlanner(data);
  var overlay = new google.maps.OverlayView();

  // Add the container when the overlay is added to the map.
  overlay.onAdd = function() {

    var layer = d3.select(this.getPanes().floatPane).append("div")
        .attr("class", "airports");

    // Draw each marker as a separate SVG element.
    // We could use a single SVG, but what size would it have?
    overlay.draw = function() {
      var projection = this.getProjection(),
          padding = 10;

      var marker = layer.selectAll(".marker")
          .data(d3.entries(data))
          .each(transform) // update existing markers
        .enter().append("svg")
          .each(transform)
          .attr("class", "marker")
          .style('z-index', ++zIndex)
          .attr('data-code',function(d) {return d.key});

      // Add a circle.
      marker.append("circle")
          .attr("r", 4.5)
          .attr("cx", padding)
          .attr("cy", padding)
          .attr('data-code',function(d) {return d.key})
          .on("mouseover", function() {
              d3.select(this.parentNode).classed("show-text", true);
              d3.select(this.parentNode).style('z-index', ++zIndex);
           })
          .on("mouseout", function() {
              d3.select(this.parentNode).classed("show-text", false);
           })
           .on("click", function(d) {
               routePlanner.click(d, this);
           });

      // Add a label.
      marker.append("text")
          .attr("x", padding + 7)
          .attr("y", padding)
          .attr("dy", ".31em")
          .text(function(d) { return d.value.name; })
          .attr('data-code',function(d) {return d.key});

      function transform(d) {
        d = new google.maps.LatLng(d.value.long_lat[1], d.value.long_lat[0]);
        d = projection.fromLatLngToDivPixel(d);
        return d3.select(this)
            .style("left", (d.x - padding) + "px")
            .style("top", (d.y - padding) + "px");
      }
    };
  };

  // Bind our overlay to the map…
  overlay.setMap(map);
});

function RoutePlanner(data) {
    this.waitingFor = "ORIGIN_CLICK";
    this.data = data;
}
RoutePlanner.prototype.click = function(d, circle) {

    if (this.waitingFor == "ORIGIN_CLICK") {
        this.originClick(d, circle);
    } else if (this.waitingFor == "DESTINATION_CLICK") {
        this.destinationClick(d, circle);
    } else if (this.waitingFor == "CONNECTION_CLICK") {
        this.connectionClick(d, circle);
    }
}
RoutePlanner.prototype.originClick = function(d, circle) {
    this.origin = d.key;
    d3.select(circle).classed("origin", true);
    d3.selectAll('text[data-code="' + d.key + '"]').classed("show-text", true);
    d3.select('#origin-span').text(d.value.name);
    this.waitingFor = "DESTINATION_CLICK";
    d3.select("#destination-div").style('visibility', 'visible');
    d3.select("#origin-p").style('visibility', 'visible');
}
RoutePlanner.prototype.destinationClick = function(d, circle) {
    d3.selectAll("circle").classed('muted', true);
    d3.select("#destination-p").style('visibility', 'visible');
    this.destination = d.key;
    d3.select(circle).classed("destination", true);
    d3.selectAll('text[data-code="' + d.key + '"]').classed("show-text", true);
    d3.select('#destination-span').text(d.value.name);
    this.waitingFor = "CONNECTION_CLICK";
    var routePlanner = this;
    routePlanner.routeDetails = {};
    nFlightsFound = 0;
    routePlanner.data[this.origin].routes.forEach(function(r) {
        if (r.code==routePlanner.destination) {
            nFlightsFound++;
            d3.select('#direct-flights').style('visibility', 'visible');
            d3.select("#direct-flight-opts").selectAll("p").remove();
            var newP = d3.select("#direct-flight-opts").append("p");

            newP.append("a")
                .attr("href", routePlanner.getUrl(r.airline, routePlanner.origin, routePlanner.destination))
                .attr("target", "blank")
                .text(r.airline)    

            // add direct flight line
            var o = routePlanner.data[routePlanner.origin].long_lat;
            var d = routePlanner.data[routePlanner.destination].long_lat;
            var directFlightCoordinates = [
                new google.maps.LatLng(o[1], o[0]),
                new google.maps.LatLng(d[1], d[0])
            ];
            var flightPath = new google.maps.Polyline({
                path: directFlightCoordinates,
                geodesic: true,
                strokeColor: 'steelblue',
                strokeOpacity: 0.7,
                strokeWeight: 4
            });
            flightPath.setMap(map);
        }

        routePlanner.data[r.code].routes.forEach(function(r2) {
            if (r2.code==routePlanner.destination) {
                nFlightsFound++;
                if (!routePlanner.routeDetails.hasOwnProperty(r.code)) {
                    routePlanner.routeDetails[r.code] = {firstLegOptions:[], secondLegOptions:[]};
                }
                routePlanner.routeDetails[r.code].firstLegOptions.push(r);
                if (routePlanner.routeDetails[r.code].secondLegOptions.indexOf(r2) == -1) {
                    routePlanner.routeDetails[r.code].secondLegOptions.push(r2);
                }
                
                d3.select('svg[data-code="' + r.code + '"]').style('z-index', ++zIndex);
                d3.select('text[data-code="' + r.code + '"]').classed('show-text', true);
                d3.select('circle[data-code="' + r.code + '"]').classed('connection', true);
                
                // add flight lines
                var o = routePlanner.data[routePlanner.origin].long_lat;
                var c = routePlanner.data[r.code].long_lat;
                var d = routePlanner.data[routePlanner.destination].long_lat;
                var directFlightCoordinates = [
                    new google.maps.LatLng(o[1], o[0]),
                    new google.maps.LatLng(c[1], c[0]),
                    new google.maps.LatLng(d[1], d[0])
                ];
                var flightPath = new google.maps.Polyline({
                    path: directFlightCoordinates,
                    geodesic: true,
                    strokeColor: 'steelblue',
                    strokeOpacity: 0.6,
                    strokeWeight: 1
                });
                flightPath.setMap(map);
            }
        });
    });
    if (nFlightsFound > 0) {
        d3.select("#connection-div").style('visibility', 'visible');    
    } else {
        d3.select("#no-flights-found").style('display', 'block');
    }
}
RoutePlanner.prototype.connectionClick = function(d, circle) {
    if (!this.routeDetails.hasOwnProperty(d.key)) {
        return;
    }
    this.connection = d.key;
    d3.select("#connection-p").style('visibility', 'visible');
    d3.select('#connection-span').text(d.value.name);

    d3.selectAll('.leg-origin-span').text(this.data[this.origin].name);
    d3.selectAll('.leg-connection-span').text(d.value.name);
    d3.selectAll('.leg-destination-span').text(this.data[this.destination].name);
    d3.selectAll('.connection-results').style('visibility', 'visible');

    for (var i=0; i<this.routeDetails[d.key].firstLegOptions.length; i++) {
        d3.select("#flight-1-opts").selectAll("p").remove();
        var newP = d3.select("#flight-1-opts").append("p");
        airline = this.routeDetails[d.key].firstLegOptions[i].airline;
        newP.append("a")
            .attr("href", this.getUrl(airline, this.origin, this.connection))
            .attr("target", "blank")
            .text(airline)
    }
    for (var i=0; i<this.routeDetails[d.key].secondLegOptions.length; i++) {
        d3.select("#flight-2-opts").selectAll("p").remove();
        var newP = d3.select("#flight-2-opts").append("p");
        newP.append("a")
            .attr("href", this.getUrl(airline, this.connection, this.destination))
            .attr("target", "blank")
            .text(this.routeDetails[d.key].secondLegOptions[i].airline)
    }
}

RoutePlanner.prototype.getUrl = function(airline, orig, dest) {
    if (airline == "easyJet") {
        return "http://www.easyjet.com";
    } else if (airline == "Ryanair") {
        return "http://www.ryanair.com";
    } else if (airline == "Jet2") {
        return "http://www.jet2.com";
    }
}
