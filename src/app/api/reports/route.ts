import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { enrichAllReports } from "@/lib/civic-intelligence";
import type { Report } from "@/types";
import {
  findNearestRoad,
  getRoadById,
  getRoadSamplePoint,
  wardNameFromId,
} from "@/lib/nagpur-roads";
import { defaultRoadImages } from "@/lib/report-images";

function attachRoadFields(report: Report): Report {
  const road =
    (report.roadId && getRoadById(report.roadId)) ||
    findNearestRoad(report.latitude, report.longitude);
  if (!road) return report;
  return {
    ...report,
    roadId: report.roadId ?? road.id,
    roadName: report.roadName ?? road.name,
    wardId: report.wardId ?? road.wardId,
    wardName: report.wardName ?? wardNameFromId(road.wardId),
  };
}

function demoOnRoad(
  roadId: string,
  t: number,
  base: Omit<
    Report,
    "latitude" | "longitude" | "roadId" | "roadName" | "wardId" | "wardName" | "category" | "locationMode" | "beforeImageUrl" | "afterImageUrl"
  >,
  locationMode: "ROAD" | "PINPOINT" = "PINPOINT"
): Report {
  const pt = getRoadSamplePoint(roadId, t)!;
  const road = getRoadById(roadId)!;
  const imgs = defaultRoadImages(base.type);
  return {
    ...base,
    category: "ROAD",
    locationMode,
    latitude: pt.lat,
    longitude: pt.lng,
    roadId: road.id,
    roadName: road.name,
    wardId: road.wardId,
    wardName: wardNameFromId(road.wardId),
    imageUrl: base.imageUrl ?? imgs.issueUrl,
    beforeImageUrl: imgs.beforeUrl,
    afterImageUrl: imgs.afterUrl,
  };
}

const DEMO_REPORTS: Report[] = [
  demoOnRoad("civil-lines", 0.45, {
    id: "demo-r1",
    type: "POTHOLE",
    status: "PENDING",
    description: "Large pothole in the middle lane on Civil Lines. Extremely dangerous at night.",
    imageUrl: null,
    userId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }),
  demoOnRoad("central-avenue", 0.5, {
    id: "demo-r2",
    type: "SPEED_BREAKER",
    status: "ACKNOWLEDGED",
    description: "Unmarked speed breaker on Central Avenue near school zone. Causing sudden braking.",
    imageUrl: null,
    userId: null,
    createdAt: new Date(Date.now() - 43200000).toISOString(),
    updatedAt: new Date(Date.now() - 43200000).toISOString(),
  }),
  demoOnRoad("dharampeth-road", 0.55, {
    id: "demo-r3",
    type: "ROAD_DAMAGE",
    status: "IN_PROGRESS",
    description: "Tar cracking and severe erosion along Dharampeth main road.",
    imageUrl: null,
    userId: null,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  }),
  demoOnRoad("wardha-road", 0.35, {
    id: "demo-r4",
    type: "OTHER",
    status: "RESOLVED",
    description: "Open manhole cover on Wardha Road footpath. Fixed by municipal authorities.",
    imageUrl: null,
    userId: null,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
  }),
  demoOnRoad("kamptee-road", 0.6, {
    id: "demo-r5",
    type: "POTHOLE",
    status: "PENDING",
    description: "Deep crater near Kamptee Road junction slowing freight traffic.",
    imageUrl: null,
    userId: null,
    createdAt: new Date(Date.now() - 21600000).toISOString(),
    updatedAt: new Date(Date.now() - 21600000).toISOString(),
  }),
  demoOnRoad("amravati-road", 0.4, {
    id: "demo-r6",
    type: "ROAD_DAMAGE",
    status: "ACKNOWLEDGED",
    description: "Subsidence and lane narrowing on Amravati Road near bus depot.",
    imageUrl: null,
    userId: null,
    createdAt: new Date(Date.now() - 64800000).toISOString(),
    updatedAt: new Date(Date.now() - 64800000).toISOString(),
  }),
  demoOnRoad("hingna-road", 0.5, {
    id: "demo-r7",
    type: "SPEED_BREAKER",
    status: "PENDING",
    description: "Unlit speed breaker outside MIHAN industrial gate.",
    imageUrl: null,
    userId: null,
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    updatedAt: new Date(Date.now() - 10800000).toISOString(),
  }),
  demoOnRoad("ring-road", 0.3, {
    id: "demo-r8",
    type: "POTHOLE",
    status: "IN_PROGRESS",
    description: "Monsoon washout on Inner Ring Road segment near flyover.",
    imageUrl: null,
    userId: null,
    createdAt: new Date(Date.now() - 54000000).toISOString(),
    updatedAt: new Date(Date.now() - 54000000).toISOString(),
  }),
];

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(enrichAllReports(DEMO_REPORTS));
  }
  try {
    const reports = await prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      include: { user: { select: { name: true, image: true } } },
    });
    const data: Report[] =
      reports.length > 0
        ? reports.map((r) =>
            attachRoadFields({
              ...r,
              createdAt: r.createdAt.toISOString(),
              updatedAt: r.updatedAt.toISOString(),
            })
          )
        : DEMO_REPORTS;
    return NextResponse.json(enrichAllReports(data));
  } catch (e) {
    if (e != null) console.error(String(e));
    return NextResponse.json(enrichAllReports(DEMO_REPORTS));
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    type,
    description,
    latitude,
    longitude,
    imageUrl,
    beforeImageUrl,
    afterImageUrl,
    locationMode,
    category,
    roadId,
    roadName,
    wardId,
    wardName,
  } = body;

  if (
    !type ||
    typeof latitude !== "number" ||
    typeof longitude !== "number"
  ) {
    return NextResponse.json(
      { error: "Missing type or valid latitude/longitude" },
      { status: 400 }
    );
  }

  const validTypes = ["POTHOLE", "SPEED_BREAKER", "ROAD_DAMAGE", "OTHER"];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
  }

  if (!process.env.DATABASE_URL) {
    const demo: Report = attachRoadFields({
      id: `demo-${Date.now()}`,
      type,
      status: "PENDING",
      category: category ?? "ROAD",
      latitude,
      longitude,
      description: description ?? null,
      imageUrl: imageUrl ?? null,
      beforeImageUrl: beforeImageUrl ?? imageUrl ?? null,
      afterImageUrl: afterImageUrl ?? null,
      locationMode: locationMode ?? "PINPOINT",
      userId: null,
      roadId: roadId ?? null,
      roadName: roadName ?? null,
      wardId: wardId ?? null,
      wardName: wardName ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json(enrichAllReports([demo])[0]);
  }

  try {
    const session = await getServerSession(authOptions);

    const userId =
      session?.user?.id && !String(session.user.id).includes("@")
        ? session.user.id
        : null;

    const report = await prisma.report.create({
      data: {
        type,
        description: description ?? null,
        latitude,
        longitude,
        imageUrl: imageUrl ?? null,
        userId,
      },
    });

    const serialized: Report = attachRoadFields({
      ...report,
      category: category ?? "ROAD",
      beforeImageUrl: beforeImageUrl ?? imageUrl ?? null,
      afterImageUrl: afterImageUrl ?? null,
      locationMode: locationMode ?? "PINPOINT",
      roadId: roadId ?? null,
      roadName: roadName ?? null,
      wardId: wardId ?? null,
      wardName: wardName ?? null,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
    });

    return NextResponse.json(enrichAllReports([serialized])[0]);
  } catch (e) {
    if (e != null) console.error(String(e));
    const demo: Report = attachRoadFields({
      id: `demo-${Date.now()}`,
      type,
      status: "PENDING",
      category: category ?? "ROAD",
      latitude,
      longitude,
      description: description ?? null,
      imageUrl: imageUrl ?? null,
      beforeImageUrl: beforeImageUrl ?? imageUrl ?? null,
      afterImageUrl: afterImageUrl ?? null,
      locationMode: locationMode ?? "PINPOINT",
      userId: null,
      roadId: roadId ?? null,
      roadName: roadName ?? null,
      wardId: wardId ?? null,
      wardName: wardName ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json(enrichAllReports([demo])[0]);
  }
}
