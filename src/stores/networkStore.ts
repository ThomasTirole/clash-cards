import { defineStore } from 'pinia'
import { Network } from '@capacitor/network'

/**
 * Store réseau :
 * - contient l’état de connectivité
 * - écoute les changements envoyés par l’OS (ou le navigateur)
 */
export const useNetworkStore = defineStore('network', {
    state: () => ({
        // true = online, false = offline
        connected: true,

        // ex: 'wifi', 'cellular', 'none', 'unknown'
        connectionType: 'unknown' as string
    }),

    actions: {
        /**
         * init():
         * 1) récupère l’état réseau au démarrage
         * 2) écoute les changements de connectivité
         *
         * Note :
         * On ne met PAS de UI ici (pas de toast dans le store).
         * Le store garde seulement l’état.
         */
        async init() {
            // 1) Statut au démarrage
            const status = await Network.getStatus()
            this.connected = status.connected
            this.connectionType = status.connectionType

            // 2) Listener des changements (OS → app)
            Network.addListener('networkStatusChange', (status) => {
                this.connected = status.connected
                this.connectionType = status.connectionType
            })
        }
    }
})
