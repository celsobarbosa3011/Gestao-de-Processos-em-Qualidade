import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Profile } from '@shared/schema';

export type Role = 'admin' | 'user';

interface AppState {
  currentUser: (Profile & { mustChangePassword?: boolean }) | null;
  mustChangePassword: boolean;
  authToken: string | null;
  _hasHydrated: boolean;
  
  setCurrentUser: (user: (Profile & { mustChangePassword?: boolean; token?: string }) | null) => void;
  setAuthToken: (token: string | null) => void;
  setMustChangePassword: (value: boolean) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      currentUser: null,
      mustChangePassword: false,
      authToken: null,
      _hasHydrated: false,
      
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
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'mediflow-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
        mustChangePassword: state.mustChangePassword,
        authToken: state.authToken,
      }),
      onRehydrateStorage: () => () => {
        useStore.setState({ _hasHydrated: true });
      },
    }
  )
);

export const waitForHydration = (): Promise<void> => {
  return new Promise((resolve) => {
    if (useStore.getState()._hasHydrated) {
      resolve();
      return;
    }
    const unsubscribe = useStore.subscribe((state) => {
      if (state._hasHydrated) {
        unsubscribe();
        resolve();
      }
    });
  });
};
