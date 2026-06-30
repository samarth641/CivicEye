"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMapStore } from "@/lib/store";
import { NAGPUR_WARDS } from "@/lib/civic-intelligence";
import {
  findNearestRoad,
  getRoadsForWard,
  getRoadCentroid,
  getRoadById,
  wardNameFromId,
} from "@/lib/nagpur-roads";
import {
  getIssueImages,
  getBeforeImages,
  getAfterImages,
  MISSING_PERSON_PHOTOS,
  defaultRoadImages,
  type ImageOption,
} from "@/lib/report-images";
import type { ReportCategory, ReportType } from "@/types";
import {
  MapPin,
  Route,
  UserSearch,
  Crosshair,
  ImageIcon,
  Check,
  Upload,
  X,
} from "lucide-react";

const imageField = z.string().optional().or(z.literal(""));

const roadSchema = z.object({
  type: z.enum(["POTHOLE", "SPEED_BREAKER", "ROAD_DAMAGE", "OTHER"]),
  description: z.string().max(800).optional(),
  wardId: z.string().min(1, "Select a zone"),
  roadId: z.string().min(1, "Select a road"),
  latitude: z.number(),
  longitude: z.number(),
  imageUrl: imageField,
  beforeImageUrl: imageField,
  afterImageUrl: imageField,
});

const missingSchema = z.object({
  name: z.string().min(2, "Name required"),
  age: z.coerce.number().min(0).max(120),
  gender: z.string().min(1),
  contactNumber: z.string().min(8, "Valid contact required"),
  clothing: z.string().optional(),
  description: z.string().min(10, "Describe last known details"),
  area: z.string().min(2, "Area / landmark required"),
  latitude: z.number(),
  longitude: z.number(),
  photoUrl: imageField,
});

type RoadFormData = z.infer<typeof roadSchema>;
type MissingFormData = z.infer<typeof missingSchema>;

const TYPE_OPTIONS: { value: ReportType; label: string; icon: string }[] = [
  { value: "POTHOLE", label: "Pothole", icon: "🕳" },
  { value: "SPEED_BREAKER", label: "Speed breaker", icon: "〰" },
  { value: "ROAD_DAMAGE", label: "Road damage", icon: "⚠" },
  { value: "OTHER", label: "Other hazard", icon: "📍" },
];

function PhotoField({
  label,
  value,
  onChange,
  stockOptions,
  uploadHint,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  stockOptions: ImageOption[];
  uploadHint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isUpload = value.startsWith("data:image/");

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 6 * 1024 * 1024) {
      alert("Image must be under 6 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onChange(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        <ImageIcon className="h-3.5 w-3.5" />
        {label}
      </Label>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-3.5 w-3.5" />
          Upload from device
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={onFile}
        />
        {isUpload && (
          <span className="flex items-center text-xs text-emerald-400">Your photo attached ✓</span>
        )}
      </div>

      {value && (
        <div className="relative aspect-video max-h-32 overflow-hidden rounded-lg border border-border">
          <img src={value} alt="Selected" className="h-full w-full object-cover" />
          {isUpload && (
            <button
              type="button"
              className="absolute right-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] text-white"
              onClick={() => onChange(stockOptions[0]?.url ?? "")}
            >
              Remove
            </button>
          )}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground">
        {uploadHint ?? "Upload your own photo or pick a demo image below."}
      </p>

      <div className="grid grid-cols-3 gap-2">
        {stockOptions.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.url)}
            title={opt.label}
            className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
              value === opt.url
                ? "border-primary ring-2 ring-primary/30"
                : "border-border hover:border-primary/50"
            }`}
          >
            <img src={opt.url} alt={opt.label} className="h-full w-full object-cover" />
            {value === opt.url && (
              <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-3 w-3" />
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ReportDialog() {
  const {
    isReportDialogOpen,
    setReportDialogOpen,
    addReport,
    addMissingPerson,
    mapCenter,
    reportPickLocation,
    setReportPickLocation,
    reportFormCategory,
    setReportFormCategory,
    reportLocationPinned,
    setReportLocationPinned,
    reportLocationMode,
    setReportLocationMode,
    flyToLocation,
    setSelectedRoadId,
    setMapLayer,
  } = useMapStore();

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const openedRef = useRef(false);

  const pick = reportPickLocation ?? mapCenter;
  const defaultRoad = findNearestRoad(pick.lat, pick.lng);
  const defaultWard = defaultRoad?.wardId ?? NAGPUR_WARDS[0].id;
  const defaultImages = defaultRoadImages("POTHOLE");

  const roadForm = useForm<RoadFormData>({
    resolver: zodResolver(roadSchema),
    defaultValues: {
      type: "POTHOLE",
      description: "",
      wardId: defaultWard,
      roadId: defaultRoad?.id ?? getRoadsForWard(defaultWard)[0]?.id ?? "",
      latitude: pick.lat,
      longitude: pick.lng,
      imageUrl: defaultImages.issueUrl,
      beforeImageUrl: defaultImages.beforeUrl,
      afterImageUrl: defaultImages.afterUrl,
    },
  });

  const missingForm = useForm<MissingFormData>({
    resolver: zodResolver(missingSchema),
    defaultValues: {
      name: "",
      age: 0,
      gender: "Unknown",
      contactNumber: "",
      clothing: "",
      description: "",
      area: "",
      latitude: pick.lat,
      longitude: pick.lng,
      photoUrl: MISSING_PERSON_PHOTOS[0].url,
    },
  });

  const wardId = roadForm.watch("wardId");
  const roadId = roadForm.watch("roadId");
  const issueType = roadForm.watch("type");
  const roadsInWard = getRoadsForWard(wardId);

  const applyRoadSnap = useCallback(
    (nextRoadId: string, fly = true) => {
      const road = getRoadById(nextRoadId);
      if (!road) return;
      roadForm.setValue("wardId", road.wardId);
      roadForm.setValue("roadId", road.id);
      const c = getRoadCentroid(road);
      roadForm.setValue("latitude", c.lat);
      roadForm.setValue("longitude", c.lng);
      if (fly) {
        queueMicrotask(() => {
          flyToLocation({ lat: c.lat, lng: c.lng, zoom: 16 });
          setSelectedRoadId(road.id);
        });
      } else {
        setSelectedRoadId(road.id);
      }
    },
    [roadForm, flyToLocation, setSelectedRoadId]
  );

  // Sync map pin → form coords (no store updates during render)
  useEffect(() => {
    if (!isReportDialogOpen || !reportPickLocation) return;
    const { lat, lng } = reportPickLocation;
    roadForm.setValue("latitude", lat);
    roadForm.setValue("longitude", lng);
    missingForm.setValue("latitude", lat);
    missingForm.setValue("longitude", lng);

    if (reportFormCategory === "ROAD") {
      const road = findNearestRoad(lat, lng);
      if (road) {
        roadForm.setValue("wardId", road.wardId);
        roadForm.setValue("roadId", road.id);
      }
    }
  }, [isReportDialogOpen, reportPickLocation, reportFormCategory]);

  // Reset when dialog opens
  useEffect(() => {
    if (!isReportDialogOpen) {
      openedRef.current = false;
      return;
    }
    if (!openedRef.current) {
      openedRef.current = true;
      setSubmitError(null);
      setReportLocationMode("ROAD");
      setMapLayer("roadHighlights", true);
      const id = roadForm.getValues("roadId");
      if (id) queueMicrotask(() => applyRoadSnap(id));
    }
  }, [isReportDialogOpen, setReportLocationMode, setMapLayer, roadForm, applyRoadSnap]);

  // Default images when issue type changes
  useEffect(() => {
    if (!isReportDialogOpen) return;
    const imgs = defaultRoadImages(issueType);
    roadForm.setValue("imageUrl", imgs.issueUrl);
    roadForm.setValue("beforeImageUrl", imgs.beforeUrl);
    roadForm.setValue("afterImageUrl", imgs.afterUrl);
  }, [issueType, isReportDialogOpen]);

  const pinPickActive =
    reportLocationMode === "PINPOINT" && !reportLocationPinned;

  const onWardChange = (id: string) => {
    setReportLocationMode("ROAD");
    setReportLocationPinned(false);
    setReportPickLocation(null);
    roadForm.setValue("wardId", id);
    const roads = getRoadsForWard(id);
    const first = roads[0];
    if (first) applyRoadSnap(first.id);
  };

  const onRoadSelect = (v: string) => {
    setReportLocationPinned(false);
    setReportLocationMode("ROAD");
    setReportPickLocation(null);
    applyRoadSnap(v);
  };

  const selectPinMode = () => {
    setReportLocationMode("PINPOINT");
    setReportLocationPinned(false);
    setReportPickLocation(null);
  };

  const selectRoadMode = () => {
    setReportLocationMode("ROAD");
    setReportLocationPinned(false);
    setReportPickLocation(null);
    setMapLayer("roadHighlights", true);
    const id = roadForm.getValues("roadId");
    if (id) applyRoadSnap(id);
  };

  const handleClose = useCallback(() => {
    setReportDialogOpen(false);
    setReportPickLocation(null);
    setReportLocationPinned(false);
    setReportLocationMode("ROAD");
    setSubmitError(null);
    roadForm.reset();
    missingForm.reset();
  }, [
    setReportDialogOpen,
    setReportPickLocation,
    setReportLocationPinned,
    setReportLocationMode,
    roadForm,
    missingForm,
  ]);

  const onRoadSubmit = useCallback(
    async (data: RoadFormData) => {
      setSubmitting(true);
      const road = getRoadById(data.roadId);
      const wardName = wardNameFromId(data.wardId);
      const roadName = road?.name ?? data.roadId;
      const payload = {
        type: data.type,
        category: "ROAD" as const,
        description: data.description?.trim() || null,
        latitude: data.latitude,
        longitude: data.longitude,
        wardId: data.wardId,
        wardName,
        roadId: data.roadId,
        roadName,
        imageUrl: data.imageUrl || null,
        beforeImageUrl: data.beforeImageUrl || data.imageUrl || null,
        afterImageUrl: data.afterImageUrl || null,
        reportLocationMode,
      };

      try {
        const res = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const report = await res.json();
        if (!res.ok) throw new Error(report.error ?? "Failed to submit");
        addReport(report);
        handleClose();
      } catch (e) {
        setSubmitError(e instanceof Error ? e.message : "Failed to submit report");
        console.error(e);
      } finally {
        setSubmitting(false);
      }
    },
    [addReport, reportLocationMode, handleClose]
  );

  const onMissingSubmit = useCallback(
    async (data: MissingFormData) => {
      setSubmitting(true);
      const payload = {
        ...data,
        photoUrl: data.photoUrl || MISSING_PERSON_PHOTOS[0].url,
        lastSeenAt: new Date().toISOString(),
        status: "ACTIVE" as const,
      };

      try {
        const res = await fetch("/api/missing-persons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to submit");
        const person = await res.json();
        addMissingPerson(person);
        setMapLayer("missingPersonsHeatmap", true);
        handleClose();
      } catch (e) {
        setSubmitError(e instanceof Error ? e.message : "Failed to submit alert");
        console.error(e);
      } finally {
        setSubmitting(false);
      }
    },
    [addMissingPerson, setMapLayer, handleClose]
  );

  const lat =
    reportFormCategory === "ROAD"
      ? roadForm.watch("latitude")
      : missingForm.watch("latitude");
  const lng =
    reportFormCategory === "ROAD"
      ? roadForm.watch("longitude")
      : missingForm.watch("longitude");

  const roadImageOptions = getIssueImages(issueType);
  const beforeImageOptions = getBeforeImages(issueType);
  const afterImageOptions = getAfterImages(issueType);

  if (!isReportDialogOpen) return null;

  return (
    <>
      {pinPickActive && (
        <div className="pointer-events-auto fixed inset-x-3 bottom-[4.75rem] z-50 flex gap-2 md:hidden">
          <Button variant="secondary" className="flex-1 shadow-lg" onClick={handleClose}>
            Cancel report
          </Button>
        </div>
      )}
      {!pinPickActive && (
        <button
          type="button"
          aria-label="Close report form"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={handleClose}
        />
      )}
      <div
      data-report-panel
      role="dialog"
      aria-labelledby="civic-report-title"
      className={cn(
        "pointer-events-auto z-50 overflow-y-auto border border-border bg-background p-4 shadow-2xl sm:p-5",
        "fixed inset-x-0 bottom-0 max-h-[min(88dvh,100%)] rounded-t-2xl pb-[max(1rem,env(safe-area-inset-bottom))]",
        "md:absolute md:inset-x-auto md:bottom-20 md:right-3 md:top-16 md:max-h-[calc(100vh-6rem)] md:w-96 md:rounded-xl md:pb-5",
        pinPickActive && "max-md:hidden"
      )}
    >
      <button
        type="button"
        className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100"
        onClick={handleClose}
        aria-label="Close report form"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex flex-col space-y-1.5 pr-8 text-left">
        <h2 id="civic-report-title" className="text-lg font-semibold leading-none tracking-tight">
          CivicEye report
        </h2>
        <p className="text-sm text-muted-foreground">
          Choose how to set location, then fill in details.
        </p>
      </div>

      {pinPickActive && (
        <div className="mt-3 rounded-lg border border-primary/50 bg-primary/10 px-3 py-2.5 text-sm text-foreground">
          <Crosshair className="mr-1.5 inline h-4 w-4 animate-pulse text-primary" />
          <strong>Click the map</strong> to place your pin — drag to pan, scroll to zoom.
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
          {(
            [
              { id: "ROAD" as ReportCategory, label: "Road issue", icon: Route },
              { id: "MISSING_PERSON" as ReportCategory, label: "Missing person", icon: UserSearch },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setReportFormCategory(id)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 text-sm font-medium transition-colors ${
                reportFormCategory === id
                  ? id === "ROAD"
                    ? "border-orange-500/60 bg-orange-500/10 text-orange-200"
                    : "border-violet-500/60 bg-violet-500/10 text-violet-200"
                  : "border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/60"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </div>

        {/* Step 1: How to set location */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Step 1 — Set location
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={selectPinMode}
              className={cn(
                "flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-colors",
                reportLocationMode === "PINPOINT"
                  ? "border-primary bg-primary/15 ring-2 ring-primary/25"
                  : "border-border bg-secondary/30 hover:bg-secondary/50"
              )}
            >
              <Crosshair className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-foreground">Pin on map</span>
              <span className="text-[11px] leading-snug text-muted-foreground">
                Then click the map to drop a pin at the exact spot
              </span>
            </button>
            <button
              type="button"
              onClick={selectRoadMode}
              className={cn(
                "flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-colors",
                reportLocationMode === "ROAD"
                  ? "border-amber-500/60 bg-amber-500/10 ring-2 ring-amber-500/25"
                  : "border-border bg-secondary/30 hover:bg-secondary/50"
              )}
            >
              <Route className="h-5 w-5 text-amber-400" />
              <span className="text-sm font-semibold text-foreground">Select road</span>
              <span className="text-[11px] leading-snug text-muted-foreground">
                Pick zone + road below — map jumps to that corridor
              </span>
            </button>
          </div>
        </div>

        <div
          className={cn(
            "rounded-lg border px-3 py-2.5 text-xs",
            reportLocationMode === "PINPOINT"
              ? reportLocationPinned
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                : "border-primary/40 bg-primary/10 text-foreground"
              : "border-amber-500/30 bg-amber-500/5 text-muted-foreground"
          )}
        >
          {reportLocationMode === "PINPOINT" ? (
            reportLocationPinned ? (
              <>
                <MapPin className="mr-1 inline h-3.5 w-3.5" />
                Pin set at {lat.toFixed(5)}, {lng.toFixed(5)} — click map again to move
              </>
            ) : (
              <>
                <Crosshair className="mr-1 inline h-3.5 w-3.5 animate-pulse" />
                <strong>Now click the map</strong> (visible on the left) to place your pin
              </>
            )
          ) : reportFormCategory === "ROAD" ? (
            <>
              <Route className="mr-1 inline h-3.5 w-3.5 text-amber-400" />
              Select <strong>Zone</strong> and <strong>Road corridor</strong> in the form below
            </>
          ) : (
            <>
              <MapPin className="mr-1 inline h-3.5 w-3.5" />
              Use <strong>Pin on map</strong> for last-seen location, or fill area name below
            </>
          )}
        </div>

        <p className="font-mono text-[10px] text-muted-foreground">
          {lat.toFixed(5)}, {lng.toFixed(5)}
          {reportLocationMode === "PINPOINT" || reportLocationPinned
            ? " · pinned point"
            : " · road corridor"}
        </p>

        {reportFormCategory === "ROAD" ? (
          <form
            onSubmit={roadForm.handleSubmit(onRoadSubmit)}
            className="flex flex-col gap-4"
          >
            <div
              className={cn(
                "grid grid-cols-2 gap-3 rounded-xl border-2 p-3 transition-colors",
                reportLocationMode === "ROAD"
                  ? "border-amber-500/50 bg-amber-500/5"
                  : "border-border/40 opacity-60"
              )}
            >
              <div className="space-y-2">
                <Label>Zone / Ward</Label>
                <Select value={wardId} onValueChange={onWardChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {NAGPUR_WARDS.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Road corridor</Label>
                <Select value={roadId} onValueChange={onRoadSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select road" />
                  </SelectTrigger>
                  <SelectContent>
                    {roadsInWard.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                        {r.accidentProne ? " ⚠" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Issue type</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => roadForm.setValue("type", opt.value)}
                    className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                      issueType === opt.value
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border bg-secondary/30 hover:bg-secondary/50"
                    }`}
                  >
                    <span className="mr-1">{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <textarea
                {...roadForm.register("description")}
                rows={2}
                placeholder="Lane, landmark, severity, traffic impact..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <PhotoField
              label="Issue photo (current damage)"
              stockOptions={roadImageOptions}
              value={roadForm.watch("imageUrl") ?? ""}
              onChange={(url) => {
                roadForm.setValue("imageUrl", url);
                if (!roadForm.getValues("beforeImageUrl")?.startsWith("data:")) {
                  roadForm.setValue("beforeImageUrl", url);
                }
              }}
              uploadHint="Take or upload a photo of the pothole / damage now."
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <PhotoField
                label="Before (damage)"
                stockOptions={beforeImageOptions}
                value={roadForm.watch("beforeImageUrl") ?? ""}
                onChange={(url) => roadForm.setValue("beforeImageUrl", url)}
                uploadHint="Upload how the road looks before repair."
              />
              <PhotoField
                label="After (road repair)"
                stockOptions={afterImageOptions}
                value={roadForm.watch("afterImageUrl") ?? ""}
                onChange={(url) => roadForm.setValue("afterImageUrl", url)}
                uploadHint="Upload expected finish or similar repaired road."
              />
            </div>

            {submitError && (
              <p className="text-sm text-destructive">{submitError}</p>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting…" : "Submit road report"}
              </Button>
            </div>
          </form>
        ) : (
          <form
            onSubmit={missingForm.handleSubmit(onMissingSubmit)}
            className="flex flex-col gap-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Full name</Label>
                <Input {...missingForm.register("name")} placeholder="Person's name" />
                {missingForm.formState.errors.name && (
                  <p className="text-xs text-destructive">
                    {missingForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Age</Label>
                <Input type="number" {...missingForm.register("age")} min={0} max={120} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select
                  value={missingForm.watch("gender")}
                  onValueChange={(v) => missingForm.setValue("gender", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Male", "Female", "Other", "Unknown"].map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Contact number</Label>
                <Input {...missingForm.register("contactNumber")} placeholder="Family / reporter" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Last seen area / landmark</Label>
              <Input {...missingForm.register("area")} placeholder="e.g. Sitabuldi Square, bus stop" />
            </div>

            <div className="space-y-2">
              <Label>Clothing & identifying marks</Label>
              <Input {...missingForm.register("clothing")} placeholder="Outfit, bag, accessories..." />
            </div>

            <div className="space-y-2">
              <Label>Details</Label>
              <textarea
                {...missingForm.register("description")}
                rows={3}
                placeholder="When last seen, direction of travel, medical needs, languages spoken..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {missingForm.formState.errors.description && (
                <p className="text-xs text-destructive">
                  {missingForm.formState.errors.description.message}
                </p>
              )}
            </div>

            <PhotoField
              label="Recent photo (for identification)"
              stockOptions={[...MISSING_PERSON_PHOTOS]}
              value={missingForm.watch("photoUrl") ?? ""}
              onChange={(url) => missingForm.setValue("photoUrl", url)}
              uploadHint="Upload a clear photo of the missing person."
            />

            {submitError && (
              <p className="text-sm text-destructive">{submitError}</p>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-violet-600 hover:bg-violet-700">
                {submitting ? "Submitting…" : "Submit missing-person alert"}
              </Button>
            </div>
          </form>
        )}
    </div>
    </>
  );
}
