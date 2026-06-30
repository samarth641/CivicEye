import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Demo news for testing when DB is empty or not configured */
const DEMO_NEWS = [
  {
    id: "demo-1",
    title: "Wardha Road repair work from next week",
    body: "NMC has announced repair and resurfacing of Wardha Road between Variety Square and Dharampeth. Commuters may expect minor diversions during peak hours.",
    latitude: 21.1522,
    longitude: 79.0821,
    sourceUrl: "https://timesofindia.indiatimes.com/city/nagpur",
    imageUrl: null,
    publishedAt: new Date().toISOString(),
  },
  {
    id: "demo-2",
    title: "New flyover at Sitabuldi to ease traffic",
    body: "The proposed flyover at Sitabuldi interchange is expected to reduce congestion by 40%. Construction is likely to begin in the coming months.",
    latitude: 21.1389,
    longitude: 79.0842,
    sourceUrl: null,
    imageUrl: null,
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "demo-3",
    title: "Water logging reported near Ambazari",
    body: "Heavy rain caused water accumulation on Ambazari Road. NMC has deployed pumps. Motorists are advised to use alternative routes.",
    latitude: 21.1285,
    longitude: 79.0612,
    sourceUrl: null,
    imageUrl: null,
    publishedAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "demo-4",
    title: "Metro trial run on Sitabuldi–Khapri stretch",
    body: "Nagpur Metro is conducting trial runs on the Sitabuldi to Khapri corridor. Commercial operations are expected to start soon.",
    latitude: 21.0987,
    longitude: 79.0523,
    sourceUrl: "https://www.nagpurmetro.in",
    imageUrl: null,
    publishedAt: new Date(Date.now() - 259200000).toISOString(),
  },
];

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(DEMO_NEWS);
  }
  try {
    const items = await prisma.locationNews.findMany({
      orderBy: { publishedAt: "desc" },
      take: 200,
    });
    const serialized = items.map((n) => ({
      ...n,
      publishedAt: n.publishedAt.toISOString(),
      createdAt: n.createdAt.toISOString(),
    }));
    const result = serialized.length > 0 ? serialized : DEMO_NEWS;
    return NextResponse.json(result);
  } catch (e) {
    if (e != null) console.error(String(e));
    return NextResponse.json(DEMO_NEWS);
  }
}

export async function POST(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Database not configured. Set DATABASE_URL in .env.local" },
      { status: 503 }
    );
  }
  try {
    const body = await request.json();
    const { title, body: newsBody, latitude, longitude, sourceUrl, imageUrl } = body;

    if (!title || typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json(
        { error: "Missing title or valid latitude/longitude" },
        { status: 400 }
      );
    }

    const item = await prisma.locationNews.create({
      data: {
        title,
        body: newsBody ?? "",
        latitude,
        longitude,
        sourceUrl: sourceUrl ?? null,
        imageUrl: imageUrl ?? null,
      },
    });

    return NextResponse.json({
      ...item,
      publishedAt: item.publishedAt.toISOString(),
      createdAt: item.createdAt.toISOString(),
    });
  } catch (e) {
    if (e != null) console.error(String(e));
    return NextResponse.json(
      { error: "Failed to create news" },
      { status: 500 }
    );
  }
}
