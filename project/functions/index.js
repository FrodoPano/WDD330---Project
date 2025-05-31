const functions = require("firebase-functions");
const axios = require("axios");

// Initialize environment variables (from .env)
require("dotenv").config();

exports.calculateEmissions = functions.https.onRequest(async (req, res) => {
  // Validate request
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const { activityType, distance } = req.body;

    // Climatiq API call (key pulled from .env)
    const response = await axios.post(
      "https://beta3.api.climatiq.io/estimate",
      {
        emission_factor: {
          activity_id: getActivityId(activityType), // Maps to Climatiq's IDs
        },
        parameters: {
          distance: distance * 1.60934, // Convert miles to km
          distance_unit: "km",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.CLIMATIQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({ co2e: response.data.co2e });
  } catch (error) {
    console.error("Climatiq API error:", error);
    res.status(500).json({ error: "Failed to calculate emissions" });
  }
});

// Helper: Map your activity types to Climatiq's IDs
function getActivityId(activityType) {
  const activities = {
    car: "passenger_vehicle-vehicle_type_car-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na",
    flight: "passenger_flight-route_type_domestic-aircraft_type_jet-distance_long",
    // Add more mappings as needed
  };
  return activities[activityType] || activities.car;
}