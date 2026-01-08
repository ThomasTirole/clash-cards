<template>
  <ion-page>
    <!-- Header Ionic -->
    <ion-header>
      <ion-toolbar>
        <ion-title>Auth</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- ✅ Si connecté : afficher user + bouton logout -->
      <div v-if="auth.isLoggedIn">
        <ion-card>
          <ion-card-header>
            <ion-card-title>✅ Connected</ion-card-title>

            <!-- Email du user connecté -->
            <ion-card-subtitle>{{ auth.user?.email }}</ion-card-subtitle>
          </ion-card-header>

          <ion-card-content>
            <!-- Logout : désactivé pendant loading -->
            <ion-button
                expand="block"
                color="danger"
                @click="auth.logout()"
                :disabled="auth.loading"
            >
              Logout
            </ion-button>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- ❌ Sinon : formulaire login/register -->
      <div v-else>
        <!-- Segment = switch entre Login et Register -->
        <ion-segment v-model="mode" class="ion-margin-bottom">
          <ion-segment-button value="login">
            <ion-label>Login</ion-label>
          </ion-segment-button>
          <ion-segment-button value="register">
            <ion-label>Register</ion-label>
          </ion-segment-button>
        </ion-segment>

        <ion-card>
          <ion-card-header>
            <ion-card-title>
              {{ mode === 'login' ? 'Login' : 'Create an account' }}
            </ion-card-title>
          </ion-card-header>

          <ion-card-content>
            <!-- Email -->
            <ion-item>
              <ion-input
                  label="Email"
                  label-placement="stacked"
                  type="email"
                  v-model="email"
                  autocomplete="email"
              />
            </ion-item>

            <!-- Password -->
            <ion-item>
              <ion-input
                  label="Password"
                  label-placement="stacked"
                  type="password"
                  v-model="password"
                  autocomplete="current-password"
              />
            </ion-item>

            <!-- Afficher erreur si le store en a une -->
            <ion-text color="danger" v-if="auth.error">
              <p>{{ auth.error }}</p>
            </ion-text>

            <!-- Bouton submit :
                 - désactivé si loading ou champs vides -->
            <ion-button
                expand="block"
                class="ion-margin-top"
                @click="submit"
                :disabled="auth.loading || !email || !password"
            >
              {{ mode === 'login' ? 'Login' : 'Register' }}
            </ion-button>

            <!-- Spinner si loading -->
            <ion-spinner v-if="auth.loading" class="ion-margin-top" />
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
/**
 * Page Auth :
 * - utilise authStore (Pinia)
 * - gère un mini état local : email, password, mode
 */
import { ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'

import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonItem, IonInput, IonButton, IonText, IonSpinner,
  IonSegment, IonSegmentButton, IonLabel
} from '@ionic/vue'

// Store Auth (session/user)
const auth = useAuthStore()

// mode = login ou register
const mode = ref<'login' | 'register'>('login')

// Champs du formulaire
const email = ref('')
const password = ref('')

/**
 * submit :
 * - si mode = login => auth.login(...)
 * - si mode = register => auth.register(...)
 */
async function submit() {
  if (mode.value === 'login') {
    await auth.login(email.value, password.value)
  } else {
    await auth.register(email.value, password.value)
  }
}
</script>
