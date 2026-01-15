import { supabase } from '@/lib/supabase'
import type { CardCloud, CardInsert, CardUpdate } from '@/types/Card'

/**
 * Récupère toutes les cartes depuis Supabase.
 * - select('*') : récupère toutes les colonnes
 * - order('created_at') : tri pour afficher les plus récentes en premier
 */
export async function fetchCards(): Promise<CardCloud[]> {
    const { data, error } = await supabase
        .from('cards') // table
        .select('*')
        .order('created_at', { ascending: false })

    // Toujours gérer l’erreur : sinon on “échoue silencieusement”
    if (error) throw error

    // data peut être null, donc on retourne [] par défaut
    return (data ?? []) as CardCloud[]
}

/**
 * Crée une carte.
 * - insert(payload) : ajoute une ligne
 * - select('*').single() : on veut récupérer la ligne créée directement
 */
export async function createCard(payload: CardInsert): Promise<CardCloud> {
    const { data, error } = await supabase
        .from('cards')
        .insert(payload)
        .select('*')   // demande à Supabase de renvoyer la ligne créée
        .single()      // on veut un objet (pas un tableau)

    if (error) throw error
    return data as CardCloud
}

/**
 * Met à jour une carte (PATCH).
 * - update(patch) : met à jour les champs fournis
 * - eq('id', id) : cible la bonne carte
 * - select('*').single() : renvoie la carte mise à jour
 */
export async function updateCard(id: string, patch: CardUpdate): Promise<CardCloud> {
    const { data, error } = await supabase
        .from('cards')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single()

    if (error) throw error
    return data as CardCloud
}

/**
 * Supprime une carte par id.
 * Ici on ne renvoie rien : void.
 */
export async function deleteCard(id: string): Promise<void> {
    const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', id)

    if (error) throw error
}


