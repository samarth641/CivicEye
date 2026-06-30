"use client";



import { motion, AnimatePresence } from "framer-motion";

import { useMapStore } from "@/lib/store";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { X, ExternalLink, Newspaper, Route, MapPin } from "lucide-react";

import type { ReportType } from "@/types";



const TYPE_LABELS: Record<ReportType, string> = {

  POTHOLE: "Pothole",

  SPEED_BREAKER: "Speed breaker",

  ROAD_DAMAGE: "Road damage",

  OTHER: "Other",

};



const TYPE_ICONS: Record<ReportType, string> = {

  POTHOLE: "🕳",

  SPEED_BREAKER: "〰",

  ROAD_DAMAGE: "⚠",

  OTHER: "✦",

};



export function ReportPopup() {

  const {

    reports,

    news,

    selectedReportId,

    selectedNewsId,

    setSelectedReportId,

    setSelectedNewsId,

    setDetailsModalOpen,

  } = useMapStore();



  const report = selectedReportId

    ? reports.find((r) => r.id === selectedReportId)

    : null;

  const newsItem = selectedNewsId

    ? news.find((n) => n.id === selectedNewsId)

    : null;



  const onClose = () => {

    setSelectedReportId(null);

    setSelectedNewsId(null);

  };



  const thumb =

    report?.imageUrl ||

    report?.beforeImageUrl ||

    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop";



  return (

    <AnimatePresence>

      {newsItem && (

        <motion.div

          key={`news-${newsItem.id}`}

          initial={{ opacity: 0, y: 10 }}

          animate={{ opacity: 1, y: 0 }}

          exit={{ opacity: 0, y: 10 }}

          className="absolute bottom-6 left-1/2 z-20 w-full max-w-sm -translate-x-1/2 px-4"

        >

          <Card className="overflow-hidden border-border bg-card shadow-2xl">

            {newsItem.imageUrl && (

              <div className="aspect-video w-full overflow-hidden bg-muted">

                <img

                  src={newsItem.imageUrl}

                  alt=""

                  className="h-full w-full object-cover"

                />

              </div>

            )}

            <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">

              <div className="flex items-center gap-2">

                <Newspaper className="h-4 w-4 text-[#2563eb]" />

                <div>

                <p className="font-semibold text-foreground">{newsItem.title}</p>

                <p className="text-xs text-muted-foreground">

                    {new Date(newsItem.publishedAt).toLocaleDateString("en-IN", {

                      dateStyle: "medium",

                    })}

                  </p>

                </div>

              </div>

              <Button

                variant="ghost"

                size="icon"

                onClick={onClose}

                className="h-8 w-8 shrink-0"

                aria-label="Close"

              >

                <X className="h-4 w-4" />

              </Button>

            </CardHeader>

            <CardContent className="pt-0">

              <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">

                {newsItem.body}

              </p>

              {newsItem.sourceUrl && (

                <a

                  href={newsItem.sourceUrl}

                  target="_blank"

                  rel="noopener noreferrer"

                  className="mt-2 inline-flex items-center gap-1 text-xs text-[#2563eb] hover:underline"

                >

                  Read more <ExternalLink className="h-3 w-3" />

                </a>

              )}

            </CardContent>

          </Card>

        </motion.div>

      )}

      {report && !newsItem && (

        <motion.div

          key={`report-${report.id}`}

          initial={{ opacity: 0, y: 10 }}

          animate={{ opacity: 1, y: 0 }}

          exit={{ opacity: 0, y: 10 }}

          className="absolute bottom-6 left-1/2 z-20 w-full max-w-sm -translate-x-1/2 px-4"

        >

          <Card className="overflow-hidden border-2 border-orange-500/20 bg-card shadow-2xl">

            <div className="aspect-video w-full overflow-hidden bg-muted">

              <img src={thumb} alt="" className="h-full w-full object-cover" />

            </div>

            <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">

              <div>

                <div className="mb-1 flex flex-wrap items-center gap-2">

                  <span className="rounded-md border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-orange-300">

                    Road issue

                  </span>

                  {report.locationMode === "PINPOINT" && (

                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">

                      <MapPin className="h-3 w-3" />

                      Pinned

                    </span>

                  )}

                </div>

                <p className="flex items-center gap-1.5 font-semibold text-primary">

                  <span>{TYPE_ICONS[report.type]}</span>

                  {TYPE_LABELS[report.type]}

                </p>

                {report.roadName && (

                  <p className="flex items-center gap-1 text-xs text-muted-foreground">

                    <Route className="h-3 w-3" />

                    {report.roadName}

                  </p>

                )}

                <p className="text-xs text-muted-foreground">

                  {new Date(report.createdAt).toLocaleDateString("en-IN", {

                    dateStyle: "medium",

                  })}

                </p>

              </div>

              <Button

                variant="ghost"

                size="icon"

                onClick={onClose}

                className="h-8 w-8 shrink-0"

                aria-label="Close"

              >

                <X className="h-4 w-4" />

              </Button>

            </CardHeader>

            <CardContent className="pt-0">

              {report.description && (

                <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">

                  {report.description}

                </p>

              )}

              {(report.beforeImageUrl || report.afterImageUrl) && (

                <div className="mt-2 flex gap-2">

                  {report.beforeImageUrl && (

                    <div className="flex-1">

                      <p className="mb-1 text-[10px] font-semibold uppercase text-red-400">Before</p>

                      <img

                        src={report.beforeImageUrl}

                        alt="Before"

                        className="aspect-video w-full rounded-md object-cover"

                      />

                    </div>

                  )}

                  {report.afterImageUrl && (

                    <div className="flex-1">

                      <p className="mb-1 text-[10px] font-semibold uppercase text-emerald-400">After</p>

                      <img

                        src={report.afterImageUrl}

                        alt="After"

                        className="aspect-video w-full rounded-md object-cover"

                      />

                    </div>

                  )}

                </div>

              )}

              <p className="mt-2 text-xs text-muted-foreground">

                Status: {report.status.replace("_", " ")}

              </p>

              <Button

                onClick={() => setDetailsModalOpen(true)}

                className="mt-3 h-9 w-full text-xs font-semibold"

              >

                Open AI Command Panel

              </Button>

            </CardContent>

          </Card>

        </motion.div>

      )}

    </AnimatePresence>

  );

}

