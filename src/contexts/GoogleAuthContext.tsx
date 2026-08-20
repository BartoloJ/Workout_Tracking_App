import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { uploadBackupToDrive, findDriveBackupFile, restoreBackupFromDrive, DriveBackupInfo, RestoreResult } from '../services/googleDriveService';

interface GoogleAuthContextType {
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  userEmail: string | null;
  lastBackup: DriveBackupInfo | null;
  isSyncing: boolean;
  autoSyncEnabled: boolean;
  clientId: string;
  setCustomClientId: (id: string) => void;
  toggleAutoSync: () => void;
  signIn: () => void;
  signOut: () => void;
  backupNow: () => Promise<void>;
  restoreNow: (replaceAll?: boolean) => Promise<RestoreResult>;
  refreshBackupInfo: () => Promise<void>;
  clearError: () => void;
}

const DEFAULT_CLIENT_ID = '952344848598-dfpruscj9kq7v6p98nlssv5bctecfmqc.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';

const GoogleAuthContext = createContext<GoogleAuthContextType>({
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  userEmail: null,
  lastBackup: null,
  isSyncing: false,
  autoSyncEnabled: true,
  clientId: DEFAULT_CLIENT_ID,
  setCustomClientId: () => {},
  toggleAutoSync: () => {},
  signIn: () => {},
  signOut: () => {},
  backupNow: async () => {},
  restoreNow: async () => ({ importedCount: 0, newInsertedCount: 0, updatedOrMergedCount: 0 }),
  refreshBackupInfo: async () => {},
  clearError: () => {},
});

export function GoogleAuthProvider({ children }: { children: React.ReactNode }) {
  const [customClientId, setCustomClientIdState] = useState<string>(() => {
    return localStorage.getItem('google_custom_client_id') || '';
  });

  const effectiveClientId = customClientId.trim() || (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || DEFAULT_CLIENT_ID;

  const [accessToken, setAccessToken] = useState<string | null>(() => {
    const savedToken = sessionStorage.getItem('google_access_token');
    const tokenExpiry = sessionStorage.getItem('google_token_expiry');
    if (savedToken && tokenExpiry && Date.now() < Number(tokenExpiry)) {
      return savedToken;
    }
    return null;
  });

  const [userEmail, setUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('google_drive_user_email');
  });

  const [tokenClient, setTokenClient] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastBackup, setLastBackup] = useState<DriveBackupInfo | null>(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(() => {
    return localStorage.getItem('google_drive_auto_sync') !== 'false';
  });

  const setCustomClientId = useCallback((newId: string) => {
    const trimmed = newId.trim();
    setCustomClientIdState(trimmed);
    if (trimmed) {
      localStorage.setItem('google_custom_client_id', trimmed);
    } else {
      localStorage.removeItem('google_custom_client_id');
    }
    setTokenClient(null);
  }, []);

  const toggleAutoSync = useCallback(() => {
    setAutoSyncEnabled(prev => {
      const next = !prev;
      localStorage.setItem('google_drive_auto_sync', String(next));
      return next;
    });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchUserInfo = useCallback(async (token: string) => {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.email) {
          setUserEmail(data.email);
          localStorage.setItem('google_drive_user_email', data.email);
        }
      }
    } catch {
      // Ignored
    }
  }, []);

  const refreshBackupInfo = useCallback(async (tokenToUse?: string) => {
    const token = tokenToUse || accessToken;
    if (!token) return;
    try {
      const fileInfo = await findDriveBackupFile(token);
      setLastBackup(fileInfo);
    } catch (err) {
      console.warn('Could not check Google Drive backup info:', err);
    }
  }, [accessToken]);

  const backupNow = useCallback(async () => {
    if (!accessToken) {
      setError('Please connect Google Drive first.');
      return;
    }
    setIsSyncing(true);
    setError(null);
    try {
      const info = await uploadBackupToDrive(accessToken);
      setLastBackup(info);
    } catch (err: any) {
      console.error('Backup error:', err);
      setError(err.message || 'Failed to sync to Google Drive');
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, [accessToken]);

  const restoreNow = useCallback(async (replaceAll = false) => {
    if (!accessToken) {
      throw new Error('Please connect Google Drive first.');
    }
    setIsSyncing(true);
    setError(null);
    try {
      const count = await restoreBackupFromDrive(accessToken, replaceAll);
      await refreshBackupInfo();
      return count;
    } catch (err: any) {
      console.error('Restore error:', err);
      setError(err.message || 'Failed to restore from Google Drive');
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, [accessToken, refreshBackupInfo]);

  const initClient = useCallback(() => {
    const google = (window as any).google;
    if (!google?.accounts?.oauth2) {
      setError('Google Identity Services script is still loading. Please check your internet connection.');
      return null;
    }

    if (!effectiveClientId) {
      setError('Google Client ID is missing. Please configure your Google OAuth Client ID.');
      return null;
    }

    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: effectiveClientId,
        scope: `${SCOPES} email profile`,
        callback: (response: any) => {
          if (response.access_token) {
            setAccessToken(response.access_token);
            const expiresInMs = (Number(response.expires_in) || 3599) * 1000;
            sessionStorage.setItem('google_access_token', response.access_token);
            sessionStorage.setItem('google_token_expiry', String(Date.now() + expiresInMs));
            setError(null);
            fetchUserInfo(response.access_token);
            refreshBackupInfo(response.access_token);
          } else if (response.error) {
            setError(response.error_description || response.error);
          }
        },
        error_callback: (err: any) => {
          setError(err.message || 'Authentication with Google failed. If in an iframe, try opening in a new tab.');
        },
      });
      setTokenClient(client);
      setIsLoading(false);
      return client;
    } catch (e: any) {
      console.warn('Google Identity Client error:', e);
      setError(e.message || 'Could not initialize Google Identity Client');
      return null;
    }
  }, [effectiveClientId, fetchUserInfo, refreshBackupInfo]);

  useEffect(() => {
    if ((window as any).google?.accounts?.oauth2) {
      initClient();
    } else {
      const interval = setInterval(() => {
        if ((window as any).google?.accounts?.oauth2) {
          clearInterval(interval);
          initClient();
        }
      }, 100);
      const timeout = setTimeout(() => {
        clearInterval(interval);
        setIsLoading(false);
      }, 4000);
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [initClient]);

  useEffect(() => {
    if (accessToken) {
      refreshBackupInfo(accessToken);
    }
  }, [accessToken, refreshBackupInfo]);

  const signIn = useCallback(() => {
    setError(null);
    let client = tokenClient;
    if (!client) {
      client = initClient();
    }
    if (client) {
      try {
        client.requestAccessToken({ prompt: '' });
      } catch (err: any) {
        console.error('Error invoking Google sign in:', err);
        setError(err.message || 'Failed to open Google Sign-In popup');
      }
    } else {
      setError('Google Sign-In is initializing. Please tap again in a moment or verify Client ID.');
    }
  }, [tokenClient, initClient]);

  const signOut = useCallback(() => {
    const google = (window as any).google;
    if (accessToken && google?.accounts?.oauth2) {
      try {
        google.accounts.oauth2.revoke(accessToken, () => {});
      } catch {
        // Ignored
      }
    }
    setAccessToken(null);
    setUserEmail(null);
    setLastBackup(null);
    sessionStorage.removeItem('google_access_token');
    sessionStorage.removeItem('google_token_expiry');
    localStorage.removeItem('google_drive_user_email');
    localStorage.removeItem('google_drive_last_sync');
  }, [accessToken]);

  return (
    <GoogleAuthContext.Provider
      value={{
        accessToken,
        isAuthenticated: !!accessToken,
        isLoading,
        error,
        userEmail,
        lastBackup,
        isSyncing,
        autoSyncEnabled,
        clientId: effectiveClientId,
        setCustomClientId,
        toggleAutoSync,
        signIn,
        signOut,
        backupNow,
        restoreNow,
        refreshBackupInfo,
        clearError,
      }}
    >
      {children}
    </GoogleAuthContext.Provider>
  );
}

export function useGoogleAuth() {
  return useContext(GoogleAuthContext);
}
