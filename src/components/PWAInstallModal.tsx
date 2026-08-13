import React from 'react';
import {
  X,
  Smartphone,
  Share,
  PlusSquare,
  CheckCircle,
  WifiOff,
  Zap,
  Globe
} from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div
        id="pwa-install-modal"
        className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl shadow-black my-8 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-zinc-900 text-emerald-400 border border-zinc-800">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-100 tracking-tight">
                PWA & Offline Guide
              </h2>
              <p className="text-xs text-zinc-500 font-medium">
                Install on iOS Safari or Android for offline app experience
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* iOS Safari Instructions */}
          <div className="p-5 bg-zinc-800/40 rounded-2xl border border-zinc-800 space-y-3.5">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              iPhone & iPad (Safari) Instructions
            </h3>

            <div className="space-y-3 text-xs text-zinc-300">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  Tap the <strong className="text-emerald-400">Share</strong> icon (<Share className="w-3.5 h-3.5 inline mx-1 text-blue-400" />) in Safari's bottom toolbar.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  Scroll down the share sheet and tap <strong className="text-zinc-100 flex items-center gap-1 mt-0.5"><PlusSquare className="w-3.5 h-3.5 text-emerald-400 inline" /> Add to Home Screen</strong>.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  Tap <strong className="text-emerald-400">Add</strong> in the top-right corner. The app will launch in standalone fullscreen mode without browser URL bars!
                </div>
              </div>
            </div>
          </div>

          {/* Offline Capabilities Card */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-4 bg-zinc-800/40 rounded-2xl border border-zinc-800 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <WifiOff className="w-4 h-4" />
                <span>100% Offline</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                IndexedDB stores all logs securely on this device without requiring internet.
              </p>
            </div>

            <div className="p-4 bg-zinc-800/40 rounded-2xl border border-zinc-800 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-blue-400 font-bold">
                <Zap className="w-4 h-4" />
                <span>Instant Load</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                Service Worker caches static assets for lightning-fast sub-second cold starts.
              </p>
            </div>
          </div>

          {/* GitHub Pages Host Info */}
          <div className="p-3.5 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center gap-2.5 text-xs text-zinc-400 font-medium">
            <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Static SPA architecture ready for GitHub Pages or standalone container deployment.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
