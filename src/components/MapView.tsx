"use client";

import { useState, useEffect } from "react";
import { useMapStore } from "@/lib/store";
import { MapProvider } from "@/components/map/MapProvider";
import { NagpurMap } from "@/components/map/NagpurMap";
import { MapControls } from "@/components/map/MapControls";
import { MapLayerPanel } from "@/components/map/MapLayerPanel";
import { RoadDetailPanel } from "@/components/map/RoadDetailPanel";
import { Legend } from "@/components/overlays/Legend";
import { ReportPopup } from "@/components/overlays/ReportPopup";
import { ReportDialog } from "@/components/overlays/ReportDialog";
import { ReportMapPinHint } from "@/components/overlays/ReportMapPinHint";
import { useReportsPolling } from "@/hooks/useReportsPolling";
import { MapErrorOverlay } from "@/components/map/MapErrorOverlay";
import { IssueDetailsModal } from "@/components/map/IssueDetailsModal";
import { GovAnalytics } from "@/components/overlays/GovAnalytics";
import { CitizenHub } from "@/components/overlays/CitizenHub";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Clock,
  Send,
  Building2,
  FileBarChart,
  Radio,
  UserCheck,
  AlertTriangle,
  UserSearch,
} from "lucide-react";
import { activeMissingCount } from "@/lib/missing-persons";
import { cn } from "@/lib/utils";
import {
  MobileMapNav,
  MobileSheetBackdrop,
  MobileSheetHeader,
  MapLayersList,
} from "@/components/overlays/MobileMapNav";

export function MapView() {
  useReportsPolling();

  const {
    reports,
    missingPersons,
    selectedReportId,
    mapAuthError,
    mapFallbackReason,
    detailsModalOpen,
    setDetailsModalOpen,
    setSelectedReportId,
    flyToLocation,
    setReportDialogOpen,
    cityHealthIndex,
    setMapLayer,
    mapLayers,
    isReportDialogOpen,
    reportLocationMode,
    reportLocationPinned,
    mobileSheet,
    setMobileSheet,
  } = useMapStore();

  const [activeTab, setActiveTab] = useState<"COMMAND_CENTER" | "GOV_ANALYTICS" | "CITIZEN_HUB">("COMMAND_CENTER");

  // Chat state for Right Sidebar
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "USER" | "AI"; text: string }>>([
    { sender: "AI", text: "CivicEye Copilot online. How can I assist you with city health, operations, or predictive trends today?" },
  ]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatMessages((prev) => [...prev, { sender: "USER", text: userText }]);
    setChatInput("");

    // Add a loading indicator
    setChatMessages((prev) => [...prev, { sender: "AI", text: "Analyzing query..." }]);

    try {
      const apiMessages = chatMessages
        .map((m) => ({
          role: m.sender === "USER" ? "user" : "assistant",
          content: m.text,
        }))
        .concat({ role: "user", content: userText });

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await res.json();

      setChatMessages((prev) => {
        const list = prev.filter((m) => m.text !== "Analyzing query...");
        if (data.reply) {
          return [...list, { sender: "AI", text: data.reply }];
        } else if (data.error) {
          return [...list, { sender: "AI", text: `⚠️ ${data.error}` }];
        }
        return [...list, { sender: "AI", text: "Failed to communicate with CivicEye Copilot." }];
      });
    } catch (err) {
      console.error(err);
      setChatMessages((prev) => {
        const list = prev.filter((m) => m.text !== "Analyzing query...");
        return [...list, { sender: "AI", text: "Connection error. Configure your OPENAI_API_KEY." }];
      });
    }
  };

  const enrichedReports = [...reports]
    .filter((r) => r.status !== "RESOLVED")
    .sort(
      (a, b) =>
        (b.aiMetadata?.severity ?? 0) - (a.aiMetadata?.severity ?? 0)
    );

  const activeMissing = missingPersons.filter((p) => p.status === "ACTIVE");

  const mapPickActive =
    isReportDialogOpen && reportLocationMode === "PINPOINT" && !reportLocationPinned;

  useEffect(() => {
    document.body.classList.toggle("report-pin-picking", mapPickActive);
    return () => document.body.classList.remove("report-pin-picking");
  }, [mapPickActive]);

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground font-sans">
      <header className="relative z-30 flex h-12 w-full shrink-0 items-center justify-between gap-2 border-b border-border bg-card/95 px-2 backdrop-blur-md pointer-events-auto sm:h-14 sm:gap-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5">
            <Radio className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate text-sm font-bold text-foreground">
              CivicEye
            </span>
          </div>
          <span className="hidden h-4 w-px bg-border sm:block" />
          <span className="hidden text-xs font-medium text-muted-foreground sm:inline">
            CivicEye command center
          </span>
        </div>

        <div className="flex items-center rounded-xl border border-border bg-secondary/80 p-0.5 sm:p-1">
          <Button
            onClick={() => setActiveTab("COMMAND_CENTER")}
            variant={activeTab === "COMMAND_CENTER" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 rounded-lg px-2 text-xs font-medium sm:h-8 sm:px-4"
          >
            <Building2 className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Map</span>
          </Button>
          <Button
            onClick={() => setActiveTab("GOV_ANALYTICS")}
            variant={activeTab === "GOV_ANALYTICS" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 rounded-lg px-2 text-xs font-medium sm:h-8 sm:px-4"
          >
            <FileBarChart className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Analytics</span>
          </Button>
          <Button
            onClick={() => setActiveTab("CITIZEN_HUB")}
            variant={activeTab === "CITIZEN_HUB" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 rounded-lg px-2 text-xs font-medium sm:h-8 sm:px-4"
          >
            <UserCheck className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Citizens</span>
          </Button>
        </div>

        <Button
          onClick={() => setReportDialogOpen(true)}
          size="sm"
          className="h-7 shrink-0 px-2.5 text-xs font-semibold sm:h-8"
        >
          Report
        </Button>
      </header>

      <div className="relative min-h-0 flex-1 w-full overflow-hidden bg-background">
        <MapProvider>
          <div
            className={cn(
              "absolute inset-0 z-0",
              activeTab !== "COMMAND_CENTER" && "invisible pointer-events-none"
            )}
          >
            <NagpurMap />
          </div>

          {activeTab === "COMMAND_CENTER" && (
            <>
              <MobileSheetBackdrop />

              <aside
                className={cn(
                  "map-panel pointer-events-auto z-40 flex flex-col gap-3 overflow-hidden p-4",
                  mobileSheet === "incidents"
                    ? "fixed inset-x-2 bottom-[4.75rem] top-[3.25rem] max-h-none"
                    : "hidden",
                  "md:absolute md:inset-auto md:bottom-20 md:left-4 md:top-[4.5rem] md:z-20 md:flex md:w-80"
                )}
              >
                  <MobileSheetHeader
                    title="Live incidents"
                    onClose={() => setMobileSheet(null)}
                  />
                  <div className="hidden map-panel-header items-center justify-between md:flex">
                    <h3 className="map-panel-title">Live incidents</h3>
                    <span className="map-chip border-red-500/30 bg-red-500/15 text-red-300">
                      {enrichedReports.length} active
                    </span>
                  </div>
                  <div className="flex items-center justify-end md:hidden">
                    <span className="map-chip border-red-500/30 bg-red-500/15 text-red-300">
                      {enrichedReports.length} active
                    </span>
                  </div>

                  <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                    {enrichedReports.length === 0 ? (
                      <p className="map-muted-text py-6 text-center">
                        No reports yet. Be the first to report a road issue.
                      </p>
                    ) : (
                      enrichedReports.map((report) => (
                        <button
                          key={report.id}
                          type="button"
                          onClick={() => {
                            setSelectedReportId(report.id);
                            flyToLocation({
                              lat: report.latitude,
                              lng: report.longitude,
                              zoom: 16,
                            });
                          }}
                          className={`w-full rounded-xl border p-3 text-left transition-colors ${
                            selectedReportId === report.id
                              ? "border-primary/50 bg-primary/10"
                              : "border-border/60 bg-secondary/40 hover:bg-secondary/70"
                          }`}
                        >
                          <div className="mb-1.5 flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-foreground">
                              {report.type.replace("_", " ")}
                            </span>
                            <span className="flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-300">
                              <AlertTriangle className="h-3 w-3" />
                              {report.aiMetadata?.severity ?? "—"}
                            </span>
                          </div>
                          <p className="map-body-text line-clamp-2 text-sm text-muted-foreground">
                            {report.description || "No description provided."}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {report.roadName && (
                              <span className="map-chip">{report.roadName}</span>
                            )}
                            <span className="map-chip">{report.aiMetadata?.ward ?? "Nagpur"}</span>
                            <span className="map-chip">{report.aiMetadata?.priority ?? "MEDIUM"}</span>
                          </div>
                          <div className="mt-1.5 flex items-center justify-between border-t border-border/50 pt-2 text-xs text-muted-foreground">
                            <span>{report.status.replace("_", " ")}</span>
                            <span>{new Date(report.createdAt).toLocaleTimeString()}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  <div className="shrink-0 border-t border-border/60 pt-3">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-foreground">
                        <UserSearch className="h-3.5 w-3.5 text-violet-400" />
                        Missing persons
                      </h4>
                      <span className="map-chip border-violet-500/30 bg-violet-500/15 text-violet-300">
                        {activeMissingCount(missingPersons)} active
                      </span>
                    </div>
                    <div className="max-h-36 space-y-1.5 overflow-y-auto pr-1">
                      {activeMissing.length === 0 ? (
                        <p className="map-muted-text py-2 text-center text-xs">
                          No active missing-person alerts.
                        </p>
                      ) : (
                        activeMissing.slice(0, 5).map((person) => (
                          <button
                            key={person.id}
                            type="button"
                            onClick={() => {
                              setMapLayer("missingPersonsHeatmap", true);
                              flyToLocation({
                                lat: person.latitude,
                                lng: person.longitude,
                                zoom: 16,
                              });
                            }}
                            className="w-full rounded-lg border border-violet-500/20 bg-violet-500/5 px-2.5 py-2 text-left transition-colors hover:bg-violet-500/10"
                          >
                            <p className="text-xs font-semibold text-foreground">
                              {person.name}, {person.age}y
                            </p>
                            <p className="line-clamp-1 text-[11px] text-muted-foreground">
                              {person.area}
                            </p>
                            <p className="mt-0.5 text-[10px] text-violet-300">
                              Last seen {new Date(person.lastSeenAt).toLocaleString()}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                    {!mapLayers.missingPersonsHeatmap && activeMissing.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setMapLayer("missingPersonsHeatmap", true)}
                        className="mt-2 w-full rounded-lg border border-violet-500/30 bg-violet-500/10 py-1.5 text-xs font-medium text-violet-300 hover:bg-violet-500/20"
                      >
                        Show missing-person heatmap
                      </button>
                    )}
                  </div>
                </aside>

              <aside
                className={cn(
                  "map-panel pointer-events-auto z-40 flex flex-col gap-3 overflow-hidden p-4",
                  mobileSheet === "copilot"
                    ? "fixed inset-x-2 bottom-[4.75rem] top-[3.25rem] max-h-none"
                    : "hidden",
                  "md:absolute md:inset-auto md:bottom-20 md:right-4 md:top-[4.5rem] md:z-20 md:flex md:w-96"
                )}
              >
                  <MobileSheetHeader
                    title="CivicEye Copilot"
                    onClose={() => setMobileSheet(null)}
                  />
                  <div className="hidden map-panel-header md:block">
                    <h3 className="map-panel-title flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      CivicEye Copilot
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-xs font-semibold sm:grid-cols-4">
                    <div className="rounded-lg border border-border bg-secondary/50 py-2 px-1">
                      <span className="mb-1 block text-[10px] font-medium uppercase text-muted-foreground">
                        City health
                      </span>
                      <span className={cityHealthIndex >= 70 ? "text-emerald-400" : cityHealthIndex >= 50 ? "text-amber-400" : "text-red-400"}>
                        {cityHealthIndex}/100
                      </span>
                    </div>
                    <div className="rounded-lg border border-border bg-secondary/50 py-2 px-1">
                      <span className="mb-1 block text-[10px] font-medium uppercase text-muted-foreground">
                        Open issues
                      </span>
                      <span className="text-foreground">{enrichedReports.length}</span>
                    </div>
                    <div className="rounded-lg border border-border bg-secondary/50 py-2 px-1">
                      <span className="mb-1 block text-[10px] font-medium uppercase text-muted-foreground">
                        SLA risk
                      </span>
                      <span className="text-amber-400">
                        {reports.filter((r) => r.aiMetadata?.slaBreached).length}
                      </span>
                    </div>
                    <div className="rounded-lg border border-border bg-secondary/50 py-2 px-1">
                      <span className="mb-1 block text-[10px] font-medium uppercase text-muted-foreground">
                        Missing
                      </span>
                      <span className="text-violet-400">
                        {activeMissingCount(missingPersons)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-end space-y-2 overflow-y-auto pr-1">
                    {chatMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`max-w-[90%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                          msg.sender === "USER"
                            ? "ml-auto bg-primary text-primary-foreground"
                            : "mr-auto border border-border bg-secondary text-foreground"
                        }`}
                      >
                        {msg.text}
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleChatSubmit} className="flex shrink-0 gap-2 border-t border-border/60 pt-3">
                    <Input
                      placeholder="Ask CivicEye about roads, traffic..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="h-9 flex-1 text-sm"
                    />
                    <Button type="submit" size="icon" className="h-9 w-9 shrink-0" aria-label="Send message">
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </aside>

              {mobileSheet === "layers" && (
                <aside className="map-panel pointer-events-auto fixed inset-x-2 bottom-[4.75rem] top-[3.25rem] z-40 flex flex-col gap-4 overflow-y-auto p-4 md:hidden">
                  <MobileSheetHeader title="Map layers" onClose={() => setMobileSheet(null)} />
                  <MapLayersList compact />
                  <div className="border-t border-border/60 pt-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Legend
                    </p>
                    <Legend embedded />
                  </div>
                </aside>
              )}

                {/* Overlays / Popups */}
                <MapLayerPanel />
                <RoadDetailPanel />
                <Legend />
                <ReportPopup />
                <ReportMapPinHint />
                <ReportDialog />
                <MapControls />
              <MobileMapNav />
              {mapAuthError && mapFallbackReason !== "config" && <MapErrorOverlay />}
            </>
          )}

          <AnimatePresence mode="wait">
            {activeTab === "GOV_ANALYTICS" && (
            <motion.div
              key="gov-panel"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="absolute inset-0 z-20 overflow-y-auto bg-background p-4 sm:p-6"
            >
              <GovAnalytics />
            </motion.div>
          )}

          {/* View 3: Citizen Hub & Leaderboard */}
          {activeTab === "CITIZEN_HUB" && (
            <motion.div
              key="citizen-panel"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="absolute inset-0 z-20 overflow-y-auto bg-background p-4 sm:p-6"
            >
              <CitizenHub />
            </motion.div>
          )}
        </AnimatePresence>
        </MapProvider>
      </div>

      {/* Details diagnostics Dialog overlay */}
      <IssueDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
      />

      <footer className="relative z-30 flex h-9 w-full shrink-0 items-center overflow-hidden border-t border-border bg-card/95 px-2 text-xs text-muted-foreground pointer-events-none sm:px-6">
        <div className="mr-4 flex shrink-0 items-center gap-1.5 font-medium text-primary">
          <Clock className="h-3.5 w-3.5" />
          <span>Updates</span>
        </div>
        <div className="relative flex-1 overflow-hidden">
          <div className="inline-flex animate-marquee gap-12 whitespace-nowrap text-foreground/80">
            <span>Crew dispatched to Sitabuldi road collapse</span>
            <span>9 active missing-person alerts — enable heatmap in layer panel</span>
            <span>Duplicate pothole reports merged near Civil Lines</span>
            <span>8 municipal wards now mapped across greater Nagpur</span>
            <span>Citizen report #9842 verified — Road Damage, Dharampeth</span>
            <span>High water-logging risk flagged near Ambazari lake</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
