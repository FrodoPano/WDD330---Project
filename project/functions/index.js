const functions = require("firebase-functions");
const axios = require("axios");
const cors = require("cors")({ origin: true });

// Initialize environment variables
require("dotenv").config();

exports.calculateEmissions = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  cors(req, res, async () => {
    try {
      // Validate request method
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
      }

      // Verify authentication
      if (!req.headers.authorization) {
        return res.status(401).json({ error: "Unauthorized - Missing token" });
      }

      // Validate request body
      if (!req.body || !req.body.distance || !req.body.activityType) {
        return res.status(400).json({ 
          error: "Bad Request",
          message: "Missing required fields: distance, activityType"
        });
      }

      const { activityType, distance, diet } = req.body;

      // Get emission factor ID based on activity type
      const emissionFactorId = getEmissionFactorId(activityType, diet);

      // Call Climatiq API
      const climatiqResponse = await axios.post(
        "https://beta3.api.climatiq.io/estimate",
        {
          emission_factor: {
            activity_id: emissionFactorId
          },
          parameters: {
            distance: parseFloat(distance),
            distance_unit: "km"
          }
        },
        {
          headers: {
            "Authorization": `Bearer ${process.env.CLIMATIQ_API_KEY || functions.config().climatiq.key}`,
            "Content-Type": "application/json"
          },
          timeout: 10000 // 10 second timeout
        }
      );

      // Prepare response
      const result = {
        co2e: climatiqResponse.data.co2e,
        unit: climatiqResponse.data.co2e_unit,
        details: {
          activityType,
          distance,
          emissionFactorUsed: emissionFactorId
        },
        timestamp: new Date().toISOString()
      };

      return res.status(200).json(result);

    } catch (error) {
      console.error("API Error:", error);

      // Handle different error types
      if (error.response) {
        // Climatiq API error
        return res.status(502).json({
          error: "Bad Gateway",
          message: error.response.data.message || "Climatiq API error",
          details: error.response.data
        });
      } else if (error.request) {
        // No response received
        return res.status(504).json({
          error: "Gateway Timeout",
          message: "No response from Climatiq API"
        });
      } else {
        // Other errors
        return res.status(500).json({
          error: "Internal Server Error",
          message: error.message
        });
      }
    }
  });
});

// Helper function to get emission factor IDs
function getEmissionFactorId(activityType, diet) {
  const emissionFactors = {
    car: {
      default: "passenger_vehicle-vehicle_type_car-fuel_source_na-engine_size_na-vehicle_age_na-vehicle_weight_na",
      electric: "passenger_vehicle-vehicle_type_car-fuel_source_electricity",
      hybrid: "passenger_vehicle-vehicle_type_car-fuel_source_hybrid"
    },
    flight: {
      short: "passenger_flight-route_type_domestic-aircraft_type_jet-distance_short",
      medium: "passenger_flight-route_type_domestic-aircraft_type_jet-distance_medium",
      long: "passenger_flight-route_type_domestic-aircraft_type_jet-distance_long"
    },
    diet: {
      vegan: "food-vegan",
      vegetarian: "food-vegetarian",
      meat: "food-meat_heavy"
    }
  };

  // Return appropriate factor based on activity and diet
  if (activityType === "diet") {
    return emissionFactors.diet[diet] || emissionFactors.diet.meat;
  }
  
  return emissionFactors[activityType]?.default || emissionFactors.car.default;
}