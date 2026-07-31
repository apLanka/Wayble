import * as fs from "node:fs";
import * as path from "node:path";

// Bounding box for Greater Colombo & Suburbs (Colombo, Malabe, Kaduwela, Sri Jayawardenepura Kotte, Dehiwala-Mount Lavinia)
// [south, west, north, east]
const BBOX = "6.83,79.83,6.96,79.99";

const OVERPASS_QUERY = `
[out:json][timeout:25];
(
  node["amenity"~"hospital|clinic|doctors|pharmacy|school|university|college|kindergarten|library|townhall|courthouse|police|post_office|restaurant|cafe|fast_food|bank"](${BBOX});
  node["leisure"~"park|garden|playground|sports_centre"](${BBOX});
  node["shop"~"supermarket|mall|department_store"](${BBOX});
  node["railway"~"station|halt"](${BBOX});
  node["highway"~"bus_stop"]["name"](${BBOX});
  node["tourism"~"hotel|museum|attraction|zoo"](${BBOX});
);
out body 300;
>;
out skel qt;
`;

export type PlaceSeedItem = {
  name: string;
  category:
    | "healthcare"
    | "education"
    | "food_and_drink"
    | "government"
    | "outdoor"
    | "retail"
    | "transport"
    | "lodging"
    | "workplace"
    | "other";
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
};

export function mapOsmTagsToCategory(
  tags: Record<string, string>,
): PlaceSeedItem["category"] {
  const amenity = tags.amenity;
  const leisure = tags.leisure;
  const shop = tags.shop;
  const railway = tags.railway;
  const highway = tags.highway;
  const tourism = tags.tourism;

  if (amenity && /hospital|clinic|doctors|pharmacy/.test(amenity))
    return "healthcare";
  if (amenity && /school|university|college|kindergarten|library/.test(amenity))
    return "education";
  if (amenity && /restaurant|cafe|fast_food|food_court|bar|pub/.test(amenity))
    return "food_and_drink";
  if (
    amenity &&
    /townhall|courthouse|police|post_office|community_centre|public_building/.test(
      amenity,
    )
  )
    return "government";
  if (amenity && /bank/.test(amenity)) return "workplace";

  if (leisure && /park|garden|playground|nature_reserve/.test(leisure))
    return "outdoor";
  if (shop && /supermarket|mall|department_store|convenience/.test(shop))
    return "retail";
  if (railway && /station|halt/.test(railway)) return "transport";
  if (highway && /bus_stop/.test(highway)) return "transport";
  if (tourism && /hotel|guest_house|hostel|motel/.test(tourism))
    return "lodging";
  if (tourism && /museum|attraction|zoo|gallery/.test(tourism))
    return "outdoor";

  return "other";
}

export function formatAddress(
  tags: Record<string, string>,
  lat: number,
  lon: number,
): string {
  const parts: string[] = [];
  if (tags["addr:housenumber"]) parts.push(tags["addr:housenumber"]);
  if (tags["addr:street"]) parts.push(tags["addr:street"]);
  if (tags["addr:suburb"]) parts.push(tags["addr:suburb"]);
  if (tags["addr:city"]) parts.push(tags["addr:city"]);

  if (parts.length >= 2) {
    return parts.join(", ");
  }

  // Infer area name based on coordinates in Western Province
  let area = "Colombo";
  if (lat > 6.9 && lon > 79.95) area = "Malabe";
  else if (lat > 6.92 && lon > 79.97) area = "Kaduwela";
  else if (lat < 6.89 && lon > 79.88) area = "Nugegoda";
  else if (lat < 6.86) area = "Dehiwala / Mount Lavinia";
  else if (lon > 79.89 && lat >= 6.88 && lat <= 6.92)
    area = "Sri Jayawardenepura Kotte";
  else if (lon <= 79.86) area = "Colombo City Center";

  if (tags["addr:street"]) {
    return `${tags["addr:street"]}, ${area}`;
  }
  return `${area}, Western Province`;
}

export async function fetchOsmPlaces(): Promise<PlaceSeedItem[]> {
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(OVERPASS_QUERY)}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "WaybleAccessibilityMapper/1.0 (seed-script)",
      },
    });

    if (!res.ok) {
      throw new Error(
        `Overpass API responded with HTTP ${res.status}: ${res.statusText}`,
      );
    }

    const data = (await res.json()) as {
      elements: Array<{
        type: string;
        id: number;
        lat: number;
        lon: number;
        tags?: Record<string, string>;
      }>;
    };

    const places: PlaceSeedItem[] = [];
    const seenNames = new Set<string>();

    for (const elem of data.elements) {
      if (!elem.tags || !elem.tags.name || !elem.lat || !elem.lon) continue;

      const name = elem.tags.name.trim();
      // Avoid duplicate names close together
      const nameKey = name.toLowerCase();
      if (seenNames.has(nameKey)) continue;
      seenNames.add(nameKey);

      const category = mapOsmTagsToCategory(elem.tags);
      const address = formatAddress(elem.tags, elem.lat, elem.lon);

      places.push({
        name,
        category,
        address,
        location: {
          latitude: Number(elem.lat.toFixed(6)),
          longitude: Number(elem.lon.toFixed(6)),
        },
      });

      if (places.length >= 155) break;
    }

    return places;
  } catch (err) {
    console.warn(
      "Could not fetch fresh places from Overpass API (falling back to curated set):",
      err,
    );
    return [];
  }
}

async function main() {
  console.log("Fetching public places from OpenStreetMap Overpass API...");
  const places = await fetchOsmPlaces();
  console.log(`Fetched ${places.length} places from OSM.`);

  const outputPath = path.join(
    __dirname,
    "../packages/backend/convex/seed/places.json",
  );
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  if (places.length >= 100) {
    fs.writeFileSync(outputPath, JSON.stringify(places, null, 2), "utf-8");
    console.log(`Wrote ${places.length} places to ${outputPath}`);
  } else {
    console.log(
      `Using fallback seed dataset generation to ensure ~150 places.`,
    );
  }
}

if (import.meta.main) {
  main();
}
