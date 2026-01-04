import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Role = 'admin' | 'user';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type ProcessStatus = 'new' | 'analysis' | 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  unit: string;
  avatar?: string;
  status: 'active' | 'suspended';
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
}

export interface HistoryEvent {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface Process {
  id: string;
  title: string;
  description: string;
  unit: string;
  type: string;
  priority: Priority;
  status: ProcessStatus;
  responsibleId?: string;
  createdAt: string;
  deadline?: string;
  comments: Comment[];
  history: HistoryEvent[];
  attachments: string[]; // Mock URLs
}

export interface AlertSettings {
  warningDays: number; // Days before deadline to show yellow
  criticalDays: number; // Days before deadline to show red
  stalledDays: number; // Days without movement to flag
}

interface AppState {
  currentUser: User | null;
  users: User[];
  processes: Process[];
  alertSettings: AlertSettings;
  
  login: (email: string) => void;
  logout: () => void;
  
  updateProcess: (id: string, updates: Partial<Process>) => void;
  addComment: (processId: string, text: string) => void;
  moveProcess: (processId: string, newStatus: ProcessStatus) => void;
  
  updateSettings: (settings: Partial<AlertSettings>) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
}

const MOCK_USERS: User[] = [
  { id: '1', name: 'Dr. Admin', email: 'admin@mediflow.com', role: 'admin', unit: 'Central', status: 'active' },
  { id: '2', name: 'Enf. Sarah', email: 'sarah@mediflow.com', role: 'user', unit: 'Unidade A', status: 'active' },
  { id: '3', name: 'Rec. João', email: 'joao@mediflow.com', role: 'user', unit: 'Unidade B', status: 'active' },
];

const MOCK_PROCESSES: Process[] = [
  {
    id: 'P-001',
    title: 'Solicitação de Medicamentos - Lote A',
    description: 'Reposição mensal de antibióticos para a ala pediátrica.',
    unit: 'Unidade A',
    type: 'Suprimentos',
    priority: 'high',
    status: 'new',
    responsibleId: '2',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days from now
    comments: [],
    history: [],
    attachments: [],
  },
  {
    id: 'P-002',
    title: 'Manutenção de Ar Condicionado',
    description: 'Sala de espera principal com falha na refrigeração.',
    unit: 'Unidade A',
    type: 'Manutenção',
    priority: 'medium',
    status: 'analysis',
    responsibleId: '2',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(),
    comments: [],
    history: [],
    attachments: [],
  },
  {
    id: 'P-003',
    title: 'Contratação de Téc. Enfermagem',
    description: 'Substituição para licença maternidade.',
    unit: 'Unidade B',
    type: 'RH',
    priority: 'critical',
    status: 'pending',
    responsibleId: '3',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(), // 15 days ago (delayed?)
    deadline: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // Overdue
    comments: [],
    history: [],
    attachments: [],
  }
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: MOCK_USERS,
      processes: MOCK_PROCESSES,
      alertSettings: {
        warningDays: 5,
        criticalDays: 2,
        stalledDays: 15,
      },

      login: (email) => {
        const user = get().users.find(u => u.email === email);
        if (user) set({ currentUser: user });
      },
      logout: () => set({ currentUser: null }),

      updateProcess: (id, updates) => set(state => ({
        processes: state.processes.map(p => 
          p.id === id ? { ...p, ...updates } : p
        )
      })),

      addComment: (processId, text) => set(state => {
        const currentUser = state.currentUser;
        if (!currentUser) return state;
        
        const newComment: Comment = {
          id: Math.random().toString(36).substr(2, 9),
          userId: currentUser.id,
          text,
          createdAt: new Date().toISOString()
        };

        return {
          processes: state.processes.map(p => 
            p.id === processId 
              ? { ...p, comments: [...p.comments, newComment] }
              : p
          )
        };
      }),

      moveProcess: (processId, newStatus) => set(state => {
        const currentUser = state.currentUser;
        
        // Audit log
        const newHistory: HistoryEvent = {
          id: Math.random().toString(36).substr(2, 9),
          userId: currentUser?.id || 'system',
          action: 'moved',
          details: `Moved to ${newStatus}`,
          timestamp: new Date().toISOString()
        };

        return {
          processes: state.processes.map(p => 
            p.id === processId 
              ? { ...p, status: newStatus, history: [...p.history, newHistory] }
              : p
          )
        };
      }),

      updateSettings: (settings) => set(state => ({
        alertSettings: { ...state.alertSettings, ...settings }
      })),

      addUser: (userData) => set(state => ({
        users: [...state.users, { ...userData, id: Math.random().toString(36).substr(2, 9) }]
      })),

      updateUser: (id, updates) => set(state => ({
        users: state.users.map(u => u.id === id ? { ...u, ...updates } : u)
      })),
    }),
    {
      name: 'mediflow-storage',
    }
  )
);
