import './styles/style.css'
import './styles/dashboard.css'
import './styles/monitoring-sa.css'
import './styles/wo-detail-edit.css'
import './styles/wo-detail-ui.css'
import './styles/eta-update.css'
import './styles/ata-update.css'
import './styles/all-order.css'
import './styles/notification-center.css'

import { testFirestore } from './services/firestoreTest.js'
import { renderSidebar } from './components/Sidebar.js'
import { renderTopbar } from './components/Topbar.js'
import { renderNewOrder, initNewOrder } from './pages/NewOrder/NewOrder.js'
import { renderAllOrder, initAllOrder, initAllOrderPage } from './pages/AllOrder/AllOrder.js'
import { renderDashboard, initDashboard } from './pages/Dashboard/Dashboard.js'
import { renderMonitoringSA, initMonitoringSA } from './pages/MonitoringSA/MonitoringSA.js'
import { renderWODetail, initWODetail } from './pages/WODetail/WODetail.js'
import { renderETAUpdate, initETAUpdate } from './pages/ETAUpdate/ETAUpdate.js'
import { renderATAUpdate, initATAUpdate } from './pages/ATAUpdate/ATAUpdate.js'
import { renderNotificationCenter, initNotificationCenter } from './pages/NotificationCenter/NotificationCenter.js'

const app = document.querySelector('#app')
let currentPage = 'dashboard'

function renderApp() {
  app.innerHTML = `<div class="app-layout">${renderSidebar()}<main class="main-content"><div id="topbar-container"></div><section id="page-content"></section></main></div>`
  initNavigation()
  initWODetailNavigation()
  initDashboardNavigation()
  renderPage(currentPage)
}

function renderPage(page, params = {}) {
  const pageContent = document.getElementById('page-content')
  const topbarContainer = document.getElementById('topbar-container')
  if (!pageContent || !topbarContainer) return

  currentPage = page
  updateSidebarActiveState(page)

  if (page === 'all-order') {
    topbarContainer.innerHTML = renderTopbar('All Order', 'Daftar seluruh Work Order yang terdaftar.')
    pageContent.innerHTML = renderAllOrder()
    initAllOrderPage()
    initAllOrder(params)
    return
  }

  if (page === 'wo-detail') {
    topbarContainer.innerHTML = renderTopbar(params.readOnly ? 'WO Detail — Read Only' : 'WO Detail', params.readOnly ? 'Detail Work Order berdasarkan Monitoring SA. Akses hanya baca.' : 'Detail Work Order dan daftar part yang dipesan.')
    pageContent.innerHTML = renderWODetail({ readOnly: Boolean(params.readOnly) })
    initWODetail(params.orderId, { readOnly: Boolean(params.readOnly), backEvent: params.backEvent || 'back-to-all-order' })
    return
  }

  if (page === 'dashboard') {
    topbarContainer.innerHTML = renderTopbar('Dashboard', 'Monitoring Special Order Part.')
    pageContent.innerHTML = renderDashboard()
    initDashboard()
    return
  }

  if (page === 'monitoring-sa') {
    topbarContainer.innerHTML = renderTopbar('Monitoring by SA', 'Monitoring Work Order berdasarkan SA.')
    pageContent.innerHTML = renderMonitoringSA()
    initMonitoringSA({ sa: params.sa || '' })
    return
  }

  if (page === 'notification-center') {
    topbarContainer.innerHTML = renderTopbar('Notification Center', 'Kondisi Work Order dan Part yang membutuhkan perhatian.')
    pageContent.innerHTML = renderNotificationCenter()
    initNotificationCenter({ type: params.type || '', sa: params.sa || '', todayOnly: Boolean(params.todayOnly) })
    return
  }

  if (page === 'eta-update') {
    topbarContainer.innerHTML = renderTopbar('Update ETA', 'Update Estimate Time Arrival Part Secara Otomatis Menggunakan Data TPOS')
    pageContent.innerHTML = renderETAUpdate()
    initETAUpdate()
    return
  }

  if (page === 'ata-update') {
    topbarContainer.innerHTML = renderTopbar('Update ATA', 'Update Actual Time Arrival Part Secara Otomatis Menggunakan Data TPOS')
    pageContent.innerHTML = renderATAUpdate()
    initATAUpdate()
    return
  }

  topbarContainer.innerHTML = renderTopbar('New Order', 'Buat Work Order baru dan tambahkan part yang dipesan.')
  pageContent.innerHTML = renderNewOrder()
  initNewOrder()
}

function initNavigation() {
  document.querySelectorAll('.menu-item').forEach(item => item.addEventListener('click', event => {
    event.preventDefault()
    const page = item.dataset.page
    if (page) renderPage(page)
  }))
}

function initWODetailNavigation() {
  document.addEventListener('open-wo-detail', event => {
    const orderId = event.detail?.orderId
    if (orderId) renderPage('wo-detail', { orderId })
  })
  document.addEventListener('open-monitoring-sa-wo-detail', event => {
    const orderId = event.detail?.orderId
    if (orderId) renderPage('wo-detail', { orderId, readOnly: true, backEvent: 'back-to-monitoring-sa' })
  })
  document.addEventListener('open-notification-wo-detail', event => {
    const orderId = event.detail?.orderId
    if (orderId) renderPage('wo-detail', { orderId, readOnly: true, backEvent: 'back-to-notification-center' })
  })
  document.addEventListener('back-to-all-order', () => renderPage('all-order'))
  document.addEventListener('back-to-monitoring-sa', () => renderPage('monitoring-sa'))
  document.addEventListener('back-to-notification-center', () => renderPage('notification-center'))
  document.addEventListener('work-order-deleted', () => renderPage('all-order'))
  document.addEventListener('open-notification-center', event => {
    renderPage('notification-center', { type: event.detail?.type || '', sa: event.detail?.sa || '', todayOnly: true })
  })
  document.addEventListener('open-monitoring-sa', event => {
    renderPage('monitoring-sa', { sa: event.detail?.sa || '' })
  })
}

function initDashboardNavigation() {
  document.addEventListener('open-all-order-filter', event => renderPage('all-order', { statusFilter: event.detail?.statusFilter || '' }))
}

function updateSidebarActiveState(page) {
  document.querySelectorAll('.menu-item').forEach(item => item.classList.toggle('active', item.dataset.page === page))
}

renderApp()
testFirestore()
