import { NextResponse } from "next/server";
import { DEMO_MISSING_PERSONS } from "@/lib/missing-persons";
import { getWardForPoint } from "@/lib/civic-intelligence";
import type { MissingPerson } from "@/types";

export async function GET() {
  return NextResponse.json(DEMO_MISSING_PERSONS);
}

export async function POST(request: Request) {
  const body = await request.json();
  const {
    name,
    age,
    gender,
    contactNumber,
    clothing,
    description,
    area,
    latitude,
    longitude,
    photoUrl,
    lastSeenAt,
  } = body;

  if (
    !name ||
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    !description
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const ward = getWardForPoint(latitude, longitude);
  const person: MissingPerson = {
    id: `mp-${Date.now()}`,
    name,
    age: Number(age) || 0,
    gender: gender ?? "Unknown",
    contactNumber: contactNumber ?? "",
    clothing: clothing ?? undefined,
    description,
    area: area ?? "Nagpur",
    latitude,
    longitude,
    lastSeenAt: lastSeenAt ?? new Date().toISOString(),
    status: "ACTIVE",
    photoUrl: photoUrl ?? null,
    wardId: ward.id,
    reportedBy: "Citizen report",
  };

  return NextResponse.json(person);
}
