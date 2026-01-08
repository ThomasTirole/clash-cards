import { defineStore } from 'pinia'
import type { Card, CardInsert, CardUpdate } from '@/types/Card'
import * as api from '@/services/cardsService'

/**
 * Le store = “source de vérité” (state centralisé).
 * L’UI lit le state et déclenche des actions.
 */
export const useCardsStore = defineStore('cards', {
    state: () => ({
        cards: [] as Card[],
        loading: false,
        error: '' as string | null
    }),

    actions: {
        /**
         * Charge la liste depuis Supabase.
         * loading/error permettent d’afficher un spinner ou un message.
         */
        async load() {
            this.loading = true
            this.error = null

            try {
                this.cards = await api.fetchCards()
            } catch (e: any) {
                this.error = e?.message ?? 'Erreur de chargement'
            } finally {
                this.loading = false
            }
        },

        /**
         * Ajoute une carte en DB + met à jour le store immédiatement.
         */
        async add(payload: CardInsert) {
            this.error = null
            const created = await api.createCard(payload)

            // On ajoute en tête pour la voir directement dans l’UI
            this.cards = [created, ...this.cards]
        },

        /**
         * Modifie une carte en DB + remplace la version dans le store.
         */
        async edit(id: string, patch: CardUpdate) {
            this.error = null
            const updated = await api.updateCard(id, patch)

            // Remplace l’élément modifié sans recharger toute la liste
            this.cards = this.cards.map(c => (c.id === id ? updated : c))
        },

        /**
         * Supprime en DB + supprime dans le store.
         */
        async remove(id: string) {
            this.error = null
            await api.deleteCard(id)

            this.cards = this.cards.filter(c => c.id !== id)
        },

        /**
         * Toggle “favori” : on lit d’abord dans le store puis on update.
         * (Petite logique métier côté front)
         */
        async toggleFavorite(id: string) {
            const current = this.cards.find(c => c.id === id)
            if (!current) return

            await this.edit(id, { is_favorite: !current.is_favorite })
        }
    }
})
