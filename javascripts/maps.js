/*
  Open-Source Europe — GeoJSON Map Renderer

  Usage in markdown:
    <div class="route-map"
         id="map-xxx"
         data-geojson="geojson/copenhagen.geojson"
         data-center="[lat, lng]"
         data-zoom="13">
    </div>

  Feature properties used:
    - name: popup label
    - category: determines marker colour (landmark, food, transit, neighbourhood)
    - note: shown in popup
    - transport: for route lines (flight vs train)
    - cost: shown in popup
    - base: marks the basecamp city
*/

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".route-map").forEach(initMap);
});

function initMap(el) {
  if (el._leafletMap) return;

  var center = JSON.parse(el.getAttribute("data-center") || "[55.683, 12.572]");
  var zoom = parseInt(el.getAttribute("data-zoom") || "13", 10);
  var geojsonUrl = el.getAttribute("data-geojson");

  var map = L.map(el.id, { scrollWheelZoom: false }).setView(center, zoom);

  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }
  ).addTo(map);

  el._leafletMap = map;

  if (geojsonUrl) {
    fetch(geojsonUrl)
      .then(function (r) {
        if (!r.ok) throw new Error("GeoJSON fetch failed: " + r.status);
        return r.json();
      })
      .then(function (data) { renderGeoJSON(map, data); })
      .catch(function (err) { console.warn(err.message, geojsonUrl); });
  }
}

var categoryColors = {
  landmark: "#2dd4bf",
  food: "#fbbf24",
  transit: "#94a3b8",
  neighbourhood: "#a78bfa"
};

function renderGeoJSON(map, data) {
  L.geoJSON(data, {
    style: function (feature) {
      var transport = (feature.properties.transport || "").toLowerCase();
      var isFlight = transport.indexOf("flight") !== -1 || transport.indexOf("ryanair") !== -1 || transport.indexOf("wizz") !== -1;
      return {
        color: isFlight ? "#94a3b8" : "#2dd4bf",
        weight: isFlight ? 1.5 : 2.5,
        opacity: isFlight ? 0.5 : 0.8,
        dashArray: isFlight ? "6, 6" : null,
      };
    },
    pointToLayer: function (feature, latlng) {
      var p = feature.properties;
      var cat = (p.category || "").toLowerCase();
      var isBase = p.base;
      var color = isBase ? "#2dd4bf" : (categoryColors[cat] || "#e2e8f0");
      return L.circleMarker(latlng, {
        radius: isBase ? 8 : 6,
        fillColor: color,
        color: color,
        weight: isBase ? 2 : 1.5,
        fillOpacity: 0.85,
      });
    },
    onEachFeature: function (feature, layer) {
      var p = feature.properties;
      if (!p.name) return;
      var html = '<b>' + p.name + '</b>';
      if (p.note) html += '<br><span style="color:#94a3b8">' + p.note + '</span>';
      if (p.transport) html += '<br>' + p.transport;
      if (p.cost) html += '<br>' + p.cost;
      layer.bindPopup(html);
    }
  }).addTo(map);
}
