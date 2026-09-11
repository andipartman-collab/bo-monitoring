import './styles/style.css'
import './styles/dashboard.css'
import './styles/wo-detail-edit.css'
import './styles/wo-detail-ui.css'
import './styles/eta-update.css'
import './styles/all-order.css'


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
  initAllOrder,
  initAllOrderPage
} from './pages/AllOrder/AllOrder.js'


import {
  renderDashboard,
  initDashboard
} from './pages/Dashboard/Dashboard.js'


import {
  renderWODetail,
  initWODetail
} from './pages/WODetail/WODetail.js'


import {
  renderETAUpdate,
  initETAUpdate
} from './pages/ETAUpdate/ETAUpdate.js'


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
  initWODetailNavigation()
  renderPage(currentPage)
}


function renderPage(
  page,
  params = {}
) {

  const pageContent =
    document.getElementById('page-content')

  const topbarContainer =
    document.getElementById('topbar-container')

  if (!pageContent || !topbarContainer) {
    return
  }

  currentPage = page
  updateSidebarActiveState(page)

  if (page === 'all-order') {
    topbarContainer.innerHTML =
      renderTopbar(
        'All Order',
        'Daftar seluruh Work Order yang terdaftar.'
      )

    pageContent.innerHTML = renderAllOrder()
    initAllOrderPage()
    initAllOrder()
    return
  }

  if (page === 'wo-detail') {
    topbarContainer.innerHTML =
      renderTopbar(
        'WO Detail',
        'Detail Work Order dan daftar part yang dipesan.'
      )

    pageContent.innerHTML = renderWODetail()
    initWODetail(params.orderId)
    return
  }

  if (page === 'dashboard') {
    topbarContainer.innerHTML =
      renderTopbar(
        'Dashboard',
        'Monitoring Special Order Part.'
      )

    pageContent.innerHTML = renderDashboard()
    initDashboard()
    return
  }

  if (page === 'eta-update') {
    topbarContainer.innerHTML =
      renderTopbar(
        'Update ETA',
        'Update ETA Part secara otomatis dari file excel TPOS'
      )

    pageContent.innerHTML = renderETAUpdate()
    initETAUpdate()
    return
  }

  topbarContainer.innerHTML =
    renderTopbar(
      'New Order',
      'Buat Work Order baru dan tambahkan part yang akan dipesan.'
    )

  pageContent.innerHTML = renderNewOrder()
  initNewOrder()
}


function initNavigation() {

  const menuItems =
    document.querySelectorAll('.menu-item')

  menuItems.forEach(item => {
    item.addEventListener('click', event => {
      event.preventDefault()

      const page = item.dataset.page

      if (!page) {
        return
      }

      renderPage(page)
    })
  })
}


function initWODetailNavigation() {

  document.addEventListener(
    'open-wo-detail',
    event => {
      const orderId = event.detail?.orderId

      if (!orderId) {
        return
      }

      renderPage(
        'wo-detail',
        { orderId }
      )
    }
  )

  document.addEventListener(
    'back-to-all-order',
    () => {
      renderPage('all-order')
    }
  )

  document.addEventListener(
    'work-order-deleted',
    () => {
      renderPage('all-order')
    }
  )
}


function updateSidebarActiveState(page) {

  const menuItems =
    document.querySelectorAll('.menu-item')

  menuItems.forEach(item => {
    item.classList.toggle(
      'active',
      item.dataset.page === page
    )
  })
}


renderApp()

testFirestore()
