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


import {
  renderWODetail,
  initWODetail
} from './pages/WODetail/WODetail.js'


const app =
  document.querySelector(
    '#app'
  )


let currentPage =
  'new-order'


/*
  ==================================================
  RENDER APP
  ==================================================
*/

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

  initWODetailNavigation()


  renderPage(
    currentPage
  )

}


/*
  ==================================================
  RENDER PAGE
  ==================================================
*/

function renderPage(
  page,
  params = {}
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


  /*
    ==========================================
    ALL ORDER
    ==========================================
  */

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


  /*
    ==========================================
    WO DETAIL
    ==========================================
  */

  if (
    page ===
    'wo-detail'
  ) {

    topbarContainer.innerHTML =
      renderTopbar(
        'WO Detail',
        'Detail Work Order dan daftar part yang dipesan.'
      )


    pageContent.innerHTML =
      renderWODetail()


    initWODetail(
      params.orderId
    )

    return

  }


  /*
    ==========================================
    DASHBOARD
    ==========================================
  */

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


  /*
    ==========================================
    NEW ORDER
    ==========================================
  */

  topbarContainer.innerHTML =
    renderTopbar(
      'New Order',
      'Buat Work Order baru dan tambahkan part yang diperlukan.'
    )


  pageContent.innerHTML =
    renderNewOrder()


  initNewOrder()

}


/*
  ==================================================
  INIT SIDEBAR NAVIGATION
  ==================================================
*/

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


/*
  ==================================================
  INIT WO DETAIL NAVIGATION
  ==================================================
*/

function initWODetailNavigation() {

  /*
    ------------------------------------------
    BUKA WO DETAIL
    ------------------------------------------
  */

  document.addEventListener(
    'open-wo-detail',
    event => {

      const orderId =
        event.detail?.orderId


      if (!orderId) {

        return

      }


      console.log(
        'BUKA WO DETAIL:',
        orderId
      )


      renderPage(
        'wo-detail',
        {
          orderId
        }
      )

    }
  )


  /*
    ------------------------------------------
    KEMBALI KE ALL ORDER
    ------------------------------------------
  */

  document.addEventListener(
    'back-to-all-order',
    () => {

      renderPage(
        'all-order'
      )

    }
  )

}


/*
  ==================================================
  UPDATE SIDEBAR ACTIVE STATE
  ==================================================
*/

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


/*
  ==================================================
  START APPLICATION
  ==================================================
*/

renderApp()


/*
  ==================================================
  TEST FIRESTORE
  ==================================================
*/

testFirestore()