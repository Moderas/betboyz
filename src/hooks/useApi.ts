import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export function useApi() {
  const { session, logout } = useAuth();

  const apiFetch = useCallback(
    async <T = unknown>(path: string, options: RequestInit = {}): Promise<T> => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };
      if (session?.token) {
        headers['Authorization'] = `Bearer ${session.token}`;
      }
      const res = await fetch(path, { ...options, headers });
      if (res.status === 401) {
        logout();
        throw new Error('Session expired — please log in again');
      }
      const data = (await res.json()) as T & { error?: string };
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? 'Request failed');
      }
      return data;
    },
    [session, logout],
  );

  return { apiFetch };
}
