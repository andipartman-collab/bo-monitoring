import {
  buildNotifications,
  buildTodayTodoNotifications,
  NOTIFICATION_DEFINITIONS,
  formatDate
} from '../../services/notificationServiceV2.js'

const WO_TYPES = ['booking-no-show','booking-today','booking-h1','booking-h2','booking-h3','part-arrival-today']
const PART_TYPES = ['eta-not-found','eta-long-lead-time','potential-deadstock','eta-changed','eta-overdue']
let activeGroup = 'WO'
let selectedType = ''
let notificationData = null
let selectedRowsOverride = null

export function renderNotificationCenter() {
  return `<div class="notification-center-page"><div class="notification-center-summary" id="notification-center-summary">${renderSummarySkeleton()}</div><div class="notification-center-tabs"><button type="button" class="notification-center-tab active" data-notification-group="WO">WO</button><button type="button" class="notification-center-tab" data-notification-group="PART">PART</button></div><div id="notification-center-content"><div class="notification-center-loading">Memuat Notification Center...</div></div></div>`
}

export async function initNotificationCenter(params = {}) {
  activeGroup = PART_TYPES.includes(params.type) ? 'PART' : 'WO'
  selectedType = params.type || ''
  selectedRowsOverride = null
  notificationData = null
  bindGroupTabs()
  syncGroupTabState()

  try {
    notificationData = await buildNotifications()

    if (params.todayOnly && selectedType) {
      const todayData = await buildTodayTodoNotifications()
      selectedRowsOverride = todayData[selectedType] || []
    }

    renderNotificationContent()
  } catch (error) {
    console.error('GAGAL MEMUAT NOTIFICATION CENTER:', error)
    const content = document.getElementById('notification-center-content')
    if (content) content.innerHTML = `<div class="notification-center-error">${escapeHTML(error.message || 'Gagal memuat Notification Center.')}</div>`
  }
}

function bindGroupTabs() {
  document.querySelectorAll('[data-notification-group]').forEach(button => button.addEventListener('click', () => {
    activeGroup = button.dataset.notificationGroup || 'WO'
    selectedType = ''
    selectedRowsOverride = null
    syncGroupTabState()
    renderNotificationContent()
  }))
}

function syncGroupTabState() {
  document.querySelectorAll('[data-notification-group]').forEach(item => {
    item.classList.toggle('active', item.dataset.notificationGroup === activeGroup)
  })
}

function renderNotificationContent() {
  renderSummary()
  const content = document.getElementById('notification-center-content')
  if (!content) return
  if (selectedType) {
    content.innerHTML = renderNotificationDetail(selectedType)
    bindDetailBack()
    bindWOButtons()
    return
  }
  const types = activeGroup === 'WO' ? WO_TYPES : PART_TYPES
  content.innerHTML = `<div class="notification-center-card-grid">${types.map(renderNotificationCard).join('')}</div>`
  document.querySelectorAll('[data-notification-type]').forEach(card => card.addEventListener('click', () => {
    selectedType = card.dataset.notificationType || ''
    selectedRowsOverride = null
    renderNotificationContent()
  }))
}

function renderSummary() {
  const element = document.getElementById('notification-center-summary')
  if (!element || !notificationData) return
  const totalWO = WO_TYPES.reduce((sum, type) => sum + notificationData[type].length, 0)
  const totalPART = PART_TYPES.reduce((sum, type) => sum + notificationData[type].length, 0)
  element.innerHTML = `<div class="notification-summary-card total"><span>TOTAL NOTIFICATION</span><strong>${totalWO + totalPART}</strong></div><div class="notification-summary-card wo"><span>WO</span><strong>${totalWO}</strong></div><div class="notification-summary-card part"><span>PART</span><strong>${totalPART}</strong></div>`
}

function renderNotificationCard(type) {
  const definition = NOTIFICATION_DEFINITIONS[type]
  const count = notificationData[type]?.length || 0
  return `<button type="button" class="notification-card notification-card-${safeClass(type)}" data-notification-type="${type}"><div class="notification-card-top"><span class="notification-card-icon">${definition.icon}</span><strong>${definition.title}</strong><span class="notification-card-count">${count}</span></div></button>`
}

function renderNotificationDetail(type) {
  const definition = NOTIFICATION_DEFINITIONS[type]
  const rows = selectedRowsOverride || notificationData[type] || []
  return `<div class="notification-detail-header"><button type="button" class="notification-detail-back" id="notification-detail-back">← Kembali</button><div><h2>${definition.title}</h2></div></div><div class="notification-detail-action"><span>Suggest Action</span><strong>${definition.action}</strong></div><div class="notification-detail-table-card">${rows.length ? renderDetailTable(type, rows) : '<div class="notification-center-empty">Tidak ada data.</div>'}</div>`
}

function renderDetailTable(type, rows) {
  if (activeGroup === 'WO') return `<div class="notification-table-wrapper"><table class="notification-table"><thead><tr><th>No</th><th>No WO</th><th>SA</th><th>Customer</th><th>No Polisi</th><th>Model</th><th>Tgl Booking</th><th>Aksi</th></tr></thead><tbody>${rows.map((row,index)=>`<tr><td>${index+1}</td><td><strong>${escapeHTML(row.noWo)}</strong></td><td>${escapeHTML(row.sa)}</td><td>${escapeHTML(row.customer)}</td><td>${escapeHTML(row.noPolisi)}</td><td>${escapeHTML(row.model)}</td><td>${formatDate(row.tanggalBooking)}</td><td><button type="button" class="notification-detail-button" data-order-id="${escapeHTML(row.orderId)}">Detail</button></td></tr>`).join('')}</tbody></table></div>`

  return `<div class="notification-table-wrapper"><table class="notification-table"><thead><tr><th>No</th><th>No WO</th><th>SA</th><th>PNO</th><th>Nama Part</th><th>No Order</th><th>Tgl Order</th><th>ETA</th><th>Supply</th><th>Sisa</th>${type === 'eta-changed' ? '<th>ETA Lama</th><th>ETA Baru</th>' : ''}<th>Aksi</th></tr></thead><tbody>${rows.map((row,index)=>`<tr><td>${index+1}</td><td><strong>${escapeHTML(row.noWo)}</strong></td><td>${escapeHTML(row.sa)}</td><td>${escapeHTML(row.pno)}</td><td>${escapeHTML(row.namaPart)}</td><td>${escapeHTML(row.noOrder)}</td><td>${formatDate(row.tglOrder)}</td><td>${formatDate(row.eta)}</td><td>${row.supply}</td><td>${row.sisa}</td>${type === 'eta-changed' ? `<td>${formatDate(row.etaOld)}</td><td>${formatDate(row.etaNew)}</td>` : ''}<td><button type="button" class="notification-detail-button" data-order-id="${escapeHTML(row.orderId)}">Detail</button></td></tr>`).join('')}</tbody></table></div>`
}

function bindDetailBack() {
  document.getElementById('notification-detail-back')?.addEventListener('click', () => {
    selectedType = ''
    selectedRowsOverride = null
    renderNotificationContent()
  })
}

function bindWOButtons() {
  document.querySelectorAll('[data-order-id]').forEach(button => button.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('open-notification-wo-detail', { detail: { orderId: button.dataset.orderId } }))
  }))
}

function renderSummarySkeleton() {
  return `<div class="notification-summary-card"><span>TOTAL NOTIFICATION</span><strong>—</strong></div><div class="notification-summary-card"><span>WO</span><strong>—</strong></div><div class="notification-summary-card"><span>PART</span><strong>—</strong></div>`
}

function safeClass(value) { return String(value || '').toLowerCase().replaceAll(' ', '-').replaceAll('_', '-') }
function escapeHTML(value) { return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;') }
