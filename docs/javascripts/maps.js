/*
  Open-Source Europe — GeoJSON Map Renderer (v2)

  Usage in markdown:
    <div class="route-map"
         id="map-xxx"
         data-geojson="geojson/copenhagen.geojson"
         data-center="[lat, lng]"
         data-zoom="13">
    </div>

  Feature properties used:
    - name: popup label
    - category: determines marker colour
    - note: shown in popup
    - transport: for route lines (flight vs train)
    - route: "walk" for dashed walking routes
    - cost: shown in popup
    - base: marks the basecamp city
    - order: number for ordered visit markers
    - phase: phase label for the stop
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

/* ─── Category Colours ─────────────────────────────────── */
var categoryColors = {
  landmark:      "#2dd4bf",
  food:          "#fbbf24",
  transit:       "#94a3b8",
  neighbourhood: "#a78bfa",
  castle:        "#c084fc",
  library:       "#60a5fa",
  park:          "#4ade80",
  fika:          "#fb923c",
  deviation:     "#f87171",
  photo:         "#f472b6"
};

/* ─── Numbered Marker (SVG-based DivIcon) ──────────────── */
function numberedIcon(num, color) {
  var svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28">' +
      '<circle cx="14" cy="14" r="12" fill="' + color + '" stroke="#0f1419" stroke-width="2"/>' +
      '<text x="14" y="18" text-anchor="middle" font-size="11" font-weight="700" fill="#0f1419" font-family="system-ui,sans-serif">' + num + '</text>' +
    '</svg>';
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16]
  });
}

/* ─── Render GeoJSON ───────────────────────────────────── */
function renderGeoJSON(map, data) {
  var hasCategories = {};

  L.geoJSON(data, {
    style: function (feature) {
      var p = feature.properties;
      var transport = (p.transport || "").toLowerCase();
      var route = (p.route || "").toLowerCase();

      /* Walking route */
      if (route === "walk") {
        return {
          color: "#2dd4bf",
          weight: 2.5,
          opacity: 0.6,
          dashArray: "8, 8",
          lineCap: "round"
        };
      }
      /* Transfer / train route */
      if (route === "train") {
        return {
          color: "#94a3b8",
          weight: 3,
          opacity: 0.7,
          dashArray: "12, 6",
          lineCap: "round"
        };
      }
      /* Legacy: flight lines */
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
      var order = p.order;

      /* Track categories for legend */
      if (cat) hasCategories[cat] = true;

      /* Numbered marker if order is present */
      if (order !== undefined && order !== null) {
        return L.marker(latlng, { icon: numberedIcon(order, color) });
      }

      /* Default circle marker */
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
      if (p.phase) html += '<br><span style="color:#2dd4bf;font-size:0.85em">' + p.phase + '</span>';
      if (p.note) html += '<br><span style="color:#94a3b8">' + p.note + '</span>';
      if (p.transport) html += '<br>' + p.transport;
      if (p.cost) html += '<br>' + p.cost;
      layer.bindPopup(html);

      /* Tooltip for ordered stops */
      if (p.order !== undefined && p.order !== null) {
        layer.bindTooltip(p.name, {
          permanent: false,
          direction: 'top',
          offset: [0, -16],
          className: 'map-tooltip'
        });
      }
    }
  }).addTo(map);

  /* ─── Legend ─────────────────────────────────────────── */
  addLegend(map, hasCategories, data);
}

/* ─── Legend Control ───────────────────────────────────── */
function addLegend(map, cats, data) {
  /* Check if there are any line features */
  var hasWalk = false, hasTrain = false;
  if (data && data.features) {
    data.features.forEach(function(f) {
      var r = (f.properties.route || "").toLowerCase();
      if (r === "walk") hasWalk = true;
      if (r === "train") hasTrain = true;
    });
  }

  /* Only show legend if there's something interesting */
  var catKeys = Object.keys(cats);
  if (catKeys.length < 2 && !hasWalk && !hasTrain) return;

  var legend = L.control({ position: "bottomright" });

  legend.onAdd = function () {
    var div = L.DomUtil.create("div", "map-legend");
    var html = "<h4>Legend</h4>";

    /* Category dots */
    var labels = {
      landmark: "Landmark", food: "Food", transit: "Transit",
      neighbourhood: "Area", castle: "Castle", library: "Library",
      park: "Park", fika: "Fika", deviation: "Deviation", photo: "Photo Spot"
    };
    catKeys.forEach(function (cat) {
      var color = categoryColors[cat] || "#e2e8f0";
      var label = labels[cat] || cat;
      html += '<div><i style="background:' + color + '"></i> ' + label + '</div>';
    });

    /* Lines */
    if (hasWalk) {
      html += '<div><span class="line-sample" style="border-color:#2dd4bf"></span> Walking Route</div>';
    }
    if (hasTrain) {
      html += '<div><span class="line-sample" style="border-color:#94a3b8"></span> Train Transfer</div>';
    }

    div.innerHTML = html;
    return div;
  };

  legend.addTo(map);
}
