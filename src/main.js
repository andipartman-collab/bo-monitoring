import './styles/style.css'

import { testFirestore } from './services/firestoreTest.js'

import { renderSidebar } from './components/Sidebar.js'
import { renderTopbar } from './components/Topbar.js'
import {
  renderNewOrder,
  initNewOrder
} from './pages/NewOrder/NewOrder.js'


const app = document.querySelector('#app')


function renderApp() {

  app.innerHTML = `
    <div class="app-layout">

      ${renderSidebar()}

      <main class="main-content">

        ${renderTopbar(
          'New Order',
          'Buat Work Order baru dan tambahkan part yang diperlukan.'
        )}

        <section id="page-content">

          ${renderNewOrder()}

        </section>

      </main>

    </div>
  `


  initNewOrder()

}


renderApp()

testFirestore()