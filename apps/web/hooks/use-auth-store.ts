import { create } from "zustand"
import { supabase } from "@/lib/supabase"
import { AuthError } from "@supabase/supabase-js"
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

/** Safely extract a human-readable message from an unknown catch value. */
function getErrorMessage(e: unknown): string {
  if (e instanceof AuthError) return e.message
  if (e instanceof Error) return e.message
  return "An unexpected error occurred."
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  error: null,

  init: async () => {
    // Idempotency guard — skip if already initialized
    if (get().session) {
      set({ loading: false })
      return
    }

    set({ loading: true, error: null })

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) throw error

      set({ session, user: session?.user ?? null, loading: false })
    } catch (e: unknown) {
      const message = getErrorMessage(e)
      console.error("[Auth] init failed:", e)
      set({ session: null, user: null, loading: false, error: message })
    }

    // Keep store in sync with Supabase token refreshes & external sign-outs
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null })
    })
  },

  login: async (email, password) => {
    set({ loading: true, error: null })

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      set({ session: data.session, user: data.user, loading: false })
    } catch (e: unknown) {
      const message = getErrorMessage(e)
      set({ error: message, loading: false })
      throw e
    }
  },

  signUp: async (email, password) => {
    set({ loading: true, error: null })

    try {
      const { data, error } = await supabase.auth.signUp({ email, password })

      if (error) throw error

      if (data.session) {
        // Email confirmation disabled — user is logged in immediately
        set({ session: data.session, user: data.user, loading: false })
      } else {
        // Email confirmation required
        set({ loading: false })
        throw new Error(
          "Please check your email and click the confirmation link before signing in."
        )
      }
    } catch (e: unknown) {
      const message = getErrorMessage(e)
      set({ error: message, loading: false })
      throw e
    }
  },

  signOut: async () => {
    set({ loading: true })
    try {
      await supabase.auth.signOut()
    } catch (e: unknown) {
      console.warn("[Auth] signOut error:", getErrorMessage(e))
    }
    set({ session: null, user: null, loading: false, error: null })
  },
}))
