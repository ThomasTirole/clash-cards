<template>
  <ion-page>
    <!-- HEADER -->
    <ion-header>
      <ion-toolbar>
        <ion-title>Cards</ion-title>

        <!-- Bouton Add à droite -->
        <ion-buttons slot="end">
          <ion-badge v-if="auth.isLoggedIn">{{ auth.user?.email }}</ion-badge>
          <ion-button @click="openCreate()">+ Add</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <!-- CONTENU -->
    <ion-content class="ion-padding">
      <!-- Pull-to-refresh Ionic -->
      <ion-refresher slot="fixed" @ionRefresh="onRefresh">
        <ion-refresher-content />
      </ion-refresher>

      <!-- Affichage erreur store -->
      <ion-text color="danger" v-if="store.error">
        <p>{{ store.error }}</p>
      </ion-text>

      <!-- Spinner pendant le chargement -->
      <ion-spinner v-if="store.loading" />

      <!-- Liste de cartes (quand loading = false) -->
      <ion-list v-else>
        <ion-card v-for="c in store.cards" :key="c.id">
          <ion-card-header>
            <ion-card-title class="card-title">
              <!-- Nom + badge coût -->
              {{ c.name }}
              <ion-badge>{{ c.elixir_cost }}</ion-badge>
            </ion-card-title>

            <ion-card-subtitle>
              <!-- Badges “meta” -->
              <ion-badge>{{ c.rarity }}</ion-badge>
              <ion-badge>{{ c.role }}</ion-badge>
              <ion-badge>arena {{ c.arena }}</ion-badge>
            </ion-card-subtitle>
          </ion-card-header>

          <ion-card-content>
            <!-- Stats simples -->
            <ion-grid>
              <ion-row>
                <ion-col>❤️ HP: {{ c.hitpoints }}</ion-col>
                <ion-col>⚔️ DMG: {{ c.damage }}</ion-col>
              </ion-row>
            </ion-grid>

            <!-- Actions CRUD -->
            <div class="actions">
              <ion-button size="small" fill="outline" @click="store.toggleFavorite(c.id)">
                {{ c.is_favorite ? '★ Favorite' : '☆ Favorite' }}
              </ion-button>

              <ion-button size="small" @click="openEdit(c)">Edit</ion-button>

              <!-- Supprime directement (simple) -->
              <ion-button size="small" color="danger" @click="store.remove(c.id)">
                Delete
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>
      </ion-list>

      <!-- MODAL Create/Edit (même modal pour les deux) -->
      <ion-modal :is-open="modalOpen" @didDismiss="closeModal">
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ editing ? 'Edit card' : 'New card' }}</ion-title>

            <ion-buttons slot="end">
              <ion-button @click="closeModal">Close</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
          <!-- Formulaire : champs -> form (reactive) -->

          <ion-item>
            <ion-input
                label="Name"
                label-placement="stacked"
                v-model="form.name"
            />
          </ion-item>

          <ion-item>
            <ion-select label="Rarity" label-placement="stacked" v-model="form.rarity">
              <ion-select-option value="common">common</ion-select-option>
              <ion-select-option value="rare">rare</ion-select-option>
              <ion-select-option value="epic">epic</ion-select-option>
              <ion-select-option value="legendary">legendary</ion-select-option>
            </ion-select>
          </ion-item>

          <ion-item>
            <ion-select label="Role" label-placement="stacked" v-model="form.role">
              <ion-select-option value="troop">troop</ion-select-option>
              <ion-select-option value="spell">spell</ion-select-option>
              <ion-select-option value="building">building</ion-select-option>
            </ion-select>
          </ion-item>

          <!-- v-model.number : convertit automatiquement en number -->
          <ion-item>
            <ion-input
                type="number"
                label="Elixir cost (1-10)"
                label-placement="stacked"
                v-model.number="form.elixir_cost"
            />
          </ion-item>

          <ion-item>
            <ion-input
                type="number"
                label="Hitpoints"
                label-placement="stacked"
                v-model.number="form.hitpoints"
            />
          </ion-item>

          <ion-item>
            <ion-input
                type="number"
                label="Damage"
                label-placement="stacked"
                v-model.number="form.damage"
            />
          </ion-item>

          <ion-item>
            <ion-input
                type="number"
                label="Arena"
                label-placement="stacked"
                v-model.number="form.arena"
            />
          </ion-item>

          <ion-item>
            <ion-toggle v-model="form.is_favorite">
              Favorite
            </ion-toggle>
          </ion-item>

          <!-- Submit : create ou edit selon editing -->
          <ion-button expand="block" class="ion-margin-top" @click="submit">
            {{ editing ? 'Save changes' : 'Create' }}
          </ion-button>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
/**
 * Composition API
 * - ref : pour des valeurs primitives (modalOpen, editing)
 * - reactive : pour l’objet form (plus pratique qu’un ref d’objet ici)
 */
import { reactive, ref, onMounted } from 'vue'
import { useCardsStore } from '@/stores/cardsStore'
import type { CardLocal, CardInsert, Rarity, Role } from '@/types/Card'
import { useAuthStore } from '@/stores/authStore'

const auth = useAuthStore()

/**
 * Imports Ionic : uniquement ce qu’on utilise
 * (évite de tout importer “au hasard”)
 */
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonBadge, IonButton, IonButtons, IonText, IonSpinner,
  IonModal, IonItem, IonInput, IonSelect, IonSelectOption, IonToggle,
  IonGrid, IonRow, IonCol,
  IonRefresher, IonRefresherContent
} from '@ionic/vue'

/**
 * Store Pinia :
 * - store.cards = données
 * - store.loadFromLocal() = charge depuis SQLite
 */
const store = useCardsStore()

/** Ouverture/fermeture du modal */
const modalOpen = ref(false)

/**
 * editing = null => mode “create”
 * editing = Card => mode “edit”
 */
const editing = ref<null | CardLocal>(null)

/**
 * Formulaire (valeurs par défaut).
 * Type CardInsert = tous les champs nécessaires à l’insertion.
 */
const form = reactive<CardInsert>({
  name: '',
  rarity: 'common' as Rarity,
  elixir_cost: 3,
  role: 'troop' as Role,
  hitpoints: 500,
  damage: 100,
  arena: 1,
  is_favorite: false
})

/** Au chargement de la page, on récupère les cartes */
onMounted(() => {
  store.loadFromLocal()
})

/** Remet le form dans son état “neuf” */
function resetForm() {
  form.name = ''
  form.rarity = 'common'
  form.elixir_cost = 3
  form.role = 'troop'
  form.hitpoints = 500
  form.damage = 100
  form.arena = 1
  form.is_favorite = false
}

/** Ouvre le modal en mode création */
function openCreate() {
  editing.value = null
  resetForm()
  modalOpen.value = true
}

/** Ouvre le modal en mode édition et copie la carte dans le form */
function openEdit(card: CardLocal) {
  editing.value = card

  // On copie les champs dans le formulaire
  form.name = card.name
  form.rarity = card.rarity
  form.elixir_cost = card.elixir_cost
  form.role = card.role
  form.hitpoints = card.hitpoints
  form.damage = card.damage
  form.arena = card.arena
  form.is_favorite = card.is_favorite

  modalOpen.value = true
}

/** Ferme le modal */
function closeModal() {
  modalOpen.value = false
}

/**
 * submit :
 * - si editing != null => update
 * - sinon => insert
 */
async function submit() {
  // Validation minimale : name obligatoire
  if (!form.name.trim()) return

  if (editing.value) {
    await store.edit(editing.value.id, { ...form })
  } else {
    await store.add({ ...form })
  }

  closeModal()
}

async function onRefresh(ev: CustomEvent) {
  await store.refresh()
  const refresher = ev.target as HTMLIonRefresherElement
  refresher.complete()
}

</script>

<style scoped>
/* Alignement titre + badge coût */
.card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

/* Ligne de boutons responsive */
.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px;
}
</style>
