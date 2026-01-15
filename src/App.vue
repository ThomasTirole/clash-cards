<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';

import { watch, onMounted } from 'vue'
import { toastController } from '@ionic/vue'
import { useNetworkStore } from '@/stores/networkStore'

/**
 * Store réseau global
 */
const network = useNetworkStore()

/**
 * Fonction utilitaire : affiche un toast simple
 */
async function showToast(message: string, duration = 5000) {
  const toast = await toastController.create({
    message,
    duration,
    position: 'top'
  })
  await toast.present()
  return toast
}

onMounted(async () => {
  // Toast temporaire : vérification réseau en cours
  const checkingToast = await showToast('⏳ Vérification du réseau…', 0)

  // Petite pause pour s'assurer que le store est prêt
  await new Promise(r => setTimeout(r, 50))

  // Fermeture du toast de vérification
  await checkingToast.dismiss()

  // Toast résultat
  if (network.connected) {
    await showToast('🟢 Connecté au réseau')
  } else {
    await showToast('🔴 Réseau déconnecté (mode hors-ligne)')
  }
})

watch(
    () => network.connected,
    async (connected, oldConnected) => {
      /**
       * oldConnected est undefined uniquement
       * lors du premier appel du watcher.
       * On l’ignore pour éviter un toast inutile au démarrage.
       */
      if (oldConnected === undefined) return

      if (!connected) {
        await showToast('🔴 Réseau déconnecté (mode hors-ligne)')
      } else {
        await showToast('🟢 Connecté au réseau')
      }
    },
    { immediate: true }
)
</script>
