// Types “fermés” (union types) : on limite les valeurs possibles.
// Ça aide l’IDE + évite les fautes de frappe.
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'
export type Role = 'troop' | 'spell' | 'building'

// Interface = “contrat” de forme pour un objet Card.
// Ce sont les champs exactement comme dans la table Supabase `cards`.
export interface Card {
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
}

// Quand on crée une carte, Supabase génère `id` et `created_at`.
// Donc côté front on ne les fournit pas.
export type CardInsert = Omit<Card, 'id' | 'created_at'>

// Quand on modifie une carte, on ne modifie pas forcément tout.
// Partial = tous les champs deviennent optionnels.
export type CardUpdate = Partial<CardInsert>
