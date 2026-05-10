import { create } from 'zustand'

interface AuthState {
  isAuthenticated: boolean
  isInitialized: boolean
  hasPassword: boolean
  token: string | null
  expiresAt: string | null

  setAuthenticated: (token: string, expiresAt: string) => void
  setHasPassword: (has: boolean) => void
  setInitialized: (val: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isInitialized: false,
  hasPassword: false,
  token: null,
  expiresAt: null,

  setAuthenticated: (token, expiresAt) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
      localStorage.setItem('auth_expires', expiresAt)
    }
    set({ isAuthenticated: true, token, expiresAt })
  },

  setHasPassword: (has) => set({ hasPassword: has }),

  setInitialized: (val) => set({ isInitialized: val }),

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_expires')
    }
    set({ isAuthenticated: false, token: null, expiresAt: null })
  },
}))

// Helper: get stored token from localStorage
export function getStoredToken(): { token: string | null; expiresAt: string | null } {
  if (typeof window === 'undefined') return { token: null, expiresAt: null }
  return {
    token: localStorage.getItem('auth_token'),
    expiresAt: localStorage.getItem('auth_expires'),
  }
}
