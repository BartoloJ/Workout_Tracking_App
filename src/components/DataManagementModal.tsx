import React, { useState, useRef } from 'react';
import {
  X,
  Download,
  Upload,
  Database,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Sparkles,
  FileJson
} from 'lucide-react';
import { exportDatabaseJSON, importDatabaseJSON, seedSampleWorkouts, db } from '../db';
import { ExportDataPayload } from '../types';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  isOpen,
  onClose,
  onDataChanged
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // JSON Export Handler
  const handleExportJSON = async () => {
    setIsExporting(true);
    setImportStatus(null);
    setImportError(null);
    try {
      const payload = await exportDatabaseJSON();
      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const todayStr = new Date().toISOString().split('T')[0];

      const a = document.createElement('a');
      a.href = url;
      a.download = `WorkoutTrackerDB-backup-${todayStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setImportStatus(`Exported ${payload.workouts.length} workouts to backup file successfully!`);
    } catch (err: any) {
      console.error('Export failed:', err);
      setImportError(`Export error: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  // JSON Import File Picker Handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsImporting(true);
    setImportStatus(null);
    setImportError(null);

    try {
      const text = await file.text();
      const data: ExportDataPayload = JSON.parse(text);

      if (!data || !Array.isArray(data.workouts)) {
        throw new Error('Invalid JSON structure: missing workouts array.');
      }

      const result = await importDatabaseJSON(data, false);
      setImportStatus(`Successfully restored ${result.importedCount} workouts from backup!`);
      onDataChanged();
    } catch (err: any) {
      console.error('Import failed:', err);
      setImportError(`Failed to import file: ${err?.message || 'Invalid JSON syntax'}`);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Seed sample demo data
  const handleSeed = async () => {
    if (window.confirm('Generate 60 days of realistic sample workouts (PPL, Zone 2 runs, hybrids)? This will replace current records.')) {
      setIsSeeding(true);
      setImportStatus(null);
      setImportError(null);
      try {
        await seedSampleWorkouts();
        setImportStatus('Generated 45+ sample workouts across the last 60 days!');
        onDataChanged();
      } catch (err: any) {
        setImportError(`Seed error: ${err.message}`);
      } finally {
        setIsSeeding(false);
      }
    }
  };

  // Clear all data
  const handleClear = async () => {
    if (window.confirm('WARNING: Are you sure you want to completely erase all workouts and logs from this device? This cannot be undone.')) {
      try {
        await db.workouts.clear();
        await db.exercise_logs.clear();
        await db.cardio_logs.clear();
        setImportStatus('All workout logs cleared.');
        onDataChanged();
      } catch (err: any) {
        setImportError(`Clear error: ${err.message}`);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div
        id="data-management-modal"
        className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl shadow-black my-8 flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-zinc-900 text-emerald-400 border border-zinc-800">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-100 tracking-tight">
                Data Management & Backup
              </h2>
              <p className="text-xs text-zinc-500 font-medium">
                Local IndexedDB offline safety and export/import
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

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Status / Feedback Alerts */}
          {importStatus && (
            <div className="p-4 bg-emerald-950/80 border border-emerald-800 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-300 font-medium">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{importStatus}</span>
            </div>
          )}

          {importError && (
            <div className="p-4 bg-rose-950/80 border border-rose-800 rounded-2xl flex items-center gap-2.5 text-xs text-rose-300 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{importError}</span>
            </div>
          )}

          {/* Section 1: JSON Export */}
          <div className="p-5 bg-zinc-800/40 rounded-2xl border border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-zinc-100">
                  Export JSON Backup
                </h3>
              </div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Downloads a full offline backup of all workouts, strength sets, cardio logs, and intensity ratings to a <code className="text-emerald-400 font-mono">.json</code> file.
            </p>
            <button
              id="export-json-btn"
              onClick={handleExportJSON}
              disabled={isExporting}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs transition-colors touch-press shadow-md shadow-emerald-950/40"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>{isExporting ? 'Exporting IndexedDB...' : 'Download JSON Backup (.json)'}</span>
            </button>
          </div>

          {/* Section 2: JSON Import */}
          <div className="p-5 bg-zinc-800/40 rounded-2xl border border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-sm text-zinc-100">
                  Restore from JSON
                </h3>
              </div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Select a previously exported JSON backup file to merge or restore your complete workout dataset.
            </p>
            
            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
              id="json-file-input"
            />

            <button
              id="import-json-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-bold rounded-xl text-xs transition-colors touch-press"
            >
              <Upload className="w-4 h-4" />
              <span>{isImporting ? 'Reading & Validating JSON...' : 'Select JSON File to Restore'}</span>
            </button>
          </div>

          {/* Section 3: Seed Sample Demo Data */}
          <div className="p-5 bg-zinc-800/40 rounded-2xl border border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-zinc-100">
                  Seed Demo Workout History
                </h3>
              </div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Populates realistic strength, Zone 2 running, and hybrid workouts for the past 60 days to see the green GitHub activity heat-map alive.
            </p>
            <button
              id="seed-demo-history-btn"
              onClick={handleSeed}
              disabled={isSeeding}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-amber-400 font-bold rounded-xl text-xs transition-colors touch-press"
            >
              <RefreshCw className={`w-4 h-4 ${isSeeding ? 'animate-spin' : ''}`} />
              <span>{isSeeding ? 'Seeding IndexedDB...' : 'Generate 60-Day Sample Workouts'}</span>
            </button>
          </div>

          {/* Section 4: Clear Data */}
          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-zinc-500 font-medium">Need a fresh start?</span>
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 rounded-xl transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Database</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
