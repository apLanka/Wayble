import placesJson from "./places.json";

export type SeedPlace = {
  name: string;
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

export const SEED_PLACES: SeedPlace[] = placesJson as SeedPlace[];
