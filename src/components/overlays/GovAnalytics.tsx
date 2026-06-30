"use client";

import { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  WeeklyTrendChart,
  WardCompletionChart,
  PredictiveHotspotChart,
} from "@/components/ui/CityCharts";
import {
  BrainCircuit,
  Wrench,
  Users,
  AlertOctagon,
  FileSpreadsheet,
  TrendingUp,
} from "lucide-react";

export function GovAnalytics() {
  const [summary, setSummary] = useState("Analyzing recent report trends and compiling CivicEye executive summary...");
  const [loadingSummary, setLoadingSummary] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch("/api/ai/summary");
        const data = await res.json();
        if (data.summary) {
          setSummary(data.summary);
        }
      } catch (err) {
        console.error(err);
        setSummary("Failed to fetch executive summary. Ensure OPENAI_API_KEY is configured in your .env variables.");
      } finally {
        setLoadingSummary(false);
      }
    };
    fetchSummary();
  }, []);

  const WARD_DATA = [
    { name: "Dharampeth", reported: 142, resolved: 139, sla: "98.2%", crews: 8 },
    { name: "Laxmi Nagar", reported: 94, resolved: 80, sla: "85.1%", crews: 4 },
    { name: "Mankapur / Beltarodi", reported: 76, resolved: 68, sla: "89.5%", crews: 3 },
    { name: "Sadar / Civil Lines", reported: 85, resolved: 80, sla: "94.1%", crews: 5 },
    { name: "Sitabuldi", reported: 210, resolved: 185, sla: "88.0%", crews: 12 },
    { name: "Seminary Hills", reported: 58, resolved: 52, sla: "89.7%", crews: 3 },
    { name: "Hingna / MIHAN", reported: 67, resolved: 54, sla: "80.6%", crews: 4 },
    { name: "Indora", reported: 112, resolved: 81, sla: "72.3%", crews: 6 },
  ];

  const PREDICTIONS = [
    { segment: "Wardha Road (Variety Sq to Airport)", type: "Pavement Cracking", risk: "HIGH (89%)", window: "14 Days", cost: "₹4.5L" },
    { segment: "Central Avenue (Telephone Exch Sq)", type: "Severe Potholing", risk: "HIGH (82%)", window: "7 Days", cost: "₹1.8L" },
    { segment: "Ambazari Lake Perimeter Road", type: "Subgrade Erosion", risk: "MEDIUM (64%)", window: "30 Days", cost: "₹8.0L" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 p-4 min-h-0 overflow-y-auto font-sans sm:gap-6 sm:p-6 xl:grid-cols-3 h-full">
      
      {/* Left Column: Charts and Performance */}
      <div className="xl:col-span-2 space-y-6">
        {/* Weekly Trend Chart */}
        <Card className="bg-card border-border backdrop-blur text-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> City Resolution Trends (Weekly)
            </CardTitle>
            <p className="text-muted-foreground text-xs">
              Weekly comparative report of incoming user complaints vs resolved dispatches.
            </p>
          </CardHeader>
          <CardContent>
            <WeeklyTrendChart />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ward Wise Table */}
          <Card className="bg-card border-border backdrop-blur text-foreground">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" /> Ward Performance Matrix
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 text-xs">
              <table className="w-full text-left font-sans border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs uppercase font-semibold">
                    <th className="px-4 py-3">Ward</th>
                    <th className="px-4 py-3 text-right">Reports</th>
                    <th className="px-4 py-3 text-right">Resolved</th>
                    <th className="px-4 py-3 text-right">SLA</th>
                    <th className="px-4 py-3 text-right">Crews</th>
                  </tr>
                </thead>
                <tbody>
                  {WARD_DATA.map((w, index) => (
                    <tr key={index} className="border-b border-border/50 hover:bg-secondary/45">
                      <td className="px-4 py-3.5 font-medium">{w.name}</td>
                      <td className="px-4 py-3.5 text-right font-mono">{w.reported}</td>
                      <td className="px-4 py-3.5 text-right font-mono text-emerald-400">{w.resolved}</td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-primary">{w.sla}</td>
                      <td className="px-4 py-3.5 text-right font-mono">{w.crews}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Ward Completion Chart */}
          <Card className="bg-card border-border backdrop-blur text-foreground">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                <Wrench className="h-4 w-4" /> Completion Efficiency by Ward
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WardCompletionChart />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Column: AI Insights & Predictions */}
      <div className="space-y-6">
        {/* Daily Executive Summary */}
        <Card className="bg-card border-border backdrop-blur text-foreground border-l-4 border-l-primary shadow-xl">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
              <BrainCircuit className={`h-4 w-4 ${loadingSummary ? "animate-pulse" : ""}`} /> AI Daily Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs leading-relaxed max-h-[300px] overflow-y-auto whitespace-pre-wrap text-foreground">
            {summary}
          </CardContent>
        </Card>

        {/* Predictive Hotspot Radar */}
        <Card className="bg-card border-border backdrop-blur text-foreground">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
              <BrainCircuit className="h-4 w-4" /> Predictive Hotspot Analysis
            </CardTitle>
            <p className="text-muted-foreground text-xs">
              Factors determining likelihood of road failure.
            </p>
          </CardHeader>
          <CardContent>
            <PredictiveHotspotChart />
          </CardContent>
        </Card>

        {/* Predictive Maintenance list */}
        <Card className="bg-card border-border backdrop-blur text-foreground flex-1">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
              <AlertOctagon className="h-4 w-4" /> AI Road Failure Forecast
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {PREDICTIONS.map((p, idx) => (
              <div key={idx} className="rounded-lg border border-border bg-secondary p-3 text-xs flex flex-col gap-1.5 font-sans">
                <div className="flex justify-between items-center font-semibold">
                  <span className="text-foreground truncate max-w-[200px]">{p.segment}</span>
                  <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-bold">
                    {p.risk}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground pt-1.5 border-t border-neutral-900 font-mono">
                  <div>
                    <span>Failure Mode</span>
                    <p className="font-semibold text-foreground mt-0.5">{p.type}</p>
                  </div>
                  <div>
                    <span>Est. Window</span>
                    <p className="font-semibold text-foreground mt-0.5">{p.window}</p>
                  </div>
                  <div>
                    <span>Est. Cost</span>
                    <p className="font-semibold text-emerald-400 mt-0.5">{p.cost}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
