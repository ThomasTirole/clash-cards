import {createApp} from 'vue'
import App from './App.vue'
import router from './router';

import {IonicVue} from '@ionic/vue';
import {createPinia} from 'pinia';
import {useAuthStore} from '@/stores/authStore';

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* @import '@ionic/vue/css/palettes/dark.always.css'; */
/* @import '@ionic/vue/css/palettes/dark.class.css'; */
import '@ionic/vue/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

// 🔹 Création de l’app
const app = createApp(App)
    .use(IonicVue)

// 🔹 IMPORTANT : on garde une référence à Pinia
const pinia = createPinia()
app.use(pinia)

// 🔹 Router inchangé
app.use(router)

// 🔹 INITIALISATION AUTH (1 seule fois)
const authStore = useAuthStore(pinia)
authStore.init()

// 🔹 Mount final inchangé
router.isReady().then(() => {
    app.mount('#app')
})
