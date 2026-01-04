import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Profile } from '@shared/schema';

export type Role = 'admin' | 'user';

interface AppState {
  currentUser: (Profile & { mustChangePassword?: boolean }) | null;
  mustChangePassword: boolean;
  authToken: string | null;
  
  setCurrentUser: (user: (Profile & { mustChangePassword?: boolean; token?: string }) | null) => void;
  setAuthToken: (token: string | null) => void;
  setMustChangePassword: (value: boolean) => void;
  logout: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      currentUser: null,
      mustChangePassword: false,
      authToken: null,
      
      setCurrentUser: (user) => {
        if (user) {
          const { token, ...userData } = user as any;
          set({ 
            currentUser: userData,
            mustChangePassword: userData.mustChangePassword || false,
            authToken: token || null,
          });
        } else {
          set({ 
            currentUser: null,
            mustChangePassword: false,
            authToken: null,
          });
        }
      },
      setAuthToken: (token) => set({ authToken: token }),
      setMustChangePassword: (value) => set({ mustChangePassword: value }),
      logout: () => set({ currentUser: null, mustChangePassword: false, authToken: null }),
    }),
    {
      name: 'mediflow-storage',
    }
  )
);
