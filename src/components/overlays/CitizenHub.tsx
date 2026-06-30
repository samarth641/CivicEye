"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Mic,
  MicOff,
  UploadCloud,
  FileImage,
  Award,
  Flame,
  User,
  CheckCircle,
  Scan,
  TrendingUp,
} from "lucide-react";

export function CitizenHub() {
  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const recognitionRef = useRef<any>(null);

  // AI Scanner state
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);

  const startVoiceRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Fallback: simulate voice typing
      setIsListening(true);
      setVoiceText("Listening...");
      setTimeout(() => {
        setVoiceText(
          "Large pothole reported near Dharampeth metro station. Severe traffic congestion is forming."
        );
        setIsListening(false);
      }, 3000);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-IN";

    rec.onstart = () => {
      setIsListening(true);
      setVoiceText("Listening... Speak now.");
    };

    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setVoiceText(text);
    };

    rec.onerror = (e: any) => {
      console.error(e);
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;
    rec.start();
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    } else {
      setIsListening(false);
    }
  };

  // Handle Mock Image Upload & Scan
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setScanImage(url);
    setScanning(true);
    setScanResult(null);

    // Simulate AI scan after 2 seconds
    setTimeout(() => {
      setScanning(false);
      setScanResult({
        class: "POTHOLE",
        confidence: 98.4,
        severity: "HIGH (8.7/10)",
        cost: "₹15,000",
        dept: "Public Works Department",
      });
    }, 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 p-6 h-[calc(100vh-80px)] overflow-y-auto">
      {/* Left Columns: Citizen reporting terminal */}
      <div className="lg:col-span-3 flex flex-col gap-6">
        {/* Voice Reporting terminal */}
        <Card className="bg-card border-border backdrop-blur text-foreground">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
              <Mic className="h-4 w-4" /> AI Voice Reporting Terminal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Report issues hands-free using your voice. Our AI will automatically transcribe and geocode the details.
            </p>

            <div className="flex items-center gap-4">
              <Button
                onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
                variant={isListening ? "destructive" : "default"}
                size="lg"
                className="rounded-full h-14 w-14 shrink-0 shadow-lg flex items-center justify-center relative animate-pulse"
              >
                {isListening ? (
                  <MicOff className="h-6 w-6" />
                ) : (
                  <Mic className="h-6 w-6" />
                )}
                {isListening && (
                  <span className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping opacity-75" />
                )}
              </Button>

              <div className="flex-1 rounded-xl border border-border bg-secondary p-4 min-h-[56px] text-xs font-mono text-foreground/90">
                {voiceText || "Click the microphone and describe the issue (e.g. 'Large pothole on Wardha Road near the bus stand')."}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Image Scan Terminal */}
        <Card className="bg-card border-border backdrop-blur text-foreground flex-1 flex flex-col">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
              <Scan className="h-4 w-4" /> Real-time AI Image Classifier
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 flex flex-col justify-center">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Upload an image of a civic issue. Our computer vision model will categorize it, estimate repair costs, and detect duplicates.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 items-stretch">
              {/* Upload box */}
              <div className="border-2 border-dashed border-border hover:border-neutral-700 bg-secondary/50 rounded-xl p-6 flex flex-col items-center justify-center text-center relative cursor-pointer group min-h-[200px]">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {scanImage ? (
                  <div className="relative h-full w-full max-h-[160px] rounded-lg overflow-hidden border border-border">
                    <img src={scanImage} alt="Uploaded Issue" className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <>
                    <UploadCloud className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-xs text-foreground/80 font-semibold mt-2.5">
                      Select or drop image
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      Supports JPG, PNG (Max 5MB)
                    </span>
                  </>
                )}
              </div>

              {/* Scan analysis box */}
              <div className="rounded-xl border border-border bg-secondary/30 p-4 flex flex-col justify-center">
                {scanning && (
                  <div className="text-center space-y-3">
                    <FileImage className="h-8 w-8 text-primary animate-bounce mx-auto" />
                    <p className="text-xs font-semibold text-primary">Running AI Computer Vision Models...</p>
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div className="bg-primary h-1.5 rounded-full animate-[progress_2s_ease-in-out_infinite]" style={{ width: "70%" }} />
                    </div>
                  </div>
                )}

                {!scanning && !scanResult && (
                  <p className="text-xs text-muted-foreground text-center italic">
                    Upload an image to start the real-time AI classification scan.
                  </p>
                )}

                {!scanning && scanResult && (
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1">
                      <CheckCircle className="h-4 w-4" /> AI CLASSIFICATION COMPLETE
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-t border-neutral-900 pt-2 font-mono">
                      <div>
                        <span className="text-muted-foreground text-xs uppercase">Detected Object</span>
                        <p className="font-semibold text-foreground mt-0.5">{scanResult.class}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs uppercase">Confidence</span>
                        <p className="font-semibold text-foreground mt-0.5">{scanResult.confidence}%</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs uppercase">Estimated Severity</span>
                        <p className="font-semibold text-foreground mt-0.5">{scanResult.severity}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs uppercase">Est. Repair Cost</span>
                        <p className="font-semibold text-foreground mt-0.5">{scanResult.cost}</p>
                      </div>
                      <div className="col-span-2 border-t border-neutral-900 pt-2">
                        <span className="text-muted-foreground text-xs uppercase">Department Routing</span>
                        <p className="font-semibold text-primary mt-0.5">{scanResult.dept}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Columns: Gamification & Leaderboard */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        {/* Profile Stats card */}
        <Card className="bg-card border-border backdrop-blur text-foreground">
          <CardContent className="p-5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full border border-border bg-secondary flex items-center justify-center text-primary font-bold text-lg">
                SV
              </div>
              <div className="flex-1">
                <span className="text-xs uppercase tracking-wider font-bold text-primary">
                  LEVEL 12 CIVIC GUARDIAN
                </span>
                <h3 className="font-bold text-base text-foreground mt-0.5">
                  Samarth Verulkar
                </h3>
              </div>
              <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full text-xs font-bold shrink-0">
                <Flame className="h-3.5 w-3.5 fill-amber-400/20" /> 5-Day Streak
              </div>
            </div>

            {/* XP progress bar */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5 text-muted-foreground">
                <span>XP Progress</span>
                <span className="font-mono text-foreground font-semibold">4,200 / 5,000 XP</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div className="bg-primary h-2 rounded-full" style={{ width: "84%" }} />
              </div>
            </div>

            {/* Badges Grid */}
            <div className="border-t border-border pt-3.5">
              <span className="text-xs uppercase text-muted-foreground font-bold tracking-wider block mb-2">
                Unlocked Badges
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-border bg-secondary p-2 text-center flex flex-col items-center">
                  <Award className="h-6 w-6 text-yellow-400 mb-1" />
                  <span className="text-xs font-bold text-foreground">Pothole Patrol</span>
                  <span className="text-xs text-muted-foreground mt-0.5">5 reports</span>
                </div>
                <div className="rounded-lg border border-border bg-secondary p-2 text-center flex flex-col items-center">
                  <Award className="h-6 w-6 text-primary mb-1" />
                  <span className="text-xs font-bold text-foreground">First Responder</span>
                  <span className="text-xs text-muted-foreground mt-0.5">SLA catalyst</span>
                </div>
                <div className="rounded-lg border border-border bg-secondary p-2 text-center flex flex-col items-center">
                  <Award className="h-6 w-6 text-emerald-400 mb-1" />
                  <span className="text-xs font-bold text-foreground">City Guard</span>
                  <span className="text-xs text-muted-foreground mt-0.5">10 verified</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard card */}
        <Card className="bg-card border-border backdrop-blur text-foreground flex-1 flex flex-col">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> CivicEye Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 space-y-3 font-sans">
            <div className="flex items-center justify-between text-xs border-b border-border pb-2 text-muted-foreground">
              <span>Rank / Citizen</span>
              <span>XP Level</span>
            </div>
            {/* Rank 1 */}
            <div className="flex items-center justify-between text-xs py-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-yellow-500">#1</span>
                <span className="font-semibold text-foreground">Anjali Sharma</span>
              </div>
              <span className="font-mono text-primary font-bold">12,400 XP</span>
            </div>
            {/* Rank 2 */}
            <div className="flex items-center justify-between text-xs py-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-muted-foreground">#2</span>
                <span className="font-semibold text-foreground">Vikram Deshmukh</span>
              </div>
              <span className="font-mono text-primary font-bold">9,800 XP</span>
            </div>
            {/* Rank 3 */}
            <div className="flex items-center justify-between text-xs py-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-amber-600">#3</span>
                <span className="font-semibold text-foreground">Priya Patel</span>
              </div>
              <span className="font-mono text-primary font-bold">8,200 XP</span>
            </div>
            {/* User Rank */}
            <div className="flex items-center justify-between text-xs py-2 border-t border-border/80 mt-2 bg-primary/10 rounded-lg px-2 border border-primary/20">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-primary">#14</span>
                <span className="font-semibold text-foreground">Samarth Verulkar (You)</span>
              </div>
              <span className="font-mono text-primary font-bold">4,200 XP</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
