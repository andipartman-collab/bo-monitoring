import { getDashboardSummary } from '../../services/dashboardService.js'
import { buildTodayTodos } from '../../services/notificationServiceV2.js'

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
          <div>
            <h3>TO DO LIST TODAY</h3>
          </div>
          <span id="dashboard-todo-date" class="dashboard-todo-date"></span>
        </div>

        <div id="dashboard-todo-message" class="dashboard-todo-message">Memuat To Do List Today...</div>
        <div id="dashboard-todo-list" class="dashboard-todo-list"></div>
      </section>
    </div>
  `
}

function renderSummaryCard(label, key, status) {
  return `
    <button
      type="button"
      class="dashboard-summary-card dashboard-summary-card-clickable ${statusCardClass(status)}"
      data-dashboard-status="${status}"
      aria-label="Buka All Order ${label}"
    >
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
    setSummaryMessage('')
  }
  catch (error) {
    console.error('GAGAL MEMUAT DASHBOARD:', error)
    setSummaryMessage(error.message || 'Gagal memuat dashboard.')
    showTodoError(error.message || 'Gagal memuat To Do List Today.')
  }
}

function initSummaryCardNavigation() {
  document.querySelectorAll('.dashboard-summary-card').forEach(card => {
    card.addEventListener('click', () => {
      const status = card.dataset.dashboardStatus || ''
      document.dispatchEvent(new CustomEvent('open-all-order-filter', { detail: { statusFilter: status } }))
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
  if (!element) return
  const today = new Date()
  element.textContent = formatDisplayDate(today)
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
      document.dispatchEvent(new CustomEvent('open-notification-center'))
    })
  })
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
