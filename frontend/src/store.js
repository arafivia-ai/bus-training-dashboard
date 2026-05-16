import { create } from 'zustand'

export const useStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('bt_user') || 'null'),
  token: localStorage.getItem('bt_token') || null,

  setAuth: (user, token) => {
    localStorage.setItem('bt_token', token)
    localStorage.setItem('bt_user', JSON.stringify(user))
    set({ user, token })
  },

  clearAuth: () => {
    localStorage.removeItem('bt_token')
    localStorage.removeItem('bt_user')
    set({ user: null, token: null })
  },

  isAdmin: () => get().user?.role === 'Administrator',
}))