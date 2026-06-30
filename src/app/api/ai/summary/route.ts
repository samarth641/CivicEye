import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      summary: "AI Daily Summary is not available. Please configure `OPENAI_API_KEY` in your environment variables to enable dynamic summary generation.",
    });
  }

  try {
    // Retrieve reports to generate dynamic context
    let reportsContext = "No active citizen reports database entries.";
    if (process.env.DATABASE_URL) {
      const reports = await prisma.report.findMany({
        take: 15,
        orderBy: { createdAt: "desc" },
        select: { type: true, status: true, description: true },
      });
      if (reports.length > 0) {
        reportsContext = reports
          .map((r) => `- Type: ${r.type}, Status: ${r.status}, Desc: ${r.description || "None"}`)
          .join("\n");
      }
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are the AI Command Analyst for CivicEye. Generate a professional Daily Executive Summary (3 paragraphs max) based on the list of recent citizen reports. Analyze patterns, suggest crew relocations, estimate priorities, and output in markdown format.",
          },
          {
            role: "user",
            content: `Active Reports list:\n${reportsContext}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API failed with status ${response.status}`);
    }

    const data = await response.json();
    const summary = data.choices[0].message.content;
    return NextResponse.json({ summary });
  } catch (e) {
    console.error("OpenAI Summary API Error: ", e);
    return NextResponse.json({
      summary: "The AI summary engine encountered a connection error. Verify your OpenAI quota and API key status.",
    });
  }
}
