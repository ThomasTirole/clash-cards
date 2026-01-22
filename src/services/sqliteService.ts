import {
    CapacitorSQLite,
    SQLiteConnection,
    SQLiteDBConnection
} from '@capacitor-community/sqlite'

/**
 * Connexion SQLite globale
 */
const sqlite = new SQLiteConnection(CapacitorSQLite)

let db: SQLiteDBConnection | null = null

/**
 * Petit helper : attendre que <jeep-sqlite> soit prêt sur le Web
 */
/*
async function waitForJeepSqlite() {
    if (Capacitor.getPlatform() !== 'web') return

    // On attend que le custom element soit défini
    await customElements.whenDefined('jeep-sqlite')

    // Et on attend qu’il soit présent dans le DOM
    const el = document.querySelector('jeep-sqlite') as any
    if (!el) {
        throw new Error('Missing <jeep-sqlite> element in DOM (needed for web)')
    }

    // Selon versions, le composant expose `componentOnReady()`
    if (typeof el.componentOnReady === 'function') {
        await el.componentOnReady()
    }
}
*/

/**
 * Initialise la base SQLite locale
 * - ouvre la base
 * - crée la table cards si nécessaire
 */
export async function initDB() {

    // Sur le Web, attendre que <jeep-sqlite> soit prêt
    //await waitForJeepSqlite()
/*
    // ✅ IMPORTANT pour le Web (IndexedDB via jeep-sqlite)
    if (Capacitor.getPlatform() === 'web') {
        await sqlite.initWebStore()
    }*/

    // Ouverture (ou création) de la base locale
    db = await sqlite.createConnection(
        'cards-db', // nom de la base
        false,
        'no-encryption',
        1,
        false
    )

    await db.open()

    // Création de la table cards
    const createTableSQL = `
        CREATE TABLE IF NOT EXISTS cards (
                                             id TEXT PRIMARY KEY NOT NULL,
                                             name TEXT NOT NULL,
                                             rarity TEXT NOT NULL,
                                             elixir_cost INTEGER NOT NULL,
                                             role TEXT NOT NULL,
                                             hitpoints INTEGER NOT NULL,
                                             damage INTEGER NOT NULL,
                                             arena INTEGER NOT NULL,
                                             is_favorite INTEGER NOT NULL,
                                             created_at TEXT NOT NULL,
                                             updated_at TEXT NOT NULL,
                                             synced INTEGER NOT NULL
        );
    `
    await db.execute(createTableSQL)
}

/**
 * Accès sécurisé à la base
 */
export function getDB(): SQLiteDBConnection {
    if (!db) {
        throw new Error('SQLite DB not initialized')
    }
    return db
}
