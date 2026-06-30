"use client";

import { useState, useEffect } from "react";
import { useMapStore } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { defaultRoadImages } from "@/lib/report-images";
import type { Report, ReportType } from "@/types";
import {
  AlertTriangle,
  Brain,
  Clock,
  Coins,
  Shield,
  Layers,
  CheckCircle,
  MessageSquare,
  Send,
  Calendar,
  Sparkles,
} from "lucide-react";

export function IssueDetailsModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { reports, selectedReportId, updateReport } = useMapStore();
  const [sliderVal, setSliderVal] = useState(50);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Array<{ sender: string; text: string; date: string }>>([]);

  const report: Report | undefined = selectedReportId
    ? reports.find((r) => r.id === selectedReportId)
    : undefined;

  // Set up mock initial comments and reset slider on load
  useEffect(() => {
    if (report) {
      setSliderVal(50);
      setComments([
        {
          sender: "Municipal Inspector (Ward 4)",
          text: "Location verified. Dispatched engineering crew for assessment.",
          date: "2 hours ago",
        },
        {
          sender: "Citizen Liaison",
          text: "Flagged as high-priority due to high school traffic nearby.",
          date: "1 hour ago",
        },
      ]);
    }
  }, [selectedReportId, report]);

  if (!report) return null;

  const ai = report.aiMetadata;
  if (!ai) return null;

  const stock = defaultRoadImages(report.type as ReportType);
  const beforeSrc = report.beforeImageUrl || report.imageUrl || stock.beforeUrl;
  const afterSrc = report.afterImageUrl || stock.afterUrl;

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setComments((prev) => [
      ...prev,
      {
        sender: "You (Command Officer)",
        text: commentText,
        date: "Just now",
      },
    ]);
    setCommentText("");
  };

  // Get status color styling
  const statusColors = {
    PENDING: "bg-red-500/10 text-red-400 border-red-500/20",
    ACKNOWLEDGED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    IN_PROGRESS: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    RESOLVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-card border-border text-foreground backdrop-blur-xl">
        <DialogHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                AI Incident Intelligence
              </span>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase ${
                  statusColors[report.status]
                }`}
              >
                {report.status.replace("_", " ")}
              </span>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                  ai.priority === "CRITICAL"
                    ? "border-red-500/40 bg-red-500/15 text-red-300"
                    : ai.priority === "HIGH"
                      ? "border-amber-500/40 bg-amber-500/15 text-amber-300"
                      : "border-border bg-secondary text-muted-foreground"
                }`}
              >
                {ai.priority} priority
              </span>
            </div>
            <DialogTitle className="mt-1 text-xl font-bold tracking-tight">
              {report.type.replace("_", " ")} · {ai.ward}
            </DialogTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              ID #{report.id.slice(-8)} · {ai.department}
            </p>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mt-4">
          {/* Left Column: Visuals & Media */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
              Incident Verification Image
            </h3>

            {/* Before / After Slider Box */}
            <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 shadow-inner group">
              {/* After State (Repaired or Mock Overlay) */}
              <div className="absolute inset-0">
                <img
                  src={afterSrc}
                  alt="Repaired State"
                  className="h-full w-full object-cover filter saturate-50 brightness-75 hue-rotate-15"
                />
                <div className="absolute top-2 right-2 rounded-full bg-emerald-600/90 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                  Projected repair
                </div>
              </div>

              {/* Before State (Unrepaired) */}
              <div
                className="absolute inset-0 border-r-2 border-primary/80 transition-all duration-75"
                style={{ clipPath: `polygon(0 0, ${sliderVal}% 0, ${sliderVal}% 100%, 0 100%)` }}
              >
                <img
                  src={beforeSrc}
                  alt="Original Incident"
                  className="h-full w-full object-cover filter saturate-100 contrast-125"
                />
                <div className="absolute top-2 left-2 bg-red-500/90 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest shadow shadow-red-500/50">
                  BEFORE / REPORTED
                </div>
              </div>

              {/* Range Input Slider control */}
              <input
                type="range"
                min="0"
                max="100"
                value={sliderVal}
                onChange={(e) => setSliderVal(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-10"
              />

              {/* Sliding handle bar overlay */}
              <div
                className="absolute top-0 bottom-0 w-[2px] bg-white pointer-events-none"
                style={{ left: `${sliderVal}%` }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white shadow-xl flex items-center justify-center text-neutral-800 text-[10px] font-bold">
                  ↔
                </div>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground text-center">
              Drag the slider left or right to compare reported issue vs simulated completion state.
            </p>

            <div className="rounded-xl border border-border bg-secondary/50 p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                <Sparkles className="h-4 w-4" /> AI root cause & recommendation
              </div>
              <p className="text-sm leading-relaxed text-foreground">{ai.rootCause}</p>
              <p className="text-sm italic text-muted-foreground">{ai.aiSummary}</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {ai.explanation.map((line, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary">•</span>
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column: AI Diagnostics & Details Tabs */}
          <div className="md:col-span-3 flex flex-col gap-4">
            <Tabs defaultValue="diagnostics" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-neutral-900 border border-neutral-800 rounded-lg p-1">
                <TabsTrigger value="diagnostics" className="text-xs font-semibold">
                  AI Stats
                </TabsTrigger>
                <TabsTrigger value="timeline" className="text-xs font-semibold">
                  Timeline
                </TabsTrigger>
                <TabsTrigger value="discussion" className="text-xs font-semibold">
                  Officer Notes ({comments.length})
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: AI Diagnostics */}
              <TabsContent value="diagnostics" className="space-y-4 mt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-3 flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground tracking-wider font-semibold">
                        Severity Score
                      </div>
                      <div className="text-lg font-bold text-foreground">
                        {ai.severity} <span className="text-xs text-muted-foreground">/ 10</span>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-3 flex items-center gap-3">
                    <Brain className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground tracking-wider font-semibold">
                        Confidence
                      </div>
                      <div className="text-lg font-bold text-foreground">
                        {ai.confidence}%
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-3 flex items-center gap-3">
                    <Coins className="h-5 w-5 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-[10px] uppercase text-muted-foreground tracking-wider font-semibold">
                        Est. Repair Cost
                      </div>
                      <div className="text-lg font-bold text-foreground">
                        ₹{ai.cost.toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/40 p-3 flex items-center gap-3">
                    <Clock className="h-5 w-5 text-amber-400 shrink-0" />
                    <div>
                      <div className="text-xs uppercase text-muted-foreground font-semibold">
                        SLA {ai.slaBreached ? "(breached)" : "remaining"}
                      </div>
                      <div className={`text-lg font-bold ${ai.slaBreached ? "text-red-400" : "text-foreground"}`}>
                        {ai.slaTime}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/40 p-3 flex items-center gap-3">
                    <Layers className="h-5 w-5 text-sky-400 shrink-0" />
                    <div>
                      <div className="text-xs uppercase text-muted-foreground font-semibold">
                        Repair duration
                      </div>
                      <div className="text-lg font-bold text-foreground">{ai.repairHours}h est.</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-secondary/40 p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="h-4 w-4 text-primary" /> Municipal dispatch intelligence
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Department:</span>
                      <p className="font-semibold mt-0.5">{ai.department}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Suggested crew:</span>
                      <p className="font-semibold mt-0.5">{ai.suggestedCrew}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duplicates merged:</span>
                      <p className="font-semibold mt-0.5">{ai.duplicateCount} nearby</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Citizen verifications:</span>
                      <p className="font-semibold mt-0.5">{ai.verificationCount}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Accident probability:</span>
                      <p className="font-semibold mt-0.5 text-red-400">{ai.accidentProbability}%</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Impacted citizens (est.):</span>
                      <p className="font-semibold mt-0.5">{ai.impactedCitizens.toLocaleString("en-IN")}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Materials:</span>
                      <p className="font-semibold mt-0.5">{ai.suggestedMaterials.join(" · ")}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Nearby critical infrastructure:</span>
                      <p className="font-semibold mt-0.5">
                        {ai.nearbyInfrastructure.length
                          ? ai.nearbyInfrastructure.join(" · ")
                          : "None within 2.5km"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Coordinates:</span>
                      <p className="font-mono text-xs mt-0.5">
                        {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Ward health index:</span>
                      <p className="font-semibold mt-0.5">{ai.wardHealthScore}/100</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 2: Dispatch Timeline */}
              <TabsContent value="timeline" className="space-y-4 mt-3">
                <div className="relative pl-6 border-l border-neutral-800 space-y-4 text-xs py-2 ml-3">
                  {/* Step 1 */}
                  <div className="relative">
                    <div className="absolute -left-[30px] top-0 h-4 w-4 rounded-full border border-primary bg-background flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                    <span className="font-bold text-foreground">Incident Reported by Citizen</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Uploaded with GPS coordinates. Severity index initialized.
                    </p>
                  </div>
                  {/* Step 2 */}
                  <div className="relative">
                    <div className="absolute -left-[30px] top-0 h-4 w-4 rounded-full border border-primary bg-background flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                    <span className="font-bold text-foreground">AI Automatic Categorization</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Classified as {report.type} with {ai.confidence}% confidence. Duplicate filter completed.
                    </p>
                  </div>
                  {/* Step 3 */}
                  <div className="relative">
                    <div className="absolute -left-[30px] top-0 h-4 w-4 rounded-full border border-neutral-700 bg-background flex items-center justify-center">
                      <div className={`h-2 w-2 rounded-full ${report.status !== "PENDING" ? "bg-primary" : "bg-neutral-600"}`} />
                    </div>
                    <span className="font-bold text-foreground">Municipal Dispatch Accepted</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Routed to {ai.department}. SLA countdown started.
                    </p>
                  </div>
                  {/* Step 4 */}
                  <div className="relative">
                    <div className="absolute -left-[30px] top-0 h-4 w-4 rounded-full border border-neutral-700 bg-background flex items-center justify-center">
                      <div className={`h-2 w-2 rounded-full ${report.status === "RESOLVED" || report.status === "IN_PROGRESS" ? "bg-primary" : "bg-neutral-600"}`} />
                    </div>
                    <span className="font-bold text-foreground">Workforce Active (In Progress)</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Repair crew deployed on-site. Asphalt repair active.
                    </p>
                  </div>
                  {/* Step 5 */}
                  <div className="relative">
                    <div className="absolute -left-[30px] top-0 h-4 w-4 rounded-full border border-neutral-700 bg-background flex items-center justify-center">
                      <div className={`h-2 w-2 rounded-full ${report.status === "RESOLVED" ? "bg-emerald-500" : "bg-neutral-600"}`} />
                    </div>
                    <span className="font-bold text-foreground">Resolution & AI Before/After Check</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Repaired work validated via image check. Citizen notified.
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 3: Comments & Officer Notes */}
              <TabsContent value="discussion" className="space-y-3 mt-3">
                <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                  {comments.map((c, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between text-muted-foreground text-[10px] font-semibold mb-1">
                        <span>{c.sender}</span>
                        <span>{c.date}</span>
                      </div>
                      <p className="text-foreground/90">{c.text}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddComment} className="flex gap-2 mt-2">
                  <Input
                    placeholder="Type officer notes or crew directives..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="h-9 text-xs bg-neutral-900 border-neutral-800 text-foreground"
                  />
                  <Button type="submit" size="icon" className="h-9 w-9 shrink-0">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-auto border-t border-border pt-4 flex flex-wrap gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs"
                onClick={() =>
                  updateReport(report.id, { status: "ACKNOWLEDGED" })
                }
              >
                Acknowledge
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs"
                onClick={() =>
                  updateReport(report.id, { status: "IN_PROGRESS" })
                }
              >
                Dispatch {ai.suggestedCrew.split(" ")[0]}
              </Button>
              <Button
                size="sm"
                className="h-9 text-xs font-medium"
                onClick={() => updateReport(report.id, { status: "RESOLVED" })}
              >
                Mark resolved
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
