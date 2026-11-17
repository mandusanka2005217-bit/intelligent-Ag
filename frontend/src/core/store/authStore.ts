import { create } from 'zustand';

export type UserRole = 'admin' | 'farmer' | 'buyer';

export interface UserAccount {
  id: string;
  name: string;
  username: string; // email or username
  password?: string;
  role: UserRole;
  avatar: string;
  location: string;
  phone?: string;
  createdAt: string;
}

// Initial Registered Users including Admin with given credentials
export const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'admin-01',
    name: 'Ravindu (System Admin)',
    username: 'ravindu@2005',
    password: 'ravindu2005@@',
    role: 'admin',
    avatar: '🛡️',
    location: 'Central Command, Colombo',
    createdAt: '2026-01-01'
  },
  {
    id: 'farmer-demo',
    name: 'Sunil Shantha',
    username: 'farmer@demo.com',
    password: 'farmer123',
    role: 'farmer',
    avatar: '🌾',
    location: 'Nuwara Eliya',
    phone: '+94 77 123 4567',
    createdAt: '2026-01-01'
  },
  {
    id: 'buyer-demo',
    name: 'Keells Logistics Hub',
    username: 'buyer@demo.com',
    password: 'buyer123',
    role: 'buyer',
    avatar: '🛒',
    location: 'Peliyagoda Central Hub',
    phone: '+94 11 987 6543',
    createdAt: '2026-01-01'
  }
];

interface AuthState {
  currentUser: UserAccount | null;
  users: UserAccount[];
  login: (username: string, password: string) => { success: boolean; message?: string };
  register: (user: Omit<UserAccount, 'id' | 'createdAt'>) => { success: boolean; message?: string };
  logout: () => void;
  switchDemoRole: (role: UserRole) => void;
}

// Load initial users from localStorage if available
const STORAGE_KEY_USERS = 'agri_users_db_v1';
const STORAGE_KEY_AUTH = 'agri_current_auth_v1';

const getInitialUsers = (): UserAccount[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_USERS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_USERS;
};

const getInitialCurrent = (): UserAccount | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_AUTH);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error(e);
  }
  return null; // Start unauthenticated to show Welcome / Login screen!
};

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: getInitialCurrent(),
  users: getInitialUsers(),

  login: (username, password) => {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    // Check credentials against state
    const matched = get().users.find(
      (u) => u.username.toLowerCase() === cleanUser && u.password === cleanPass
    );

    if (matched) {
      set({ currentUser: matched });
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(matched));
      return { success: true };
    }

    return { success: false, message: 'Invalid username or password!' };
  },

  register: (newUserData) => {
    const cleanUser = newUserData.username.trim().toLowerCase();

    // Check if username/email already exists
    const exists = get().users.some((u) => u.username.toLowerCase() === cleanUser);
    if (exists) {
      return { success: false, message: 'This username or email is already registered.' };
    }

    const newUser: UserAccount = {
      ...newUserData,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const updatedUsers = [...get().users, newUser];
    set({ users: updatedUsers, currentUser: newUser });
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updatedUsers));
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(newUser));

    return { success: true };
  },

  logout: () => {
    set({ currentUser: null });
    localStorage.removeItem(STORAGE_KEY_AUTH);
  },

  switchDemoRole: (role: UserRole) => {
    const demoUser = get().users.find((u) => u.role === role) || DEFAULT_USERS.find((u) => u.role === role);
    if (demoUser) {
      set({ currentUser: demoUser });
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(demoUser));
    }
  }
}));
