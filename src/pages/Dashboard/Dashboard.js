import { getDashboardSummary, getSAMonitoringSummary } from '../../services/dashboardService.js'
import { buildTodayTodos, buildNotifications, NOTIFICATION_DEFINITIONS } from '../../services/notificationServiceV2.js'

const SA_LIST = ['ADN', 'AGS', 'ALF', 'ANT', 'DWI', 'EKS', 'HDS', 'IND', 'LUT', 'NUR', 'VIK', 'OTHERS']
const SA_NOTIFICATION_TYPES = Object.keys(NOTIFICATION_DEFINITIONS)
let selectedSA = SA_LIST[0]

export function renderDashboard() {
  return `
    <div class="dashboard">
      <div id="dashboard-summary-message" class="dashboard-summary-message"></div>

      <div class="dashboard-summary-cards">
        ${renderSummaryCard('TOTAL ORDER', 'totalOrder', '')}
        ${renderSummaryCard('ON ORDER', 'onOrder', 'ON ORDER')}
        ${renderSummaryCard('PART ARRIVAL', 'partArrival', 'PART ARRIVAL')}
        ${renderSummaryCard('BOOKING', 'booking', 'BOOKING')}
        ${renderSummaryCard('NO SHOW', 'noShow', 'NO SHOW')}
      </div>

      <section class="dashboard-todo-section">
        <div class="dashboard-todo-header">
          <div><h3>TO DO LIST TODAY</h3></div>
          <span id="dashboard-todo-date" class="dashboard-todo-date"></span>
        </div>
        <div id="dashboard-todo-message" class="dashboard-todo-message">Memuat To Do List Today...</div>
        <div id="dashboard-todo-list" class="dashboard-todo-list"></div>
      </section>

      <section class="dashboard-sa-section">
        <div class="dashboard-sa-header">
          <h3>MONITORING SA</h3>
          <label class="dashboard-sa-selector">
            <span>Pilih SA</span>
            <select id="dashboard-sa-select">
              ${SA_LIST.map(sa => `<option value="${sa}" ${sa === selectedSA ? 'selected' : ''}>${sa}</option>`).join('')}
            </select>
          </label>
        </div>
        <div id="dashboard-sa-loading" class="dashboard-sa-message">Memuat monitoring SA...</div>
        <div id="dashboard-sa-content" class="dashboard-sa-content"></div>
      </section>
    </div>
  `
}

function renderSummaryCard(label, key, status) {
  return `
    <button type="button" class="dashboard-summary-card dashboard-summary-card-clickable ${statusCardClass(status)}" data-dashboard-status="${status}" aria-label="Buka All Order ${label}">
      <span class="dashboard-summary-label">${label}</span>
      <strong id="dashboard-summary-${key}" class="dashboard-summary-value">-</strong>
    </button>
  `
}

function statusCardClass(status) {
  if (!status) return 'dashboard-summary-total'
  return `dashboard-summary-${String(status).toLowerCase().replaceAll(' ', '-')}`
}

export async function initDashboard() {
  setSummaryMessage('Memuat summary order...')
  initSummaryCardNavigation()
  setTodoDate()
  initSASelector()

  try {
    const [summary, todos] = await Promise.all([
      getDashboardSummary(),
      buildTodayTodos()
    ])

    updateSummaryValue('totalOrder', summary.totalOrder)
    updateSummaryValue('onOrder', summary.onOrder)
    updateSummaryValue('partArrival', summary.partArrival)
    updateSummaryValue('booking', summary.booking)
    updateSummaryValue('noShow', summary.noShow)
    renderTodayTodos(todos)
    await loadSAMonitoring()
    setSummaryMessage('')
  } catch (error) {
    console.error('GAGAL MEMUAT DASHBOARD:', error)
    setSummaryMessage(error.message || 'Gagal memuat dashboard.')
    showTodoError(error.message || 'Gagal memuat To Do List Today.')
  }
}

function initSummaryCardNavigation() {
  document.querySelectorAll('.dashboard-summary-card').forEach(card => {
    card.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('open-all-order-filter', {
        detail: {
          statusFilter: card.dataset.dashboardStatus || ''
        }
      }))
    })
  })
}

function initSASelector() {
  document.getElementById('dashboard-sa-select')?.addEventListener('change', event => {
    selectedSA = event.target.value || SA_LIST[0]
    loadSAMonitoring()
  })
}

async function loadSAMonitoring() {
  const loading = document.getElementById('dashboard-sa-loading')
  const content = document.getElementById('dashboard-sa-content')
  if (!content) return

  if (loading) loading.textContent = `Memuat monitoring ${selectedSA}...`

  try {
    const [summary, notifications] = await Promise.all([
      getSAMonitoringSummary(selectedSA),
      buildNotifications()
    ])

    const filteredNotifications = Object.fromEntries(
      SA_NOTIFICATION_TYPES.map(type => [
        type,
        (notifications[type] || []).filter(row =>
          String(row.sa || '').trim().toUpperCase() === selectedSA
        )
      ])
    )

    renderSAMonitoring(summary, filteredNotifications)
    if (loading) loading.textContent = ''
  } catch (error) {
    console.error('GAGAL MEMUAT MONITORING SA DASHBOARD:', error)
    if (loading) loading.textContent = error.message || 'Gagal memuat monitoring SA.'
  }
}

function renderSAMonitoring(summary, notifications) {
  const content = document.getElementById('dashboard-sa-content')
  if (!content) return

  const parts = [
    { label: 'ON ORDER', value: summary.onOrder, cls: 'on-order', color: '#f59e0b' },
    { label: 'PART ARRIVAL', value: summary.partArrival, cls: 'part-arrival', color: '#2563eb' },
    { label: 'BOOKING', value: summary.booking, cls: 'booking', color: '#16a34a' },
    { label: 'NO SHOW', value: summary.noShow, cls: 'no-show', color: '#dc2626' }
  ]

  const donutBackground = buildDonutBackground(parts, summary.total)
  const notificationsTotal = SA_NOTIFICATION_TYPES.reduce(
    (sum, type) => sum + notifications[type].length,
    0
  )

  content.innerHTML = `
    <div class="dashboard-sa-grid">
      <button type="button" class="dashboard-sa-order-card" data-open-sa-order="${selectedSA}">
        <div class="dashboard-sa-card-title">
          <strong>ORDER ${selectedSA}</strong>
          <span>${summary.total} WO</span>
        </div>
        <div class="dashboard-sa-chart-wrap">
          <div class="dashboard-sa-donut" style="background:${donutBackground}">
            <div>
              <strong>${summary.total}</strong>
              <span>TOTAL WO</span>
            </div>
          </div>
          <div class="dashboard-sa-legend">
            ${parts.map(item => `
              <span>
                <i class="dashboard-sa-dot ${item.cls}"></i>
                ${item.label}
                <strong>${item.value}</strong>
              </span>
            `).join('')}
          </div>
        </div>
      </button>

      <div class="dashboard-sa-notification-card">
        <div class="dashboard-sa-card-title">
          <strong>NOTIFICATION ${selectedSA}</strong>
          <span>${notificationsTotal} Active</span>
        </div>
        <div class="dashboard-sa-notification-list">
          ${renderSAGroupedNotifications(notifications)}
        </div>
      </div>
    </div>
  `

  document.querySelector('[data-open-sa-order]')?.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('open-monitoring-sa', {
      detail: { sa: selectedSA }
    }))
  })

  document.querySelectorAll('[data-open-sa-notification]').forEach(item => {
    item.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('open-notification-center', {
        detail: {
          type: item.dataset.type,
          sa: selectedSA,
          todayOnly: false
        }
      }))
    })
  })
}

function buildDonutBackground(parts, total) {
  if (!total) return '#e5e7eb'

  let start = 0
  const stops = []

  for (const part of parts) {
    const percent = (part.value / total) * 100
    if (percent <= 0) continue

    const end = start + percent
    stops.push(`${part.color} ${start}% ${end}%`)
    start = end
  }

  return `conic-gradient(${stops.join(',')})`
}

function renderSAGroupedNotifications(notifications) {
  const active = SA_NOTIFICATION_TYPES.filter(type => notifications[type].length)
  if (!active.length) {
    return '<div class="dashboard-sa-no-notification">Tidak ada notification aktif.</div>'
  }

  return active.map(type => {
    const definition = NOTIFICATION_DEFINITIONS[type]
    return `
      <button type="button" class="dashboard-sa-notification-item" data-open-sa-notification data-type="${type}">
        <span class="dashboard-sa-notification-icon">${definition.icon}</span>
        <strong>${definition.title}</strong>
        <span>${notifications[type].length}</span>
      </button>
    `
  }).join('')
}

function renderTodayTodos(todos) {
  const message = document.getElementById('dashboard-todo-message')
  const list = document.getElementById('dashboard-todo-list')
  if (!message || !list) return

  if (!todos.length) {
    message.textContent = 'Tidak ada To Do baru hari ini.'
    list.innerHTML = '<div class="dashboard-todo-empty">Semua kondisi hari ini sudah bersih.</div>'
    return
  }

  message.textContent = ''
  list.innerHTML = todos.map(todo => `
    <button type="button" class="dashboard-todo-card dashboard-todo-${safeClass(todo.type)}" data-todo-type="${todo.type}">
      <div class="dashboard-todo-card-top">
        <span class="dashboard-todo-icon">${todo.icon}</span>
        <strong>${escapeHTML(todo.title)}</strong>
        <span class="dashboard-todo-count">${todo.count}</span>
      </div>
    </button>
  `).join('')

  document.querySelectorAll('[data-todo-type]').forEach(card => {
    card.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('open-notification-center', {
        detail: {
          type: card.dataset.todoType,
          todayOnly: true
        }
      }))
    })
  })
}

function updateSummaryValue(key, value) {
  const element = document.getElementById(`dashboard-summary-${key}`)
  if (element) element.textContent = Number(value || 0)
}

function setSummaryMessage(message) {
  const element = document.getElementById('dashboard-summary-message')
  if (!element) return
  element.textContent = message
  element.style.display = message ? 'block' : 'none'
}

function setTodoDate() {
  const element = document.getElementById('dashboard-todo-date')
  if (element) element.textContent = formatDisplayDate(new Date())
}

function showTodoError(message) {
  const element = document.getElementById('dashboard-todo-message')
  if (element) element.textContent = message
}

function formatDisplayDate(date) {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}

function safeClass(value) {
  return String(value || '').toLowerCase().replaceAll(' ', '-').replaceAll('_', '-')
}

function escapeHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
