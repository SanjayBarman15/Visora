import { create } from "zustand"
import { supabase } from "@/lib/supabase"
import { AuthError } from "@supabase/supabase-js"
import { Session, User } from "@supabase/supabase-js"

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  initialized: boolean
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

export const useAuthStore = create<AuthState>((set, get) => {
  // Register the auth state listener once at store creation — not inside init().
  // This ensures the store always reflects the true Supabase auth state,
  // regardless of how many times init() is called or components mount/unmount.
  supabase.auth.onAuthStateChange((_event, session) => {
    set({
      session,
      user: session?.user ?? null,
      // Once we receive any event (including INITIAL_SESSION), we are initialized.
      initialized: true,
      loading: false,
    })
  })

  return {
    user: null,
    session: null,
    loading: true,
    initialized: false,
    error: null,

    init: async () => {
      // Only run if not yet initialized — the onAuthStateChange listener
      // fires INITIAL_SESSION automatically, but getSession() ensures the
      // token is refreshed and the listener fires synchronously on first load.
      if (get().initialized) return

      set({ loading: true, error: null })

      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) throw error

        // Explicitly set state for the initial load. The onAuthStateChange
        // listener will also fire (INITIAL_SESSION event) and sync the store.
        set({
          session,
          user: session?.user ?? null,
          loading: false,
          initialized: true,
        })
      } catch (e: unknown) {
        const message = getErrorMessage(e)
        console.error("[Auth] init failed:", e)
        set({
          session: null,
          user: null,
          loading: false,
          initialized: true,
          error: message,
        })
      }
    },

    login: async (email, password) => {
      set({ loading: true, error: null })

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        // The onAuthStateChange listener will also fire SIGNED_IN and update
        // the store, but we set it eagerly here so the UI can react immediately.
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
          // Email confirmation disabled — user is logged in immediately.
          // The onAuthStateChange listener will also fire SIGNED_IN.
          set({ session: data.session, user: data.user, loading: false })
        } else {
          // Email confirmation required — no session yet.
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
        // onAuthStateChange fires SIGNED_OUT and clears session/user.
      } catch (e: unknown) {
        console.warn("[Auth] signOut error:", getErrorMessage(e))
      }
      set({ session: null, user: null, loading: false, error: null })
    },
  }
})
