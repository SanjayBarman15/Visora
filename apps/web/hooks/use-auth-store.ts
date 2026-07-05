import { create } from "zustand"
import { supabase } from "@/lib/supabase"
import { Session, User } from "@supabase/supabase-js"

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null

  init: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

// ─── Cookie helpers (readable by Next.js middleware) ──────────────────────────
const AUTH_COOKIE = "visora-auth"

function setAuthCookie() {
  if (typeof document === "undefined") return
  document.cookie = `${AUTH_COOKIE}=1; path=/; max-age=86400; SameSite=Lax`
}

function clearAuthCookie() {
  if (typeof document === "undefined") return
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`
}

// ─── Mock helpers (dev fallback only) ─────────────────────────────────────────
const createMockUser = (email: string): User => ({
  id: `mock_user_${email.replace(/[^a-zA-Z0-9]/g, "")}`,
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString(),
  email: email,
})

const createMockSession = (email: string): Session => {
  const user = createMockUser(email)
  return {
    access_token: "mock_access_token",
    token_type: "bearer",
    expires_in: 3600,
    refresh_token: "mock_refresh_token",
    user,
  }
}

function saveMockSession(session: Session) {
  if (typeof window === "undefined") return
  localStorage.setItem("visora_mock_session", JSON.stringify(session))
  setAuthCookie()
}

function clearMockSession() {
  if (typeof window === "undefined") return
  localStorage.removeItem("visora_mock_session")
  clearAuthCookie()
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  error: null,

  init: async () => {
    // Idempotency guard — don't re-init if we already have a session
    if (get().session) {
      set({ loading: false })
      return
    }

    set({ loading: true, error: null })

    // 1. Try real Supabase session first
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setAuthCookie()
        set({ session, user: session.user, loading: false })
        return
      }
    } catch (e) {
      console.warn("Supabase getSession failed, checking local fallback:", e)
    }

    // 2. Fall back to mock session in localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("visora_mock_session")
      if (saved) {
        try {
          const session = JSON.parse(saved) as Session
          setAuthCookie() // ensure cookie is present (may have expired)
          set({ session, user: session.user, loading: false })
          return
        } catch {
          clearMockSession()
        }
      }
    }

    set({ session: null, user: null, loading: false })
  },

  login: async (email, password) => {
    set({ loading: true, error: null })

    try {
      // Try real Supabase auth first
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (!error && data.session) {
        setAuthCookie()
        set({ session: data.session, user: data.session.user, loading: false })
        return
      }

      // If Supabase fails and it's NOT a dev/test email, surface the real error
      if (error && !email.includes("example.com") && email !== "test") {
        throw error
      }
    } catch (err: any) {
      // Only fall back to mock for explicit dev emails
      if (email.includes("example.com") || email === "test") {
        console.log("Supabase login failed, using mock auth fallback for dev")
        const mockSession = createMockSession(email)
        saveMockSession(mockSession)
        set({ session: mockSession, user: mockSession.user, loading: false })
        return
      }

      set({ error: err.message || "Login failed", loading: false })
      throw err
    }

    // Supabase returned no error but also no session (shouldn't normally happen)
    // Fall back to mock for dev emails
    if (email.includes("example.com") || email === "test") {
      const mockSession = createMockSession(email)
      saveMockSession(mockSession)
      set({ session: mockSession, user: mockSession.user, loading: false })
      return
    }

    set({ error: "Login failed: no session returned", loading: false })
    throw new Error("Login failed: no session returned")
  },

  signUp: async (email, password) => {
    set({ loading: true, error: null })

    try {
      const { data, error } = await supabase.auth.signUp({ email, password })

      if (!error && data.session) {
        // Real Supabase session — use it directly
        setAuthCookie()
        set({ session: data.session, user: data.session.user, loading: false })
        return
      }

      if (!error && data.user && !data.session) {
        // User created but email confirmation required
        set({ loading: false })
        throw new Error("Check your email to confirm your account before signing in.")
      }

      if (error && !email.includes("example.com") && email !== "test") {
        throw error
      }
    } catch (err: any) {
      if (email.includes("example.com") || email === "test") {
        console.log("Supabase signup failed, using mock auth fallback for dev")
        const mockSession = createMockSession(email)
        saveMockSession(mockSession)
        set({ session: mockSession, user: mockSession.user, loading: false })
        return
      }

      set({ error: err.message || "Signup failed", loading: false })
      throw err
    }

    // Supabase returned no error/session for dev email — use mock
    if (email.includes("example.com") || email === "test") {
      const mockSession = createMockSession(email)
      saveMockSession(mockSession)
      set({ session: mockSession, user: mockSession.user, loading: false })
      return
    }

    set({ error: "Signup failed: unexpected state", loading: false })
    throw new Error("Signup failed: unexpected state")
  },

  signOut: async () => {
    set({ loading: true })
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.warn("Supabase signOut error:", e)
    }

    clearMockSession()
    set({ session: null, user: null, loading: false })
  },
}))
