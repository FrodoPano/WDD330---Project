// Google Maps Initialization
let map;
let directionsService;
let directionsRenderer;

function initMap() {
    // Initialize map with default center (NYC)
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 40.7128, lng: -74.0060 },
        zoom: 12,
        styles: [
            {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }] // Hide business labels
            }
        ]
    });

    // Initialize services for route calculation
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
            strokeColor: "#2E8B57",
            strokeWeight: 5
        }
    });
    directionsRenderer.setMap(map);

    // Try to get user's current location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                map.setCenter(userLocation);
                
                // Add a custom marker at user's location
                new google.maps.Marker({
                    position: userLocation,
                    map: map,
                    icon: {
                        url: "assets/icons/user-marker.png",
                        scaledSize: new google.maps.Size(32, 32)
                    },
                    title: "Your location"
                });
            },
            (error) => {
                console.warn("Geolocation error:", error);
                // Fallback: Add default marker at NYC
                new google.maps.Marker({
                    position: { lat: 40.7128, lng: -74.0060 },
                    map: map,
                    title: "Default location"
                });
            }
        );
    }
}

// Main carbon footprint calculation function
async function calculateFootprint() {
    // Get form values
    const distance = parseFloat(document.getElementById("transport").value) || 0;
    const diet = document.getElementById("diet").value;
    const activityType = "car"; // Default to car (can expand later)

    // Validate input
    if (distance <= 0) {
        showNotification("Please enter a valid distance", "error");
        return;
    }

    // UI Loading state
    const submitButton = document.querySelector("#carbon-form button[type='submit']");
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = "Calculating...";
    submitButton.classList.add("loading");

    try {
        // Call Firebase Function (replace with your project ID)
        const response = await fetch(
            "https://us-central1-carbon-tracker-12345.cloudfunctions.net/calculateEmissions",
            {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + await getFirebaseToken() // If using auth
                },
                body: JSON.stringify({
                    activityType,
                    distance: distance * 1.60934, // Convert miles to km
                    diet,
                    timestamp: new Date().toISOString()
                }),
            }
        );

        // Handle response
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "API request failed");
        }

        const result = await response.json();
        
        // Update UI with results
        updateDashboard(result.co2e);
        
        // Show route suggestions if available
        if (result.alternateRoutes) {
            showEcoRoutes(result.alternateRoutes);
        }

        showNotification("Footprint calculated successfully!", "success");

    } catch (error) {
        console.error("Calculation error:", error);
        showNotification(error.message || "Calculation failed. Please try again.", "error");
    } finally {
        // Reset UI
        submitButton.disabled = false;
        submitButton.textContent = originalText;
        submitButton.classList.remove("loading");
    }
}

// Update dashboard with new results
function updateDashboard(co2e) {
    // Format CO2 value (1 decimal place)
    const formattedCO2 = co2e.toFixed(1);
    document.querySelector(".co2-amount").innerHTML = `${formattedCO2} <span>kg CO₂</span>`;
    
    // Update progress bar (max 50kg as reference)
    const progressPercent = Math.min(100, (co2e / 50) * 100);
    document.querySelector(".progress").style.width = `${progressPercent}%`;
    
    // Update comparison text
    const averageFootprint = 30; // kg CO2
    const difference = ((averageFootprint - co2e) / averageFootprint) * 100;
    const comparisonText = difference > 0 
        ? `${Math.abs(difference).toFixed(1)}% lower than average! 🎉` 
        : `${Math.abs(difference).toFixed(1)}% higher than average. 💡 Try our eco-tips!`;
    
    document.querySelector(".summary p").textContent = comparisonText;
}

// Show eco-friendly route alternatives
function showEcoRoutes(routes) {
    routes.forEach(route => {
        directionsService.route({
            origin: route.startLocation,
            destination: route.endLocation,
            travelMode: google.maps.TravelMode[route.mode] // e.g. BICYCLING, TRANSIT
        }, (response, status) => {
            if (status === "OK") {
                directionsRenderer.setDirections(response);
                
                // Add custom info window
                const infoWindow = new google.maps.InfoWindow({
                    content: `Saves ${route.savings}kg CO₂ vs driving`
                });
                infoWindow.open(map, directionsRenderer.getDirections().routes[0].legs[0].start_location);
            }
        });
    });
}

// Notification system
function showNotification(message, type) {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span class="icon">${type === "success" ? "✓" : "⚠️"}</span>
        <span class="message">${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after delay
    setTimeout(() => {
        notification.classList.add("fade-out");
        notification.addEventListener("transitionend", () => notification.remove());
    }, 5000);
}

// Initialize the application
window.onload = function() {
    // Initialize map
    initMap();
    
    // Setup form submission
    document.getElementById("carbon-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        await calculateFootprint();
    });
    
    // Add notification styles dynamically
    const style = document.createElement("style");
    style.textContent = `
        .notification {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 24px;
            border-radius: 8px;
            color: white;
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateY(20px);
            opacity: 0;
            animation: notificationFadeIn 0.3s forwards;
        }
        
        .notification.success {
            background-color: #2E8B57;
        }
        
        .notification.error {
            background-color: #e74c3c;
        }
        
        .notification .icon {
            font-size: 1.2em;
        }
        
        .notification.fade-out {
            animation: notificationFadeOut 0.3s forwards;
        }
        
        @keyframes notificationFadeIn {
            to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes notificationFadeOut {
            to { transform: translateY(20px); opacity: 0; }
        }
        
        button.loading {
            position: relative;
            pointer-events: none;
        }
        
        button.loading::after {
            content: "";
            position: absolute;
            top: 50%;
            left: 50%;
            width: 20px;
            height: 20px;
            margin: -10px 0 0 -10px;
            border: 2px solid rgba(255,255,255,0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: buttonSpin 0.6s linear infinite;
        }
        
        @keyframes buttonSpin {
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
};