import type { CardLocal } from '@/types/Card'

/**
 * Une action offline représente une “intention utilisateur”
 * à rejouer plus tard sur Supabase.
 *
 * - id : identifiant unique de l’action (pour la retirer après sync)
 * - type : CREATE / UPDATE / DELETE
 * - payload : données nécessaires pour rejouer l’action
 * - createdAt : timestamp de l’action (utile pour debug + ordre)
 */
export type OfflineAction =
    | {
    id: string
    type: 'CREATE'
    payload: CardLocal
    createdAt: string
}
    | {
    id: string
    type: 'UPDATE'
    payload: CardLocal
    createdAt: string
}
    | {
    id: string
    type: 'DELETE'
    payload: { id: string } // on a juste besoin de l’id à supprimer
    createdAt: string
}
