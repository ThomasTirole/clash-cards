import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import type { Session, User } from '@supabase/supabase-js'

/**
 * Store Auth = centralise l’état de connexion :
 * - session (tokens)
 * - user (infos du user)
 * - loading / error pour l’UX
 */
export const useAuthStore = defineStore('auth', {
    state: () => ({
        // Session Supabase (contient access_token, refresh_token, etc.)
        session: null as Session | null,

        // User Supabase (id, email, metadata, etc.)
        user: null as User | null,

        // Pour afficher un spinner / désactiver boutons
        loading: false,

        // Pour afficher une erreur dans l’UI
        error: null as string | null
    }),

    getters: {
        /**
         * Getter pratique pour l’UI :
         * - true si user != null
         */
        isLoggedIn: (state) => !!state.user
    },

    actions: {
        /**
         * init() doit être appelé AU DÉMARRAGE de l’app.
         *
         * Rôle :
         * 1) récupérer une session existante (si déjà connecté)
         * 2) écouter les changements (login/logout)
         *
         * Pourquoi ?
         * - Quand l’utilisateur refresh la page, Supabase peut restaurer la session.
         * - On garde l’UI synchronisée automatiquement.
         */
        async init() {
            // 1) Récupère la session actuelle (si elle existe)
            const { data, error } = await supabase.auth.getSession()

            if (error) {
                this.error = error.message
                return
            }

            // data.session peut être null si pas connecté
            this.session = data.session
            this.user = data.session?.user ?? null

            // 2) Écoute les changements d’état auth (login/logout/token refresh)
            // On n’a pas besoin de savoir quel event exact ici.
            supabase.auth.onAuthStateChange((_event, session) => {
                // Met à jour store → l’UI réagit automatiquement
                this.session = session
                this.user = session?.user ?? null
            })
        },

        /**
         * register() : crée un compte email/password
         * - Peut être suivi d’un login automatique selon settings Supabase
         */
        async register(email: string, password: string) {
            this.loading = true
            this.error = null

            try {
                const { error } = await supabase.auth.signUp({ email, password })
                if (error) throw error
            } catch (e: any) {
                this.error = e?.message ?? 'Erreur register'
            } finally {
                this.loading = false
            }
        },

        /**
         * login() : connexion email/password
         * - Met à jour la session user si ok (via listener onAuthStateChange)
         */
        async login(email: string, password: string) {
            this.loading = true
            this.error = null

            try {
                const { error } = await supabase.auth.signInWithPassword({ email, password })
                if (error) throw error
            } catch (e: any) {
                this.error = e?.message ?? 'Erreur login'
            } finally {
                this.loading = false
            }
        },

        /**
         * logout() : déconnexion
         * - Supabase supprime la session
         * - le listener onAuthStateChange met user = null
         */
        async logout() {
            this.loading = true
            this.error = null

            try {
                const { error } = await supabase.auth.signOut()
                if (error) throw error
            } catch (e: any) {
                this.error = e?.message ?? 'Erreur logout'
            } finally {
                this.loading = false
            }
        }
    }
})
