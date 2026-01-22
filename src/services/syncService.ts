import { getQueue, removeFromQueue } from '@/services/offlineQueueService'
import { useAuthStore } from '@/stores/authStore'
import { useNetworkStore } from '@/stores/networkStore'

import {
    createCard,
    updateCard,
    deleteCard,
    fetchCards
} from '@/services/cardsService'

import { upsertManyLocalCards } from '@/services/cardsLocalService'

import type { OfflineAction } from '@/types/OfflineAction'
import type { CardInsert, CardUpdate, CardLocal } from '@/types/Card'

/**
 * Empêche plusieurs synchronisations en parallèle
 * (ex: réseau qui clignote online/offline)
 */
let isSyncing = false

/**
 * 🔄 Synchronise la queue offline vers Supabase
 *
 * Règles :
 * - ne fait rien si offline
 * - ne fait rien si pas connecté
 * - rejoue les actions dans l’ordre
 * - nettoie la queue si succès
 * - remet SQLite à jour depuis le cloud
 */
export async function syncOfflineQueue(): Promise<void> {
    if (isSyncing) return

    const network = useNetworkStore()
    const auth = useAuthStore()

    // ❌ Pas de réseau → pas de sync
    if (!network.connected) return

    // ❌ Pas d’utilisateur → pas de sync (RLS)
    if (!auth.user) return

    isSyncing = true

    try {
        const queue = await getQueue()
        // if (queue.length === 0) return

        // 1️⃣ Rejouer chaque action offline
        for (const action of queue) {
            await syncOneAction(action)
            await removeFromQueue(action.id)
        }

        // 2️⃣ Rafraîchir SQLite depuis Supabase
        // (on s’assure que le local reflète le cloud)
        const cloudCards = await fetchCards()
        await upsertManyLocalCards(cloudCards)
    } finally {
        isSyncing = false
    }
}

/**
 * 🔁 Synchronise UNE action vers Supabase
 * Approche : LOCAL PRIORITAIRE
 */
async function syncOneAction(action: OfflineAction): Promise<void> {
    switch (action.type) {
        case 'CREATE':
            await createCard(toCloudInsert(action.payload))
            return

        case 'UPDATE':
            await updateCard(
                action.payload.id,
                toCloudUpdate(action.payload)
            )
            return

        case 'DELETE':
            await deleteCard(action.payload.id)
            return
    }
}

/**
 * Omet des clés d’un objet (utilitaire)
 * → utile pour transformer CardLocal → CardInsert / CardUpdate
 * On évite les erreurs ESLint pour des attributs non utilisés. (Merci ChatGPT)
 */
function omit<T extends object, K extends keyof T>(obj: T, keys: readonly K[]) {
    const copy = { ...obj }
    for (const k of keys) delete copy[k]
    return copy as Omit<T, K>
}

/**
 * 🔄 CardLocal → CardInsert (CREATE cloud)
 *
 * - on garde l’id (offline-first)
 * - on enlève les champs locaux
 * - Supabase gère created_at / updated_at
 */
function toCloudInsert(local: CardLocal): CardInsert {
    // On enlève synced, created_at, updated_at avec la fonction omit (adieu ESLint)
    return omit(local, ['synced', 'created_at', 'updated_at'] as const) as CardInsert
}

/**
 * 🔄 CardLocal → CardUpdate (UPDATE cloud)
 *
 * - id passé séparément
 * - pas de synced
 * - updated_at géré par trigger Supabase
 */
function toCloudUpdate(local: CardLocal): CardUpdate {
    // On enlève synced, created_at, updated_at avec la fonction omit (adieu ESLint)
    return omit(local, ['id', 'synced', 'created_at', 'updated_at'] as const) as CardUpdate
}
