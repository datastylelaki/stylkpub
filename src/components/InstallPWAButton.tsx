"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Check } from "lucide-react";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallPWAButtonProps {
    minimal?: boolean;
}

export function InstallPWAButton({ minimal = false }: InstallPWAButtonProps) {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia("(display-mode: standalone)").matches) {
            setIsInstalled(true);
            return;
        }

        // Listen for install prompt
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        window.addEventListener("beforeinstallprompt", handler);

        // Check if app was just installed
        window.addEventListener("appinstalled", () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
            toast.success("Aplikasi berhasil diinstall! 🎉");
        });

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            toast.error("Browser tidak support PWA install atau sudah terinstall.");
            return;
        }

        // Show install prompt
        deferredPrompt.prompt();

        // Wait for user choice
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
            toast.success("Aplikasi sedang diinstall...");
        } else {
            toast.info("Install dibatalkan.");
        }

        setDeferredPrompt(null);
    };

    if (isInstalled) {
        if (minimal) return null; // Don't show anything in header if installed

        return (
            <Button disabled className="w-full bg-green-600 text-white">
                <Check className="mr-2 h-4 w-4" />
                Aplikasi Sudah Terinstall
            </Button>
        );
    }

    if (!deferredPrompt) {
        return null; // Don't show button if can't install
    }

    if (minimal) {
        return (
            <Button
                variant="ghost"
                size="icon"
                onClick={handleInstallClick}
                className="text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                title="Download Aplikasi (PWA)"
            >
                <Download className="h-5 w-5" />
            </Button>
        );
    }

    return (
        <Button
            onClick={handleInstallClick}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold"
        >
            <Download className="mr-2 h-4 w-4" />
            Download Aplikasi (PWA)
        </Button>
    );
}
