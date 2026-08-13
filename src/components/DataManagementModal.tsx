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
  FileJson,
  Cloud,
  CloudUpload,
  CloudDownload,
  LogOut
} from 'lucide-react';
import { exportDatabaseJSON, importDatabaseJSON, seedSampleWorkouts, db } from '../db';
import { useGoogleAuth } from '../contexts/GoogleAuthContext';
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
  const {
    isAuthenticated,
    userEmail,
    lastBackup,
    isSyncing,
    autoSyncEnabled,
    toggleAutoSync,
    signIn,
    signOut,
    backupNow,
    restoreNow
  } = useGoogleAuth();

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCloudBackup = async () => {
    setImportStatus(null);
    setImportError(null);
    try {
      await backupNow();
      setImportStatus('Successfully saved backup to your Google Drive App Data folder!');
    } catch (err: any) {
      setImportError(`Cloud backup failed: ${err.message}`);
    }
  };

  const handleCloudRestore = async () => {
    if (window.confirm('Restore workouts from your Google Drive backup? This will merge them with your current data.')) {
      setImportStatus(null);
      setImportError(null);
      try {
        const count = await restoreNow(false);
        setImportStatus(`Successfully restored ${count} workouts from Google Drive!`);
        onDataChanged();
      } catch (err: any) {
        setImportError(`Cloud restore failed: ${err.message}`);
      }
    }
  };

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
        throw new Error('File does not match WorkoutTracker JSON format.');
      }

      const res = await importDatabaseJSON(data, false);
      setImportStatus(`Successfully imported & merged ${res.importedCount} workouts!`);
      onDataChanged();
    } catch (err: any) {
      console.error('Import failed:', err);
      setImportError(`Import failed: ${err?.message || 'Invalid JSON file structure'}`);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Sample data seed
  const handleSeed = async () => {
    if (window.confirm('Populate 45+ sample workouts for the last 60 days?')) {
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

  const formatTime = (isoString?: string) => {
    if (!isoString) return 'Never';
    return new Date(isoString).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
                Backup & Data Sync
              </h2>
              <p className="text-xs text-zinc-500 font-medium">
                Google Drive cloud sync & local file backup
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
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
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

          {/* Section: Google Drive Cloud Backup */}
          <div className="p-5 bg-gradient-to-br from-sky-950/40 via-zinc-900 to-zinc-900 rounded-2xl border border-sky-500/30 space-y-3.5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-sm text-zinc-100">
                  Google Drive Cloud Backup
                </h3>
              </div>
              {isAuthenticated && (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Connected
                </span>
              )}
            </div>

            {!isAuthenticated ? (
              <div className="space-y-3">
                <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                  Connect your Google account to automatically store silent backups in your private Google Drive app storage, making it seamless to restore your workout history across any phone or computer.
                </p>
                <button
                  onClick={signIn}
                  className="w-full py-3 px-4 bg-white hover:bg-zinc-100 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2.5 shadow-md active:scale-98 transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Connect Google Drive</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800">
                  <div className="truncate text-zinc-300 font-medium">
                    {userEmail || 'Google Account Connected'}
                  </div>
                  <button
                    onClick={signOut}
                    className="text-zinc-500 hover:text-rose-400 text-[11px] flex items-center gap-1 transition-colors ml-2"
                  >
                    <LogOut className="w-3 h-3" />
                    Disconnect
                  </button>
                </div>

                <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 text-[11px] text-zinc-400 space-y-2">
                  <div className="flex justify-between">
                    <span>Last Cloud Backup:</span>
                    <span className="text-zinc-200 font-mono">
                      {formatTime(lastBackup?.modifiedTime || localStorage.getItem('google_drive_last_sync') || undefined)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
                    <span>Auto-backup after logging workouts:</span>
                    <button
                      onClick={toggleAutoSync}
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-lg transition-all ${
                        autoSyncEnabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {autoSyncEnabled ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleCloudBackup}
                    disabled={isSyncing}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-sky-950/50 disabled:opacity-50"
                  >
                    <CloudUpload className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
                    <span>{isSyncing ? 'Syncing...' : 'Backup Now'}</span>
                  </button>

                  <button
                    onClick={handleCloudRestore}
                    disabled={isSyncing}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-zinc-950 hover:bg-zinc-800 border border-zinc-750 text-zinc-200 font-bold rounded-xl text-xs transition-all disabled:opacity-50"
                  >
                    <CloudDownload className="w-4 h-4 text-sky-400" />
                    <span>Restore Cloud</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section: JSON Export */}
          <div className="p-5 bg-zinc-800/40 rounded-2xl border border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-zinc-100">
                  Export Local File (.json)
                </h3>
              </div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Downloads an offline copy of all workouts, strength sets, and cardio logs to your device.
            </p>
            <button
              id="export-json-btn"
              onClick={handleExportJSON}
              disabled={isExporting}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs transition-colors touch-press shadow-md shadow-emerald-950/40"
            >
              <Download className="w-4 h-4 stroke-[2.5]" />
              <span>{isExporting ? 'Exporting IndexedDB...' : 'Download JSON Backup'}</span>
            </button>
          </div>

          {/* Section: JSON Import */}
          <div className="p-5 bg-zinc-800/40 rounded-2xl border border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-sm text-zinc-100">
                  Restore from Local File
                </h3>
              </div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              Select a previously downloaded JSON backup file to merge or restore your complete workout dataset.
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
              <span>{isImporting ? 'Reading & Validating JSON...' : 'Select File to Restore'}</span>
            </button>
          </div>

          {/* Section: Seed Sample Demo Data */}
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
              Populates sample workouts for the past 60 days to see the green activity heat-map in action.
            </p>
            <button
              id="seed-demo-history-btn"
              onClick={handleSeed}
              disabled={isSeeding}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-amber-400 font-bold rounded-xl text-xs transition-colors touch-press"
            >
              <RefreshCw className={`w-4 h-4 ${isSeeding ? 'animate-spin' : ''}`} />
              <span>{isSeeding ? 'Seeding IndexedDB...' : 'Generate Sample Workouts'}</span>
            </button>
          </div>

          {/* Section: Clear Data */}
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
