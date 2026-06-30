"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Key, Copy, Check, ExternalLink, ChevronRight, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMapStore } from "@/lib/store";

const MESSAGES = {
  quota: {
    title: "Google Maps quota exceeded",
    body: "Your API key hit its free-tier or billing limit (OverQuotaMapError). Enable billing in Google Cloud or use the free OpenStreetMap fallback below.",
    code: "OverQuotaMapError",
  },
  billing: {
    title: "Google Maps billing required",
    body: "Billing is not enabled on your Google Cloud project. Enable billing or continue with OpenStreetMap.",
    code: "BillingNotEnabledMapError",
  },
  key: {
    title: "Google Maps API key issue",
    body: "The API key is invalid or expired.",
    code: "ExpiredKeyMapError",
  },
  api: {
    title: "Google Maps unavailable",
    body: "Google Maps could not load. Check API enablement and key restrictions in Google Cloud Console.",
    code: "MapError",
  },
  config: {
    title: "Using OpenStreetMap",
    body: "Google Maps is disabled in your environment (or no valid key is set). The app uses Leaflet/OpenStreetMap instead.",
    code: null,
  },
} as const;

export function MapErrorOverlay() {
  const mapFallbackReason = useMapStore((s) => s.mapFallbackReason);
  const [isOpen, setIsOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const info = MESSAGES[mapFallbackReason ?? "api"];

  const envTemplate = `# Use free OpenStreetMap (recommended if Google quota exceeded)
NEXT_PUBLIC_MAP_PROVIDER=leaflet

# Or fix Google Maps:
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="YOUR_ACTUAL_API_KEY"
NEXT_PUBLIC_GOOGLE_MAP_ID="YOUR_MAP_ID"`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(envTemplate);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="absolute bottom-4 right-4 z-30 max-w-sm sm:max-w-md font-sans">
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="rounded-2xl border border-destructive/20 bg-background/90 p-5 shadow-2xl backdrop-blur-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <h3 className="font-semibold tracking-tight text-foreground">
                  {info.title}
                </h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                onClick={() => setIsOpen(false)}
                aria-label="Close configuration panel"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
              {info.body}
              {info.code && (
                <>
                  {" "}
                  (<code className="rounded bg-muted px-1 py-0.5 text-destructive font-mono text-[10px]">{info.code}</code>)
                </>
              )}
            </p>

            <div className="mt-3 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2 flex items-start gap-2.5 text-xs text-primary-foreground">
              <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <div className="text-foreground">
                <span className="font-medium text-primary">Fallback Activated:</span> The app is running on <strong className="text-primary font-semibold">OpenStreetMap (Leaflet)</strong> so you can continue testing all features offline/locally.
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                How to set up your API Key:
              </h4>
              <ol className="space-y-2 text-xs text-muted-foreground">
                <li className="flex gap-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">
                    1
                  </span>
                  <span>
                    Create a project on the{" "}
                    <a
                      href="https://console.cloud.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 font-medium text-primary underline underline-offset-2 hover:text-primary/80"
                    >
                      Google Cloud Console <ExternalLink className="h-3 w-3 inline" />
                    </a>
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">
                    2
                  </span>
                  <span>
                    Enable the <strong>Maps JavaScript API</strong>, <strong>Places API</strong>, and <strong>Geocoding API</strong>.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">
                    3
                  </span>
                  <span>
                    Create an API Key and update your <code className="rounded bg-muted px-1 font-mono text-[10px]">.env</code> file.
                  </span>
                </li>
              </ol>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground">Environment Config:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[11px] font-medium gap-1 text-primary hover:bg-primary/10 hover:text-primary"
                  onClick={copyToClipboard}
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" /> Copy config
                    </>
                  )}
                </Button>
              </div>
              <pre className="overflow-x-auto rounded-lg border bg-muted/50 p-3 text-[10px] font-mono text-muted-foreground leading-normal">
                {envTemplate}
              </pre>
            </div>

            <div className="mt-4 flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs hover:bg-muted"
                onClick={() => setIsOpen(false)}
              >
                Explore Fallback Map
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-2 rounded-full px-4 py-2.5 shadow-xl border border-destructive/20 bg-background hover:bg-accent text-foreground transition-all duration-300"
            >
              <Key className="h-4 w-4 text-destructive animate-pulse" />
              <span className="text-xs font-semibold">Map API Configuration</span>
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
