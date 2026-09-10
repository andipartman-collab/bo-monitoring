import './styles/style.css'


import { testFirestore }
  from './services/firestoreTest.js'


import { renderSidebar }
  from './components/Sidebar.js'


import { renderTopbar }
  from './components/Topbar.js'


import {
  renderNewOrder,
  initNewOrder
} from './pages/NewOrder/NewOrder.js'


import {
  renderAllOrder,
  initAllOrder
} from './pages/AllOrder/AllOrder.js'


import {
  renderDashboard
} from './pages/Dashboard/Dashboard.js'


const app =
  document.querySelector(
    '#app'
  )


let currentPage =
  'new-order'


function renderApp() {

  app.innerHTML = `

    <div class="app-layout">

      ${renderSidebar()}


      <main class="main-content">

        <div id="topbar-container"></div>


        <section id="page-content"></section>

      </main>

    </div>

  `


  initNavigation()

  renderPage(
    currentPage
  )

}


function renderPage(
  page
) {

  const pageContent =
    document.getElementById(
      'page-content'
    )


  const topbarContainer =
    document.getElementById(
      'topbar-container'
    )


  if (
    !pageContent ||
    !topbarContainer
  ) {

    return

  }


  currentPage =
    page


  updateSidebarActiveState(
    page
  )


  if (
    page ===
    'all-order'
  ) {

    topbarContainer.innerHTML =
      renderTopbar(
        'All Order',
        'Daftar seluruh Work Order yang terdaftar.'
      )


    pageContent.innerHTML =
      renderAllOrder()


    initAllOrder()

    return

  }


  if (
    page ===
    'dashboard'
  ) {

    topbarContainer.innerHTML =
      renderTopbar(
        'Dashboard',
        'Monitoring Back Order Spare Part.'
      )


    pageContent.innerHTML =
      renderDashboard()

    return

  }


  topbarContainer.innerHTML =
    renderTopbar(
      'New Order',
      'Buat Work Order baru dan tambahkan part yang diperlukan.'
    )


  pageContent.innerHTML =
    renderNewOrder()


  initNewOrder()

}


function initNavigation() {

  const menuItems =
    document.querySelectorAll(
      '.menu-item'
    )


  menuItems.forEach(
    item => {

      item.addEventListener(
        'click',
        event => {

          event.preventDefault()


          const page =
            item.dataset.page


          if (!page) {
            return
          }


          renderPage(
            page
          )

        }
      )

    }
  )

}


function updateSidebarActiveState(
  page
) {

  const menuItems =
    document.querySelectorAll(
      '.menu-item'
    )


  menuItems.forEach(
    item => {

      item.classList.toggle(
        'active',
        item.dataset.page === page
      )

    }
  )

}


renderApp()


testFirestore()