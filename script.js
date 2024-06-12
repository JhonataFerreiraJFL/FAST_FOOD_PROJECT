var map = L.map('map').setView([-23.5505, -46.6333], 13); // São Paulo

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);

var baseMarker, circle;

function searchRestaurants() {
    var location = document.getElementById('location').value;
    var radius = document.getElementById('radius').value;
    var resultsBody = document.getElementById('resultsBody');
    resultsBody.innerHTML = '';

    // Use a geocoding API to get latitude and longitude
    var geocodeURL = `https://nominatim.openstreetmap.org/search?q=${location}&format=json&limit=1`;

    axios.get(geocodeURL)
        .then(function (response) {
            if (response.data.length > 0) {
                var lat = response.data[0].lat;
                var lon = response.data[0].lon;
                map.setView([lat, lon], 15);

                // Clear existing markers and circle
                if (baseMarker) {
                    map.removeLayer(baseMarker);
                }
                if (circle) {
                    map.removeLayer(circle);
                }

                // Add base marker and circle for search radius
                baseMarker = L.marker([lat, lon]).addTo(map).bindPopup('Local Base').openPopup();
                circle = L.circle([lat, lon], {
                    color: 'blue',
                    fillColor: 'blue',
                    fillOpacity: 0.2,
                    radius: radius * 1000
                }).addTo(map);

                // Fetch restaurants and cafes from Overpass API
                var overpassURL = `https://overpass-api.de/api/interpreter?data=[out:json];(node["amenity"="restaurant"](around:${radius * 1000},${lat},${lon});node["amenity"="cafe"](around:${radius * 1000},${lat},${lon}););out;`;

                axios.get(overpassURL)
                    .then(function (response) {
                        var elements = response.data.elements;
                        var foundRestaurants = [];

                        elements.forEach(function (element) {
                            var restaurant = {
                                name: element.tags.name || 'Restaurante/Café sem nome',
                                lat: element.lat,
                                lon: element.lon
                            };
                            foundRestaurants.push(restaurant);
                            L.marker([restaurant.lat, restaurant.lon])
                                .addTo(map)
                                .bindPopup(restaurant.name);
                        });

                        // Display found restaurants
                        if (foundRestaurants.length > 0) {
                            foundRestaurants.forEach(function (restaurant) {
                                var row = document.createElement('tr');
                                var cell = document.createElement('td');
                                cell.innerText = restaurant.name;
                                row.appendChild(cell);
                                resultsBody.appendChild(row);
                            });
                        } else {
                            var row = document.createElement('tr');
                            var cell = document.createElement('td');
                            cell.colSpan = 1;
                            cell.innerText = 'Nenhum restaurante encontrado nesta área.';
                            row.appendChild(cell);
                            resultsBody.appendChild(row);
                        }
                    })
                    .catch(function (error) {
                        console.log(error);
                    });

            } else {
                alert('Localização não encontrada!');
            }
        })
        .catch(function (error) {
            console.log(error);
        });
}

function sortTable() {
    var table = document.getElementById('resultsTable');
    var rows, switching, i, x, y, shouldSwitch;
    switching = true;
    /* Make a loop that will continue until
    no switching has been done: */
    while (switching) {
        switching = false;
        rows = table.rows;
        /* Loop through all table rows (except the
        first, which contains table headers): */
        for (i = 1; i < (rows.length - 1); i++) {
            shouldSwitch = false;
            /* Get the two elements you want to compare,
            one from current row and one from the next: */
            x = rows[i].getElementsByTagName("TD")[0];
            y = rows[i + 1].getElementsByTagName("TD")[0];
            // Check if the two rows should switch place:
            if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
                // If so, mark as a switch and break the loop:
                shouldSwitch = true;
                break;
            }
        }
        if (shouldSwitch) {
            /* If a switch has been marked, make the switch
            and mark that a switch has been done: */
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
        }
    }
}

var map = L.map('map').setView([-23.5505, -46.6333], 13); // São Paulo

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);

var baseMarker, circle, userMarker; // Adiciona uma variável para o marcador do usuário

// Adiciona um marcador para a nova base
var newBaseCoordinates = [-23.55, -46.64]; // Coordenadas da nova base
var newBaseMarker = L.marker(newBaseCoordinates).addTo(map).bindPopup('Nova Base'); // Adiciona um marcador para a nova base

function locateUser() {
    map.locate({setView: true, maxZoom: 16}); // Ativa a localização do usuário no mapa
}

map.on('locationfound', function(e){
    var radius = e.accuracy / 2;

    if (userMarker) {
        map.removeLayer(userMarker); // Remove o marcador do usuário se ele já existir
    }
    
    userMarker = L.marker(e.latlng).addTo(map).bindPopup('Sua localização').openPopup(); // Adiciona um marcador na localização do usuário
    L.circle(e.latlng, radius).addTo(map); // Adiciona um círculo para representar a precisão da localização do usuário
});

map.on('locationerror', function(e){
    alert("Localização não encontrada");
});
