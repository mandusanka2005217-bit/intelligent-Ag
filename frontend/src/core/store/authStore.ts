import { create } from 'zustand';

export type UserRole = 'admin' | 'farmer' | 'buyer';

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  location: string;
  description: string;
}

export const DEMO_USERS: Record<UserRole, DemoUser> = {
  admin: {
    id: 'usr-admin-01',
    name: 'Admin Controller',
    email: 'admin@agrisupply.lk',
    role: 'admin',
    avatar: '🛡️',
    location: 'Central Command, Colombo',
    description: 'Full system visibility, allocation controls & KPI metrics'
  },
  farmer: {
    id: 'usr-farmer-01',
    name: 'Sunil Shantha (Farmer)',
    email: 'sunil.perera@agrifarm.lk',
    role: 'farmer',
    avatar: '🌾',
    location: 'Nuwara Eliya',
    description: 'Crop listing, stock availability & expected pricing'
  },
  buyer: {
    id: 'usr-buyer-01',
    name: 'Keells Logistics (Buyer)',
    email: 'procurement@keells.lk',
    role: 'buyer',
    avatar: '🛒',
    location: 'Peliyagoda Central Hub, Colombo',
    description: 'Procurement demand, max acceptable pricing & allocations'
  }
};

interface AuthState {
  currentUser: DemoUser;
  switchUser: (role: UserRole) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: DEMO_USERS.admin,
  switchUser: (role: UserRole) => set({ currentUser: DEMO_USERS[role] })
}));
