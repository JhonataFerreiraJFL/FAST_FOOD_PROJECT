var map = L.map('map').setView([-23.5505, -46.6333], 13); // São Paulo

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
}).addTo(map);

var baseMarker, circle, userMarker, userLocation;

function searchRestaurants() {
    var location = userLocation || document.getElementById('location').value; // Usa userLocation se disponível, caso contrário, usa o valor do campo de texto
    var radius = document.getElementById('radius').value;
    var resultsBody = document.getElementById('resultsBody');
    resultsBody.innerHTML = '';

    if (typeof location === 'string') {
        // Use a geocoding API to get latitude and longitude
        var geocodeURL = `https://nominatim.openstreetmap.org/search?q=${location}&format=json&limit=1`;

        axios.get(geocodeURL)
            .then(function (response) {
                if (response.data.length > 0) {
                    var lat = response.data[0].lat;
                    var lon = response.data[0].lon;
                    performSearch(lat, lon, radius, resultsBody);
                } else {
                    alert('Localização não encontrada!');
                }
            })
            .catch(function (error) {
                console.log(error);
            });
    } else {
        performSearch(location.lat, location.lng, radius, resultsBody);
    }
}

function performSearch(lat, lon, radius, resultsBody) {
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
                    id: element.id, // Store the id for reference
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
                    var link = document.createElement('a');
                    link.href = "#";
                    link.innerText = restaurant.name;
                    link.onclick = function() {
                        openFoodPrompt(restaurant);
                        return false;
                    };
                    cell.appendChild(link);
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
}

function sortTable() {
    var table = document.getElementById('resultsTable');
    var rows, switching, i, x, y, shouldSwitch;
    switching = true;
    while (switching) {
        switching = false;
        rows = table.rows;
        for (i = 1; i < (rows.length - 1); i++) {
            shouldSwitch = false;
            x = rows[i].getElementsByTagName("TD")[0];
            y = rows[i + 1].getElementsByTagName("TD")[0];
            if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
                shouldSwitch = true;
                break;
            }
        }
        if (shouldSwitch) {
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
        }
    }
}

function locateUser() {
    map.locate({setView: true, maxZoom: 16});
}

map.on('locationfound', function(e) {
    var radius = e.accuracy / 2;

    if (userMarker) {
        map.removeLayer(userMarker);
    }

    userMarker = L.marker(e.latlng).addTo(map).bindPopup('Sua localização').openPopup();
    L.circle(e.latlng, radius).addTo(map);

    var locationInput = document.getElementById('location');
    locationInput.value = `${e.latlng.lat},${e.latlng.lng}`;
    userLocation = e.latlng; // Store user location
});

map.on('locationerror', function() {
    alert("Localização não encontrada");
});

function openFoodPrompt(restaurant) {
    var foodName = prompt("Digite o nome da comida:");
    var foodPrice = prompt("Digite o preço da comida:");

    if (foodName && foodPrice) {
        saveFoodData(restaurant.name, foodName, foodPrice);
    }
}

function saveFoodData(restaurantName, foodName, foodPrice) {
    var foodData = {
        restaurant: restaurantName,
        food: foodName,
        price: foodPrice
    };

    var existingData = localStorage.getItem('foodData');
    var foodArray = existingData ? JSON.parse(existingData) : [];
    foodArray.push(foodData);
    localStorage.setItem('foodData', JSON.stringify(foodArray));

    alert(`Dados salvos:\nRestaurante: ${restaurantName}\nComida: ${foodName}\nPreço: ${foodPrice}`);
}

// Função para exibir os dados salvos (opcional)
function displaySavedData() {
    var existingData = localStorage.getItem('foodData');
    if (existingData) {
        var foodArray = JSON.parse(existingData);
        foodArray.forEach(function(data) {
            console.log(`Restaurante: ${data.restaurant}, Comida: ${data.food}, Preço: ${data.price}`);
        });
    } else {
        console.log("Nenhum dado salvo.");
    }
}

// Exemplo de uso para exibir os dados salvos
displaySavedData();
