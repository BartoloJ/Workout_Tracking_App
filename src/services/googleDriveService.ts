import { exportDatabaseJSON, importDatabaseJSON } from '../db';
import { ExportDataPayload } from '../types';

const BACKUP_FILENAME = 'workout_tracker_cloud_backup.json';
const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';

export interface DriveBackupInfo {
  id: string;
  name: string;
  modifiedTime: string;
  size?: string;
}

export async function findDriveBackupFile(accessToken: string): Promise<DriveBackupInfo | null> {
  const searchParams = new URLSearchParams({
    spaces: 'appDataFolder',
    q: `name = '${BACKUP_FILENAME}' and trashed = false`,
    fields: 'files(id, name, modifiedTime, size)',
    pageSize: '1',
  });

  const response = await fetch(`${DRIVE_API}/files?${searchParams.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Drive search failed (${response.status}): ${response.statusText}`);
  }

  const data = await response.json();
  if (data.files && data.files.length > 0) {
    return data.files[0] as DriveBackupInfo;
  }
  return null;
}

export async function uploadBackupToDrive(accessToken: string): Promise<DriveBackupInfo> {
  const payload = await exportDatabaseJSON();
  const jsonContent = JSON.stringify(payload, null, 2);
  const existingFile = await findDriveBackupFile(accessToken);

  const metadata = {
    name: BACKUP_FILENAME,
    mimeType: 'application/json',
    ...(existingFile ? {} : { parents: ['appDataFolder'] }),
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([jsonContent], { type: 'application/json' }));

  let url: string;
  let method: string;

  if (existingFile) {
    url = `${UPLOAD_API}/files/${existingFile.id}?uploadType=multipart&fields=id,name,modifiedTime,size`;
    method = 'PATCH';
  } else {
    url = `${UPLOAD_API}/files?uploadType=multipart&fields=id,name,modifiedTime,size`;
    method = 'POST';
  }

  const response = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });

  if (!response.ok) {
    throw new Error(`Drive backup failed (${response.status}): ${response.statusText}`);
  }

  const result = await response.json();
  localStorage.setItem('google_drive_last_sync', new Date().toISOString());
  return result as DriveBackupInfo;
}

export interface RestoreResult {
  importedCount: number;
  newInsertedCount: number;
  updatedOrMergedCount: number;
}

export async function restoreBackupFromDrive(accessToken: string, replaceAll = false): Promise<RestoreResult> {
  const backupFile = await findDriveBackupFile(accessToken);
  if (!backupFile) {
    throw new Error('No cloud backup found on your Google Drive.');
  }

  const response = await fetch(`${DRIVE_API}/files/${backupFile.id}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Drive download failed (${response.status}): ${response.statusText}`);
  }

  const payload: ExportDataPayload = await response.json();
  const res = await importDatabaseJSON(payload, replaceAll);
  return {
    importedCount: res.importedCount,
    newInsertedCount: res.newInsertedCount,
    updatedOrMergedCount: res.updatedOrMergedCount,
  };
}
