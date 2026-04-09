import { createApp } from 'vue'
import App from './App.vue'
import './css/estilos.css'

// Router
import router from './router'

// FontAwesome
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faUserCircle,
  faEye,
  faEyeSlash,
  faPenToSquare,
  faCheck,
  faXmark,
  faMapPin,
  faEnvelope,
} from '@fortawesome/free-solid-svg-icons'

import {
  faInstagramSquare,
  faFacebookSquare,
  faSquareXTwitter,
} from '@fortawesome/free-brands-svg-icons'

library.add(
  faUserCircle,
  faEye,
  faEyeSlash,
  faPenToSquare,
  faCheck,
  faXmark,
  faEnvelope,
  faMapPin,
  faInstagramSquare,
  faFacebookSquare,
  faSquareXTwitter,
)

const app = createApp(App)
app.component('FontAwesomeIcon', FontAwesomeIcon)
app.use(router)
app.mount('#app')
