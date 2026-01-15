import { getDB } from '@/services/sqliteService'
import type { CardCloud, CardLocal } from '@/types/Card'

/**
 * Récupère toutes les cartes depuis SQLite
 * -> l'UI peut s'afficher même sans réseau
 */
export async function getAllLocalCards(): Promise<CardLocal[]> {
    const db = getDB()

    // Tri par "updated_at" (plus récent en premier)
    const res = await db.query('SELECT * FROM cards ORDER BY updated_at DESC;')

    // SQLite renvoie parfois des nombres/booleans sous forme "0/1"
    // On normalise pour avoir un objet CardLocal propre
    return (res.values ?? []).map((row: any) => ({
        ...row,
        elixir_cost: Number(row.elixir_cost),
        hitpoints: Number(row.hitpoints),
        damage: Number(row.damage),
        arena: Number(row.arena),
        is_favorite: Boolean(row.is_favorite),
        synced: Number(row.synced)
    })) as CardLocal[]
}

/**
 * Crée une carte dans SQLite
 * - synced = 0 car pas encore synchronisée
 * - created_at / updated_at = now (pour le local)
 */
export async function createLocalCard(card: CardLocal): Promise<void> {
    const db = getDB()

    await db.run(
        `
            INSERT INTO cards (
                id, name, rarity, elixir_cost, role,
                hitpoints, damage, arena, is_favorite,
                created_at, updated_at, synced
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `,
        [
            card.id,
            card.name,
            card.rarity,
            card.elixir_cost,
            card.role,
            card.hitpoints,
            card.damage,
            card.arena,
            card.is_favorite ? 1 : 0,
            card.created_at,
            card.updated_at,
            0 // ✅ offline-first : modification locale en attente
        ]
    )
}

/**
 * Met à jour une carte dans SQLite (offline-first)
 * - updated_at = now
 * - synced = 0 (à renvoyer au cloud)
 */
export async function updateLocalCard(card: CardLocal): Promise<void> {
    const db = getDB()
    const now = new Date().toISOString()

    await db.run(
        `
            UPDATE cards
            SET
                name = ?,
                rarity = ?,
                elixir_cost = ?,
                role = ?,
                hitpoints = ?,
                damage = ?,
                arena = ?,
                is_favorite = ?,
                updated_at = ?,
                synced = ?
            WHERE id = ?;
        `,
        [
            card.name,
            card.rarity,
            card.elixir_cost,
            card.role,
            card.hitpoints,
            card.damage,
            card.arena,
            card.is_favorite ? 1 : 0,
            now,
            0,
            card.id
        ]
    )
}

/**
 * Supprime une carte de SQLite
 * -> si offline, on stockera aussi l’action dans la queue (chapitre 9.5)
 */
export async function deleteLocalCard(id: string): Promise<void> {
    const db = getDB()
    await db.run('DELETE FROM cards WHERE id = ?;', [id])
}

/**
 * Insère ou met à jour plusieurs cartes dans SQLite
 * -> utilisé après un fetch Supabase
 * -> synced = 1 car les données viennent du cloud
 */
export async function upsertManyLocalCards(cards: CardCloud[]): Promise<void> {
    const db = getDB()

    for (const c of cards) {
        await db.run(
            `
                INSERT INTO cards (
                    id, name, rarity, elixir_cost, role,
                    hitpoints, damage, arena, is_favorite,
                    created_at, updated_at, synced
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                    name = excluded.name,
                                           rarity = excluded.rarity,
                                           elixir_cost = excluded.elixir_cost,
                                           role = excluded.role,
                                           hitpoints = excluded.hitpoints,
                                           damage = excluded.damage,
                                           arena = excluded.arena,
                                           is_favorite = excluded.is_favorite,
                                           created_at = excluded.created_at,
                                           updated_at = excluded.updated_at,
                                           synced = excluded.synced;
            `,
            [
                c.id,
                c.name,
                c.rarity,
                c.elixir_cost,
                c.role,
                c.hitpoints,
                c.damage,
                c.arena,
                c.is_favorite ? 1 : 0,
                c.created_at,
                c.updated_at,
                1
            ]
        )
    }
}
