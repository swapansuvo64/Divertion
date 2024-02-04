var map; // declare map as a global variable

// Define showOnMap function
function showOnMap(latitude, longitude) {
    map = L.map('map').setView([latitude, longitude], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
}

// Function to display hospitals on the map
function displayHospitalsOnMap(hospitals) {
    map.eachLayer(layer => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });

    hospitals.forEach(hospital => {
        var hospitalName = hospital.tags.name || 'Unnamed Hospital';

        L.marker([hospital.lat, hospital.lon]).addTo(map)
            .bindPopup(hospitalName)
            .openPopup();
    });
}

// Function to show the list of hospitals
function showHospitalList(hospitals) {
    var hospitalList = document.getElementById("hospitalList");

    // Clear the existing list
    hospitalList.innerHTML = "";

    // Create a new list item for each hospital and append it to the list
    hospitals.forEach(hospital => {
        var hospitalName = hospital.tags.name || 'Unnamed Hospital';
        var listItem = document.createElement("li");
        listItem.textContent = hospitalName;
        hospitalList.appendChild(listItem);
    });
}

// Function to fetch nearby hospitals using Overpass API
function fetchNearbyHospitals(latitude, longitude) {
    var radius = 5000; // Set the radius in meters
    var overpassApiUrl = `https://overpass-api.de/api/interpreter?data=[out:json];node(around:${radius},${latitude},${longitude})[amenity=hospital];out;`;

    fetch(overpassApiUrl)
        .then(response => response.json())
        .then(data => {
            // Process the hospital data
            var hospitals = data.elements;

            // Display names on the map
            displayHospitalsOnMap(hospitals);

            // Show the list of hospitals
            showHospitalList(hospitals);
        })
        .catch(error => {
            console.error('Error fetching hospital data:', error);
        });
}

// Function to get detailed location information
function getDetailedLocation(position) {
    var latitude = position.coords.latitude;
    var longitude = position.coords.longitude;

    // Displaying the detailed location information
    

    // Displaying the location on the map using Leaflet
    showOnMap(latitude, longitude);

    // Fetching nearby hospitals
    fetchNearbyHospitals(latitude, longitude);
}

// Function to handle geolocation errors
function showError(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            document.getElementById("location").innerHTML = "User denied the request for geolocation.";
            break;
        case error.POSITION_UNAVAILABLE:
            document.getElementById("location").innerHTML = "Location information is unavailable.";
            break;
        case error.TIMEOUT:
            document.getElementById("location").innerHTML = "The request to get user location timed out.";
            break;
        case error.UNKNOWN_ERROR:
            document.getElementById("location").innerHTML = "An unknown error occurred.";
            break;
    }
}

// Function to initiate the process and get the user's location
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(getDetailedLocation, showError);
    } else {
        document.getElementById("location").innerHTML = "Geolocation is not supported by this browser.";
    }
}
