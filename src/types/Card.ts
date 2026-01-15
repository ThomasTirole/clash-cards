// Types “fermés” (union types) : on limite les valeurs possibles.
// Ça aide l’IDE + évite les fautes de frappe.
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'
export type Role = 'troop' | 'spell' | 'building'

/**
 * ✅ CHANGEMENT 1 : on renomme Card -> CardCloud
 *
 * Pourquoi ?
 * Avant : Card représentait la forme “cloud” (Supabase).
 * Maintenant : on a aussi une forme “locale” (SQLite) avec des champs en plus.
 *
 * Donc on nomme explicitement :
 * - CardCloud : la carte telle qu’elle existe dans Supabase
 * - CardLocal : la carte telle qu’elle existe dans SQLite (offline-first)
 */

// Interface = “contrat” de forme pour un objet Card.
// Ce sont les champs exactement comme dans la table Supabase `cards`.
export interface CardCloud {
    id: string
    name: string
    rarity: Rarity
    elixir_cost: number
    role: Role
    hitpoints: number
    damage: number
    arena: number
    is_favorite: boolean
    created_at: string

    /**
     * ✅ AJOUT 1 : updated_at
     *
     * Pourquoi ?
     * En offline-first, on doit pouvoir comparer la version locale vs la version cloud.
     * updated_at sert à :
     * - savoir quelle version est la plus récente
     * - gérer les conflits
     * - implémenter une règle “local prioritaire” proprement
     */
    updated_at: string
}

/**
 * ✅ AJOUT 2 : CardLocal (forme SQLite)
 *
 * Pourquoi ?
 * Dans la base locale (SQLite), on garde les mêmes champs métier que Supabase,
 * mais on ajoute un champ technique pour l’offline-first.
 */
export interface CardLocal extends CardCloud {
    /**
     * 1 = synchronisée avec Supabase
     * 0 = modification locale en attente (offline)
     *
     * Pourquoi ?
     * Ça permet de repérer les cartes qui doivent être envoyées au cloud.
     */
    synced: number
}

/**
 * ✅ CHANGEMENT 2 : CardInsert et CardUpdate se basent sur CardCloud
 *
 * Pourquoi ?
 * - Ces types servent pour les appels Supabase (cloud).
 * - On ne met pas `synced` ici car c’est un champ local SQLite.
 *
 * Point clé offline-first :
 * - L’app génère l’UUID `id` (stable partout : SQLite + queue + Supabase).
 * - Supabase gère `created_at` et `updated_at` via defaults / triggers.
 */

// ✅ INSERT cloud : on envoie id + champs métier
// ❌ On n’envoie pas created_at / updated_at (gérés côté Supabase)
export type CardInsert = Omit<CardCloud, 'created_at' | 'updated_at'>

// ✅ UPDATE cloud : champs optionnels, mais jamais l’id
export type CardUpdate = Partial<Omit<CardInsert, 'id'>>
