// Import the predefined public-place data from the JSON file.
import placesJson from "./places.json";

/**
 * Defines the required structure of each place in the seed dataset.
 */
export type SeedPlace = {
  name: string;
  // Category used to classify and filter the place.
  category:
  | "education"
  | "food_and_drink"
  | "government"
  | "healthcare"
  | "lodging"
  | "outdoor"
  | "retail"
  | "transport"
  | "workplace"
  | "other";
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
};



// Convert the imported JSON data into a typed array of seed places.
export const SEED_PLACES: SeedPlace[] = placesJson as SeedPlace[];
