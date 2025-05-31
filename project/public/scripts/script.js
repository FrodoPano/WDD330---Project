// Google Maps Initialization
let map;
let directionsService;
let directionsRenderer;

function initMap() {
    // Initialize map
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 40.7128, lng: -74.0060 }, // Default to NYC
        zoom: 12,
    });

    // Initialize services
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    // Try to get user's location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                map.setCenter(userLocation);
            },
            (error) => {
                console.error("Geolocation error:", error);
            }
        );
    }
}

// Calculate carbon footprint
async function calculateFootprint() {
    const distance = parseFloat(document.getElementById("transport").value) || 0;
    const diet = document.getElementById("diet").value;
    const activityType = "car"; // Can be expanded for other types

    // Show loading state
    const submitButton = document.querySelector("#carbon-form button[type='submit']");
    submitButton.disabled = true;
    submitButton.textContent = "Calculating...";

    try {
        const response = await fetch(
            "https://us-central1-your-project-id.cloudfunctions.net/calculateEmissions",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    activityType,
                    distance: distance * 1.60934, // Convert to km
                    diet
                }),
            }
        );

        if (!response.ok) throw new Error("API response error");

        const result = await response.json();
        
        // Update UI with results
        document.querySelector(".co2-amount").textContent = `${result.co2e.toFixed(1)}`;
        document.querySelector(".progress").style.width = `${calculateProgress(result.co2e)}%`;
        document.querySelector(".summary p").textContent = getComparisonText(result.co2e);
        
        // Show success message
        showNotification("Calculation complete!", "success");

    } catch (error) {
        console.error("Calculation error:", error);
        showNotification("Failed to calculate. Please try again.", "error");
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Calculate";
    }
}

// Helper functions
function calculateProgress(co2e) {
    const max = 50; // Adjust based on your scale
    return Math.min(100, (co2e / max) * 100);
}

function getComparisonText(co2e) {
    const avg = 30; // Average footprint to compare against
    const difference = ((avg - co2e) / avg) * 100;
    
    if (difference > 0) {
        return `${Math.abs(difference).toFixed(1)}% lower than average! 🎉`;
    } else {
        return `${Math.abs(difference).toFixed(1)}% higher than average. 💡 Try our eco-tips!`;
    }
}

function showNotification(message, type) {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Initialize app
window.onload = function() {
    initMap();
    
    // Form submission
    document.getElementById("carbon-form").addEventListener("submit", (e) => {
        e.preventDefault();
        calculateFootprint();
    });
    
    // Add CSS for notifications
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
            animation: fadeIn 0.3s;
        }
        .success { background-color: var(--primary); }
        .error { background-color: #e74c3c; }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
};