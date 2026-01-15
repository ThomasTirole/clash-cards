import { defineStore } from 'pinia'
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
         * Ajout offline-first
         * -> SQLite + queue (géré dans le service)
         */
        async add(payload: CardInsert) {
            const now = new Date().toISOString()

            const localCard: CardLocal = {
                id: crypto.randomUUID(),
                ...payload,
                created_at: now,
                updated_at: now,
                synced: 0
            }

            await createLocalCard(localCard)
            await this.loadFromLocal()
        },

        /**
         * Update offline-first
         */
        async edit(id: string, patch: CardUpdate) {
            const current = this.cards.find(c => c.id === id)
            if (!current) return

            const updated: CardLocal = {
                ...current,
                ...patch,
                synced: 0
            }

            await updateLocalCard(updated)
            await this.loadFromLocal()
        },

        /**
         * Delete offline-first
         */
        async remove(id: string) {
            await deleteLocalCard(id)
            await this.loadFromLocal()
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
