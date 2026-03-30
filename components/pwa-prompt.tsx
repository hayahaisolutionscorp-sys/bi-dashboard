"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PWAPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      // Update UI notify the user they can install the PWA
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // If the app is already installed, we shouldn't show this.
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isStandalone) {
      setShowPrompt(false);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    await deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    await deferredPrompt.userChoice;
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 lg:hidden">
      <div className="bg-background border rounded-lg shadow-lg p-4 flex items-center gap-4 max-w-sm relative">
        <button 
          onClick={() => setShowPrompt(false)}
          className="absolute -top-2 -right-2 bg-background border rounded-full p-1 text-muted-foreground hover:text-foreground shadow-sm"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="shrink-0 bg-white rounded flex items-center justify-center p-1 border">
          <Image 
            src="/images/logo/hayahai_logo_v2_nodp_nopropeller_final_300px.png"
            alt="App Logo"
            width={40}
            height={40}
            className="rounded object-contain"
          />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Download App</h3>
          <p className="text-xs text-muted-foreground leading-snug mt-0.5">Install Ayahay BI on your device for quick access.</p>
        </div>
        <div className="flex items-center gap-2 pl-3 border-l">
          <Button size="sm" onClick={handleInstallClick} className="flex gap-2 w-full justify-center">
            <Download className="w-4 h-4" />
            Install
          </Button>
        </div>
      </div>
    </div>
  );
}
