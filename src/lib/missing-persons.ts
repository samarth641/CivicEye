import type { MissingPerson } from "@/types";
import type { HeatmapPoint } from "@/lib/civic-intelligence";
import { getWardForPoint } from "@/lib/civic-intelligence";
import { MISSING_PERSON_PHOTOS } from "@/lib/report-images";

/** Demo missing-person cases tied to real Nagpur locations */
const DEMO_MISSING_PERSONS_RAW = [
  {
    id: "mp-1",
    name: "Rahul Deshmukh",
    age: 72,
    gender: "Male",
    lastSeenAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    latitude: 21.1582,
    longitude: 79.0921,
    area: "Sitabuldi Main Road",
    status: "ACTIVE",
    description: "Elderly man with mild dementia. Last seen near Variety Square wearing white kurta.",
    contactNumber: "98765-43210",
    clothing: "White kurta, brown sandals",
  },
  {
    id: "mp-2",
    name: "Priya Sharma",
    age: 14,
    gender: "Female",
    lastSeenAt: new Date(Date.now() - 18 * 3600000).toISOString(),
    latitude: 21.152,
    longitude: 79.088,
    area: "Nagpur Railway Station",
    status: "ACTIVE",
    description: "School uniform — blue skirt, white shirt. Did not return from tuition class.",
    contactNumber: "91234-56789",
    clothing: "School uniform, pink backpack",
  },
  {
    id: "mp-3",
    name: "Arjun Patil",
    age: 8,
    gender: "Male",
    lastSeenAt: new Date(Date.now() - 36 * 3600000).toISOString(),
    latitude: 21.131,
    longitude: 79.048,
    area: "Dharampeth Square",
    status: "ACTIVE",
    description: "Child separated from parents at market. Speaks Marathi and Hindi.",
    contactNumber: "99887-76655",
    clothing: "Red t-shirt, blue shorts",
  },
  {
    id: "mp-4",
    name: "Sunita Wagh",
    age: 45,
    gender: "Female",
    lastSeenAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    latitude: 21.118,
    longitude: 79.095,
    area: "Laxmi Nagar Chowk",
    status: "ACTIVE",
    description: "Reported missing after leaving for vegetable market. Carries green saree bag.",
    contactNumber: "97654-32109",
    clothing: "Green saree, gold bangles",
  },
  {
    id: "mp-5",
    name: "Vikram Singh",
    age: 19,
    gender: "Male",
    lastSeenAt: new Date(Date.now() - 72 * 3600000).toISOString(),
    latitude: 21.175,
    longitude: 79.125,
    area: "Kamptee Road junction",
    status: "ACTIVE",
    description: "College student. Phone last pinged near bus stop. Black hoodie and jeans.",
    contactNumber: "90123-45678",
    clothing: "Black hoodie, blue jeans",
  },
  {
    id: "mp-6",
    name: "Meera Joshi",
    age: 6,
    gender: "Female",
    lastSeenAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    latitude: 21.1558,
    longitude: 79.079,
    area: "Civil Lines",
    status: "ACTIVE",
    description: "Young girl playing near park. Yellow frock with cartoon print.",
    contactNumber: "98989-12121",
    clothing: "Yellow frock, white sandals",
  },
  {
    id: "mp-7",
    name: "Kishore Bansode",
    age: 55,
    gender: "Male",
    lastSeenAt: new Date(Date.now() - 96 * 3600000).toISOString(),
    latitude: 21.108,
    longitude: 79.035,
    area: "MIHAN / Hingna belt",
    status: "ACTIVE",
    description: "Factory worker. Did not return from night shift. Wears safety vest.",
    contactNumber: "98230-11223",
    clothing: "Orange safety vest, grey trousers",
  },
  {
    id: "mp-8",
    name: "Ananya Reddy",
    age: 22,
    gender: "Female",
    lastSeenAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    latitude: 21.145,
    longitude: 79.125,
    area: "Seminary Hills",
    status: "ACTIVE",
    description: "Jogger last seen on hill road at dawn. Purple track suit.",
    contactNumber: "93456-78901",
    clothing: "Purple tracksuit, white sneakers",
  },
  {
    id: "mp-9",
    name: "Mohammed Khan",
    age: 68,
    gender: "Male",
    lastSeenAt: new Date(Date.now() - 120 * 3600000).toISOString(),
    latitude: 21.095,
    longitude: 79.135,
    area: "Mankapur / Beltarodi",
    status: "ACTIVE",
    description: "Diabetic patient wandered from home. Needs medication within 12 hours.",
    contactNumber: "98123-45670",
    clothing: "White cap, beige shirt",
  },
  {
    id: "mp-10",
    name: "Lakshmi Iyer",
    age: 35,
    gender: "Female",
    lastSeenAt: new Date(Date.now() - 8 * 3600000).toISOString(),
    latitude: 21.098,
    longitude: 79.067,
    area: "Wardha Road",
    status: "LOCATED",
    description: "Located safe at relative's home — kept on map for pattern analysis.",
    contactNumber: "97000-55443",
    clothing: "Blue salwar kameez",
  },
] as const satisfies readonly Omit<MissingPerson, "wardId">[];

export const DEMO_MISSING_PERSONS: MissingPerson[] = DEMO_MISSING_PERSONS_RAW.map((p, i) => ({
  ...p,
  photoUrl: MISSING_PERSON_PHOTOS[i % MISSING_PERSON_PHOTOS.length].url,
  wardId: getWardForPoint(p.latitude, p.longitude).id,
}));

export function buildMissingPersonHeatmapPoints(persons: MissingPerson[]): HeatmapPoint[] {
  return persons
    .filter((p) => p.status === "ACTIVE")
    .map((p) => {
      const hoursAgo = (Date.now() - new Date(p.lastSeenAt).getTime()) / 3_600_000;
      const recency = Math.max(0.35, Math.min(1, 1.2 - hoursAgo / 120));
      return {
        lat: p.latitude,
        lng: p.longitude,
        intensity: recency,
      };
    });
}

export function activeMissingCount(persons: MissingPerson[]): number {
  return persons.filter((p) => p.status === "ACTIVE").length;
}
