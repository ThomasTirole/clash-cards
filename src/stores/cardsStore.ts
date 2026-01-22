import { defineStore } from 'pinia'
import { useNetworkStore } from '@/stores/networkStore'
import { useAuthStore } from '@/stores/authStore'
import type { CardInsert, CardLocal, CardUpdate } from '@/types/Card'

import {
    getAllLocalCards,
    createLocalCard,
    updateLocalCard,
    deleteLocalCard
} from '@/services/cardsLocalService'

import { syncOfflineQueue } from '@/services/syncService'

export const useCardsStore = defineStore('cards', {
    state: () => ({
        cards: [] as CardLocal[],
        loading: false,
        error: null as string | null
    }),

    actions: {
        /**
         * Source de vérité : SQLite
         */
        async loadFromLocal() {
            this.loading = true
            this.error = null

            try {
                this.cards = await getAllLocalCards()
            } catch (e: any) {
                this.error = e?.message ?? 'Erreur de chargement local'
            } finally {
                this.loading = false
            }
        },

        /**
         * Sync automatique si online
         */
        async syncIfPossible() {
            const network = useNetworkStore()
            const auth = useAuthStore()

            if (!network.connected) return
            if (!auth.user) return

            await syncOfflineQueue()
        },

        /**
         * Ajout offline-first
         * -> SQLite + queue (géré dans le service)
         */
        async add(payload: CardInsert) {
            this.error = null
            this.loading = true
            try {
                const now = new Date().toISOString()

                const localCard: CardLocal = {
                    id: crypto.randomUUID(),
                    ...payload,
                    created_at: now,
                    updated_at: now,
                    synced: 0
                }

                await createLocalCard(localCard)

                await this.syncIfPossible()
                await this.loadFromLocal()
            } catch (e: any) {
                this.error = e?.message ?? 'Erreur ajout'
            } finally {
                this.loading = false
            }
        },

        /**
         * Update offline-first
         */
        async edit(id: string, patch: CardUpdate) {
            this.error = null
            this.loading = true
            try {
                const current = this.cards.find(c => c.id === id)
                if (!current) return

                const updated: CardLocal = {
                    ...current,
                    ...patch,
                    synced: 0
                }

                await updateLocalCard(updated)
                await this.syncIfPossible()
                await this.loadFromLocal()
            } catch (e: any) {
                this.error = e?.message ?? 'Erreur mise à jour'
            } finally {
                this.loading = false
            }
        },

        /**
         * Delete offline-first
         */
        async remove(id: string) {
            this.error = null
            this.loading = true
            try {
                await deleteLocalCard(id)

                await this.syncIfPossible()
                await this.loadFromLocal()
            } catch (e: any) {
                this.error = e?.message ?? 'Erreur suppression'
            } finally {
                this.loading = false
            }
        },

        async refresh(): Promise<void> {
            this.error = null
            try {
                await this.syncIfPossible()
                await this.loadFromLocal()
            } catch (e: any) {
                this.error = e?.message ?? 'Erreur de rafraîchissement'
            }
        },

        async toggleFavorite(id: string) {
            const card = this.cards.find(c => c.id === id)
            if (!card) return
            await this.edit(id, { is_favorite: !card.is_favorite })
        },

        /**
         * Sync manuel (debug / bouton)
         */
        async syncNow() {
            await syncOfflineQueue()
            await this.loadFromLocal()
        }
    }
})
