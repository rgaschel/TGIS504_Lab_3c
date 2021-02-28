window.alert("Hello, and welcome to my site. The purpose of this site is to collect data on individuals recycling access based on their living condition, feel free to select your location and fill out the form.  This will allow researchers to better target recycling access improvmeents and recycling education for more effective recycling programs.");

var map = L.map('map').setView([42.53573350982836, -73.74984925036651], 15);
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1Ijoicmdhc2NoZWwiLCJhIjoiY2tsNnloNGN4MWgwMTJvbnJmMXlkbnRqdiJ9.w55psDu7ynDSCh0APKt6Rw'
}).addTo(map);

var drawnItems = L.featureGroup().addTo(map);

var cartoData = L.layerGroup().addTo(map);
var url = "https://rgaschel.carto.com/api/v2/sql";
var urlGeoJSON = url + "?format=GeoJSON&q=";
var sqlQuery = "SELECT the_geom, home_type, recycling_access, receptacle, separate_recycling, signage_recycling FROM lab_3c_gaschel";
function addPopup(feature, layer) {
    layer.bindPopup(
        "<b>" + feature.properties.home + "</b><br>" +
        feature.properties.access + "</b><br>" +
        feature.properties.type + "</b><br>" +
        feature.properties.separate + "</b><br>" +
        feature.properties.signs
    );
}

fetch(urlGeoJSON + sqlQuery)
    .then(function(response) {
    return response.json();
    })
    .then(function(data) {
        L.geoJSON(data, {onEachFeature: addPopup}).addTo(cartoData);
    });

new L.Control.Draw({
    draw : {
        polygon : false,      //polygon disabled
        polyline : false,      //polylines disabled
        rectangle : false,     // Rectangles disabled
        circle : false,        // Circles disabled
        circlemarker : false,  // Circle markers disabled
        marker: true
    },
    edit : {
        featureGroup: drawnItems
    }
}).addTo(map);

function createFormPopup() {
    var popupContent =
    '<form>'+
          'What type of home do you live in?<br>'+
          '<input type="radio" id="HomeType" name="hometype" value="Single Family Home">'+
          '<label for="Single Family Home">Single Family Home</label><br>'+
          '<input type="radio" id="HomeType" name="hometype" value="Apartment">'+
          '<label for="Rent">Apartment Building or Complex</label><br>'+
          '<input type="radio" id="HomeType" name="hometype" value="Multi Family Home">'+
          '<label for="Multi Family Home">Multi Family Home</label><br>'+
          '<br>'+
          'Do you have access to a collected recycling receptacle, such as a bin or dumpster?<br>'+
          '<input type="radio" id="Access" name="AccessNoAccess" value="Yes">'+
          '<label for="Access">Yes</label><br>'+
          '<input type="radio" id="Access" name="AccessNoAccess" value="No">'+
          '<label for="NoAccess">No</label><br>'+
          '<br>'+
          'What type of receptacle do you have access to?<br>'+
          '<input type="radio" id="Receptacle" name="receptacletype" value="Recycling Bin">'+
          '<label for="Recycling Bin">Recycling Bin</label><br>'+
          '<input type="radio" id="Receptacle" name="receptacletype" value="Recycling Can">'+
          '<label for="Recycling Can">Recycling Can</label><br>'+
          '<input type="radio" id="Receptacle" name="receptacletype" value="Recycling Dumpster">'+
          '<label for="Recycling Dumpster">Recycling Dumpster</label><br>'+
          '<br>'+
          'Are you required to separate your recyclable materials?<br>'+
          '<input type="radio" id="Separate" name="recycleseparate" value="Yes">'+
          '<label for="Require Separate">Yes</label><br>'+
          '<input type="radio" id="Separate" name="recycleseparate" value="No">'+
          '<label for="Not Require Separate">No</label><br>'+
          '<br>'+
          'Is there signage indicating what is acceptable recyclable material on or near your receptacle?<br>'+
          '<input type="radio" id="signage" name="recyclesignage" value="Yes">'+
          '<label for="signage present">Yes</label><br>'+
          '<input type="radio" id="signage" name="recyclesignage" value="No">'+
          '<label for="signage not present">No</label><br>'+
          '<input type="button" value="Submit" id="submit">' +
    '</form>'
    drawnItems.bindPopup(popupContent).openPopup();
}

map.addEventListener("draw:created", function(e) {
    e.layer.addTo(drawnItems);
    drawnItems.eachLayer(function(layer) {
        var geojson = JSON.stringify(layer.toGeoJSON().geometry);
        console.log(geojson);
        createFormPopup();
    });
});

function setData(e) {

    if(e.target && e.target.id == "submit") {

        // Get user name and description
        var enteredhome = document.getElementById("HomeType").value;
        var enteredreceptacleaccess = document.getElementById("Access").value;
        var enteredreceptacletype = document.getElementById("Receptacle").value;
        var enteredseparate = document.getElementById("Separate").value;
        var enteredEducationalMaterial = document.getElementById("signage").value;
        // For each drawn layer
      drawnItems.eachLayer(function(layer) {

  			// Create SQL expression to insert layer
              var drawing = JSON.stringify(layer.toGeoJSON().geometry);
              var sql =
                  "INSERT INTO lab_3c_gaschel (the_geom, home_type, recycling_access, receptacle, separate_recycling, signage_recycling) " +
                  "VALUES (ST_SetSRID(ST_GeomFromGeoJSON('" +
                  drawing + "'), 4326), '" +
                  enteredhome + "', '" +
                  enteredreceptacleaccess + "', '" +
                  enteredreceptacletype + "', '" +
                  enteredseparate + "', '" +
                  enteredEducationalMaterial + "')";
              console.log(sql);

              // Send the data
              fetch(url, {
                  method: "POST",
                  headers: {
                      "Content-Type": "application/x-www-form-urlencoded"
                  },
                  body: "q=" + encodeURI(sql)
              })
              .then(function(response) {
                  return response.json();
              })
              .then(function(data) {
                  console.log("Data saved:", data);
              })
              .catch(function(error) {
                  console.log("Problem saving the data:", error);
              });

          // Transfer submitted drawing to the CARTO layer
          //so it persists on the map without you having to refresh the page
          var newData = layer.toGeoJSON();
          newData.properties.home = enteredhome;
          newData.properties.access = enteredreceptacleaccess;
          newData.properties.type = enteredreceptacletype;
          newData.properties.separate = enteredseparate;
          newData.properties.signs = enteredEducationalMaterial;
          L.geoJSON(newData, {onEachFeature: addPopup}).addTo(cartoData);

      });

        // Clear drawn items layer
        drawnItems.closePopup();
        drawnItems.clearLayers();

    }
}

document.addEventListener("click", setData);

map.addEventListener("draw:editstart", function(e) {
    drawnItems.closePopup();
});
map.addEventListener("draw:deletestart", function(e) {
    drawnItems.closePopup();
});
map.addEventListener("draw:editstop", function(e) {
    drawnItems.openPopup();
});
map.addEventListener("draw:deletestop", function(e) {
    if(drawnItems.getLayers().length > 0) {
        drawnItems.openPopup();
    }
});
