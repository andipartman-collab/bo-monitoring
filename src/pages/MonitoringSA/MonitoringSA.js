import { getOrders, getOrderDetail } from '../../services/orderService.js'
import { getOrderStatus } from '../../services/orderStatusService.js'

const SA_LIST = [
  'ADN', 'AGS', 'ALF', 'ANT', 'DWI', 'EKS',
  'HDS', 'IND', 'LUT', 'NUR', 'VIK', 'OTHERS'
]

const PAGE_SIZE = 200
let selectedSA = ''

export function renderMonitoringSA() {
  if (selectedSA) return renderSAOrders(selectedSA)

  return `
    <div class="monitoring-sa-page">
      <div class="monitoring-sa-grid" id="monitoring-sa-grid">
        ${SA_LIST.map(sa => `
          <button type="button" class="monitoring-sa-card" data-sa="${sa}">
            <div class="monitoring-sa-avatar">👤</div>
            <strong class="monitoring-sa-name">${sa}</strong>
            <span class="monitoring-sa-order-count" id="monitoring-sa-count-${sa}">Memuat...</span>
          </button>
        `).join('')}
      </div>
    </div>
  `
}

function renderSAOrders(sa) {
  return `
    <div class="monitoring-sa-page">
      <button type="button" id="monitoring-sa-back" class="monitoring-sa-back-button">
        ← Kembali ke Daftar SA
      </button>

      <div class="monitoring-sa-detail-header">
        <div class="monitoring-sa-detail-avatar">👤</div>
        <div>
          <h2>Monitoring SA — ${sa}</h2>
          <p>Daftar Work Order aktif milik SA ${sa}.</p>
        </div>
      </div>

      <div class="monitoring-sa-summary" id="monitoring-sa-summary">Memuat summary...</div>

      <div class="monitoring-sa-table-card">
        <div class="monitoring-sa-loading" id="monitoring-sa-loading">Memuat data...</div>
        <div class="monitoring-sa-table-wrapper" id="monitoring-sa-table"></div>
      </div>
    </div>
  `
}

export async function initMonitoringSA() {
  if (selectedSA) {
    await initSelectedSA()
    return
  }

  try {
    const orders = await getAllOrders()
    await Promise.all(SA_LIST.map(async sa => {
      const count = await countActiveOrdersForSA(orders, sa)
      const element = document.getElementById(`monitoring-sa-count-${sa}`)
      if (element) element.textContent = `${count} Order`
    }))
  }
  catch (error) {
    console.error('GAGAL MEMUAT MONITORING SA:', error)
  }

  document.querySelectorAll('.monitoring-sa-card').forEach(card => {
    card.addEventListener('click', () => {
      selectedSA = card.dataset.sa || ''
      renderMonitoringPage()
    })
  })
}

async function initSelectedSA() {
  document.getElementById('monitoring-sa-back')?.addEventListener('click', () => {
    selectedSA = ''
    renderMonitoringPage()
  })

  const orders = await getAllOrders()
  const rows = []
  const summary = { total: 0, onOrder: 0, partArrival: 0, booking: 0, noShow: 0 }

  for (const order of orders) {
    if (String(order.sa || '').trim().toUpperCase() !== selectedSA) continue

    const detail = await getOrderDetail(order.id)
    const statusInfo = await getOrderStatus(order.id, detail.order, detail.parts)

    if (statusInfo.status === 'COMPLETED') continue

    rows.push({ order, status: statusInfo.status })
    summary.total++
    if (statusInfo.status === 'ON ORDER') summary.onOrder++
    if (statusInfo.status === 'PART ARRIVAL') summary.partArrival++
    if (statusInfo.status === 'BOOKING') summary.booking++
    if (statusInfo.status === 'NO SHOW') summary.noShow++
  }

  renderSASummary(summary)
  renderSATable(rows)
}

async function countActiveOrdersForSA(orders, sa) {
  let count = 0
  for (const order of orders) {
    if (String(order.sa || '').trim().toUpperCase() !== sa) continue
    const detail = await getOrderDetail(order.id)
    const statusInfo = await getOrderStatus(order.id, detail.order, detail.parts)
    if (statusInfo.status !== 'COMPLETED') count++
  }
  return count
}

async function getAllOrders() {
  const allOrders = []
  let cursor = null
  while (true) {
    const result = await getOrders(cursor, PAGE_SIZE)
    allOrders.push(...result.orders)
    if (!result.hasNextPage || !result.lastDoc) break
    cursor = result.lastDoc
  }
  return allOrders
}

function renderSASummary(summary) {
  const element = document.getElementById('monitoring-sa-summary')
  if (!element) return
  element.innerHTML = `
    <div class="monitoring-sa-summary-card total"><span>TOTAL ORDER</span><strong>${summary.total}</strong></div>
    <div class="monitoring-sa-summary-card on-order"><span>ON ORDER</span><strong>${summary.onOrder}</strong></div>
    <div class="monitoring-sa-summary-card part-arrival"><span>PART ARRIVAL</span><strong>${summary.partArrival}</strong></div>
    <div class="monitoring-sa-summary-card booking"><span>BOOKING</span><strong>${summary.booking}</strong></div>
    <div class="monitoring-sa-summary-card no-show"><span>NO SHOW</span><strong>${summary.noShow}</strong></div>
  `
}

function renderSATable(rows) {
  const loading = document.getElementById('monitoring-sa-loading')
  const table = document.getElementById('monitoring-sa-table')
  if (!table) return
  if (loading) loading.style.display = 'none'

  if (!rows.length) {
    table.innerHTML = `<div class="monitoring-sa-empty">Belum ada Work Order aktif untuk SA ${selectedSA}.</div>`
    return
  }

  table.innerHTML = `
    <table class="monitoring-sa-table">
      <thead>
        <tr>
          <th>No</th><th>No WO</th><th>Customer</th><th>No Polisi</th>
          <th>Model</th><th>Tgl Booking</th><th>Status WO</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td><strong>${escapeHTML(item.order.noWo || '-')}</strong></td>
            <td>${escapeHTML(item.order.customer || '-')}</td>
            <td>${escapeHTML(item.order.noPolisi || '-')}</td>
            <td>${escapeHTML(item.order.model || '-')}</td>
            <td>${formatDate(item.order.tanggalBooking)}</td>
            <td><span class="monitoring-sa-status ${statusClass(item.status)}">${item.status}</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `
}

function renderMonitoringPage() {
  const page = document.getElementById('page-content')
  if (!page) return
  page.innerHTML = renderMonitoringSA()
  initMonitoringSA()
}

function statusClass(status) {
  return String(status || '').toLowerCase().replaceAll(' ', '-')
}

function formatDate(value) {
  if (!value) return '-'
  const [year, month, day] = String(value).split('-')
  return day ? `${day}/${month}/${year}` : value
}

function escapeHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
