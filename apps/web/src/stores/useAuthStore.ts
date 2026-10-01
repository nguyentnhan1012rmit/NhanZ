import { create } from 'zustand';
import { User } from '@nhanz/shared';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (user: User, token: string) => void;
    logout: () => void;
    checkAuth: () => Promise<void>;
    status: string;
    setStatus: (status: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token'),

    login: (user, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false });
    },

    checkAuth: async () => {
        // TODO: Implement /api/auth/me endpoint to validate token
        const token = localStorage.getItem('token');
        if (!token) {
            set({ user: null, token: null, isAuthenticated: false });
        }
    },

    status: localStorage.getItem('userStatus') || 'active',
    setStatus: (status: string) => {
        localStorage.setItem('userStatus', status);
        set({ status });
    }
}));
