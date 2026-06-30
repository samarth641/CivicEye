/**
 * Fetches real Nagpur road centerlines from OpenStreetMap Overpass API.
 * Run: node scripts/fetch-osm-roads.mjs
 */
const BBOX = "21.08,78.98,21.20,79.18"; // south,west,north,east

const ROAD_QUERIES = [
  { id: "wardha-road", name: "Wardha Road", wardId: "sitabuldi", accidentProne: true },
  { id: "central-avenue", name: "Central Avenue", wardId: "sadar", accidentProne: true },
  { id: "amravati-road", name: "Amravati Road", wardId: "lakshmi", accidentProne: false },
  { id: "kamptee-road", name: "Kamptee Road", wardId: "indora", accidentProne: true },
  { id: "hingna-road", name: "Hingna Road", wardId: "lakshmi", accidentProne: false },
  { id: "ring-road", name: "Inner Ring Road", wardId: "sitabuldi", accidentProne: true },
  { id: "civil-lines", name: "Civil Lines", wardId: "sadar", accidentProne: false },
  { id: "dharampeth-road", name: "Dharampeth", wardId: "dharampeth", accidentProne: false },
];

const query = `
[out:json][timeout:60];
(
  way["name"~"Wardha Road|Central Avenue|Amravati Road|Kamptee Road|Hingna Road|Ring Road|Civil Lines|Dharampeth|NH 44|NH 53|Wardha road|Kamptee road",i](${BBOX});
);
out geom;
`;

const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 90000);

let res;
try {
  res = await fetch("https://overpass.kumi.systems/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "NagpurCivicMap/1.0 (hackathon; local dev)",
    },
    body: `data=${encodeURIComponent(query)}`,
    signal: controller.signal,
  });
} finally {
  clearTimeout(timeout);
}

if (!res.ok) {
  console.error("Overpass failed", res.status, await res.text());
  process.exit(1);
}

const data = await res.json();
const ways = data.elements.filter((e) => e.type === "way" && e.geometry);

function simplify(coords, maxPoints = 40) {
  if (coords.length <= maxPoints) return coords;
  const step = Math.ceil(coords.length / maxPoints);
  return coords.filter((_, i) => i % step === 0 || i === coords.length - 1);
}

function matchRoad(wayName) {
  const n = wayName.toLowerCase();
  for (const r of ROAD_QUERIES) {
    if (n.includes(r.name.toLowerCase().split(" ")[0])) return r;
  }
  if (n.includes("wardha")) return ROAD_QUERIES[0];
  if (n.includes("central")) return ROAD_QUERIES[1];
  if (n.includes("amravati")) return ROAD_QUERIES[2];
  if (n.includes("kamptee")) return ROAD_QUERIES[3];
  if (n.includes("hingna")) return ROAD_QUERIES[4];
  if (n.includes("ring")) return ROAD_QUERIES[5];
  return null;
}

const byId = new Map();

for (const way of ways) {
  const name = way.tags?.name;
  if (!name || !way.geometry?.length) continue;
  const meta = matchRoad(name);
  if (!meta) continue;

  const path = simplify(
    way.geometry.map((g) => [Number(g.lat.toFixed(6)), Number(g.lon.toFixed(6))])
  );

  const existing = byId.get(meta.id);
  if (!existing || path.length > existing.path.length) {
    byId.set(meta.id, {
      ...meta,
      name: meta.name,
      path,
      accidentRiskLabel: meta.accidentProne ? "OSM-mapped corridor - elevated risk" : undefined,
    });
  }
}

const roads = [...byId.values()];
const fs = await import("fs");
const path = await import("path");
const outDir = path.join(process.cwd(), "src", "data");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "nagpur-roads.json");
fs.writeFileSync(outPath, JSON.stringify(roads, null, 2), "utf8");
console.error(`Wrote ${roads.length} roads to ${outPath}`);
