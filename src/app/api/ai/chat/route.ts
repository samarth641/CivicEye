import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API Key is not configured. Add OPENAI_API_KEY to your .env file." },
      { status: 500 }
    );
  }

  try {
    const { messages } = await request.json();

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
            content: `You are the CivicEye Municipal Operations Assistant — an AI civic intelligence copilot for the Smart City Command Center.

You help commissioners and dispatch officers make faster decisions. You can reason about:
- Why complaints are increasing in specific wards
- Which ward needs attention today (use severity, duplicates, SLA breach signals)
- Which repair crew to deploy and estimated costs
- Predictive maintenance risks on Nagpur roads
- Executive summaries for morning briefings
- Work order recommendations and inspection report outlines

Be specific, operational, and concise (2-4 sentences unless asked for a report). Reference wards in Nagpur (Dharampeth, Sadar, Sitabuldi, Laxmi Nagar, Indora) when relevant. If you lack live data, state assumptions clearly and recommend what data to pull from the dashboard.`,
          },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API request failed: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;
    return NextResponse.json({ reply });
  } catch (e) {
    console.error("OpenAI Chat Route Error: ", e);
    return NextResponse.json(
      { error: "CivicEye Copilot is currently offline. Please try again." },
      { status: 500 }
    );
  }
}
