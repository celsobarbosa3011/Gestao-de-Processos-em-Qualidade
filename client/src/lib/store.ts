import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Profile } from '@shared/schema';

export type Role = 'admin' | 'user';

interface AppState {
  currentUser: (Profile & { mustChangePassword?: boolean }) | null;
  mustChangePassword: boolean;
  
  setCurrentUser: (user: (Profile & { mustChangePassword?: boolean }) | null) => void;
  setMustChangePassword: (value: boolean) => void;
  logout: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      currentUser: null,
      mustChangePassword: false,
      
      setCurrentUser: (user) => set({ 
        currentUser: user,
        mustChangePassword: user?.mustChangePassword || false,
      }),
      setMustChangePassword: (value) => set({ mustChangePassword: value }),
      logout: () => set({ currentUser: null, mustChangePassword: false }),
    }),
    {
      name: 'mediflow-storage',
    }
  )
);
