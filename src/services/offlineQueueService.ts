import { Preferences } from '@capacitor/preferences'
import type { OfflineAction } from '@/types/OfflineAction'

/**
 * Clé unique dans Preferences.
 * Toute la queue est stockée en JSON sous cette clé.
 */
const QUEUE_KEY = 'offline_queue_cards'

/**
 * Lit la queue depuis Preferences.
 * Si rien n’existe encore, on renvoie un tableau vide.
 */
export async function getQueue(): Promise<OfflineAction[]> {
    const { value } = await Preferences.get({ key: QUEUE_KEY })

    // value est une string JSON ou null
    if (!value) return []

    try {
        return JSON.parse(value) as OfflineAction[]
    } catch {
        // si JSON cassé (rare), on repart sur une queue vide
        return []
    }
}

/**
 * Sauvegarde une queue complète dans Preferences.
 * (fonction interne pour centraliser l’écriture JSON)
 */
async function saveQueue(queue: OfflineAction[]): Promise<void> {
    await Preferences.set({
        key: QUEUE_KEY,
        value: JSON.stringify(queue)
    })
}

/**
 * Ajoute une action à la queue (en fin de liste).
 * -> l’ordre est important (on rejouera dans le même ordre plus tard)
 */
export async function enqueue(action: OfflineAction): Promise<void> {
    const queue = await getQueue()
    queue.push(action)
    await saveQueue(queue)
}

/**
 * Retire une action de la queue (par id).
 * -> utilisé après une sync réussie (chapitre 9.5)
 */
export async function removeFromQueue(actionId: string): Promise<void> {
    const queue = await getQueue()
    const newQueue = queue.filter((a) => a.id !== actionId)
    await saveQueue(newQueue)
}

/**
 * Vide complètement la queue.
 * -> utile pour debug / reset
 */
export async function clearQueue(): Promise<void> {
    await Preferences.remove({ key: QUEUE_KEY })
}

import type { CardLocal } from '@/types/Card'

/**
 * Génère un id unique pour une action.
 * crypto.randomUUID() marche sur la plupart des navigateurs modernes.
 * (sinon on verra un fallback plus tard si besoin)
 */
function newActionId(): string {
    return crypto.randomUUID()
}

/**
 * Fabrique une action CREATE
 */
export function makeCreateAction(card: CardLocal) {
    return {
        id: newActionId(),
        type: 'CREATE' as const,
        payload: card,
        createdAt: new Date().toISOString()
    }
}

/**
 * Fabrique une action UPDATE
 */
export function makeUpdateAction(card: CardLocal) {
    return {
        id: newActionId(),
        type: 'UPDATE' as const,
        payload: card,
        createdAt: new Date().toISOString()
    }
}

/**
 * Fabrique une action DELETE
 */
export function makeDeleteAction(id: string) {
    return {
        id: newActionId(),
        type: 'DELETE' as const,
        payload: { id },
        createdAt: new Date().toISOString()
    }
}
