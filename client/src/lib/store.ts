import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Profile } from '@shared/schema';

export type Role = 'admin' | 'user';

interface AppState {
  currentUser: Profile | null;
  
  setCurrentUser: (user: Profile | null) => void;
  logout: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      currentUser: null,
      
      setCurrentUser: (user) => set({ currentUser: user }),
      logout: () => set({ currentUser: null }),
    }),
    {
      name: 'mediflow-storage',
    }
  )
);
