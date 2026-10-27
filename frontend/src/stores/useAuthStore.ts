import axiosInstance from "@/lib/axios";
import { create } from "zustand";
import type { User } from "@/types";

interface AuthStore {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  isSigningIn: boolean;
  error: string | null;
  checkSession: () => Promise<void>;
  signInWithGoogle: (credential: string) => Promise<boolean>;
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  signUpWithEmail: (fullName: string, email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  reset: () => void;
  openSignIn: () => void;
}

const initialState = {
  user: null as User | null,
  isAdmin: false,
  isLoading: true,
  isSigningIn: false,
  error: null as string | null,
};

export const useAuthStore = create<AuthStore>((set) => ({
  ...initialState,
  openSignIn: () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-auth-dialog"));
    }
  },

  checkSession: async () => {
    try {
      const response = await axiosInstance.get("/auth/me");
      set({
        user: response.data.user,
        isAdmin: Boolean(response.data.isAdmin),
        isLoading: false,
        error: null,
      });
    } catch {
      try {
        localStorage.removeItem("soundwave_token");
      } catch {
        // ignore
      }
      set({ user: null, isAdmin: false, isLoading: false, error: null });
    }
  },

  signInWithGoogle: async (credential) => {
    set({ isSigningIn: true, error: null });
    try {
      const response = await axiosInstance.post("/auth/google", { credential });
      if (response.data?.token) {
        try {
          localStorage.setItem("soundwave_token", response.data.token);
        } catch {
          // ignore
        }
      }
      set({
        user: response.data.user,
        isAdmin: Boolean(response.data.isAdmin),
        isLoading: false,
        isSigningIn: false,
      });
      return true;
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "Google sign-in failed. Please try again.";
      set({ isSigningIn: false, error: message });
      return false;
    }
  },

  signInWithEmail: async (email, password) => {
    set({ isSigningIn: true, error: null });
    try {
      const response = await axiosInstance.post("/auth/login", { email, password });
      if (response.data?.token) {
        try {
          localStorage.setItem("soundwave_token", response.data.token);
        } catch {
          // ignore
        }
      }
      set({
        user: response.data.user,
        isAdmin: Boolean(response.data.isAdmin),
        isLoading: false,
        isSigningIn: false,
      });
      return true;
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "Login failed. Please try again.";
      set({ isSigningIn: false, error: message });
      return false;
    }
  },

  signUpWithEmail: async (fullName, email, password) => {
    set({ isSigningIn: true, error: null });
    try {
      const response = await axiosInstance.post("/auth/register", { fullName, email, password });
      if (response.data?.token) {
        try {
          localStorage.setItem("soundwave_token", response.data.token);
        } catch {
          // ignore
        }
      }
      set({
        user: response.data.user,
        isAdmin: Boolean(response.data.isAdmin),
        isLoading: false,
        isSigningIn: false,
      });
      return true;
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "Registration failed. Please try again.";
      set({ isSigningIn: false, error: message });
      return false;
    }
  },

  signOut: async () => {
    try {
      await axiosInstance.post("/auth/logout");
    } finally {
      try {
        localStorage.removeItem("soundwave_token");
      } catch {
        // ignore
      }
      set({ ...initialState, isLoading: false });
    }
  },

  reset: () => set({ ...initialState, isLoading: false }),
}));
