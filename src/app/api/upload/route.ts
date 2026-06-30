import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json(
      { error: "No file provided" },
      { status: 400 }
    );
  }

  const cloudinaryUrl = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_URL;
  const cloudinaryPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

  if (!cloudinaryUrl || !cloudinaryPreset) {
    return NextResponse.json(
      { error: "Upload not configured. Set CLOUDINARY_* env vars." },
      { status: 503 }
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64 = buffer.toString("base64");
  const dataUri = `data:${file.type};base64,${base64}`;

  const body = new FormData();
  body.append("file", dataUri);
  body.append("upload_preset", cloudinaryPreset);

  const res = await fetch(cloudinaryUrl, {
    method: "POST",
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Cloudinary error:", err);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 502 }
    );
  }

  const data = (await res.json()) as { secure_url?: string };
  return NextResponse.json({ url: data.secure_url });
}
