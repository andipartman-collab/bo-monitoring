import {
  getDashboardSummary
} from '../../services/dashboardService.js'


export function renderDashboard() {

  return `
    <div class="dashboard">

      <div
        id="dashboard-summary-message"
        class="dashboard-summary-message"
      ></div>

      <div class="dashboard-summary-cards">

        ${renderSummaryCard('TOTAL ORDER', 'totalOrder', '')}
        ${renderSummaryCard('ON ORDER', 'onOrder', 'ON ORDER')}
        ${renderSummaryCard('PART ARRIVAL', 'partArrival', 'PART ARRIVAL')}
        ${renderSummaryCard('BOOKING', 'booking', 'BOOKING')}
        ${renderSummaryCard('NO SHOW', 'noShow', 'NO SHOW')}

      </div>

      <div class="content-card">

        <div class="content-card-header">
          <div>
            <h3>Monitoring Order</h3>
            <p>Area dashboard untuk informasi monitoring berikutnya.</p>
          </div>
        </div>

        <div class="empty-state">
          <div class="empty-icon">▤</div>

          <h3>Monitoring Order</h3>

          <p>
            Informasi dashboard lainnya akan ditambahkan di sini.
          </p>
        </div>

      </div>

    </div>
  `
}


function renderSummaryCard(label, key, status) {
  const clickable = label !== 'TOTAL ORDER'
    ? ' dashboard-summary-card-clickable'
    : ' dashboard-summary-card-clickable'

  return `
    <button
      type="button"
      class="dashboard-summary-card${clickable} ${statusCardClass(status)}"
      data-dashboard-status="${status}"
      aria-label="Buka All Order ${label}"
    >
      <span class="dashboard-summary-label">${label}</span>
      <strong
        id="dashboard-summary-${key}"
        class="dashboard-summary-value"
      >
        -
      </strong>
    </button>
  `
}


function statusCardClass(status) {
  if (!status) {
    return 'dashboard-summary-total'
  }

  return `dashboard-summary-${String(status)
    .toLowerCase()
    .replaceAll(' ', '-')}`
}


export async function initDashboard() {

  setSummaryMessage('Memuat summary order...')

  initSummaryCardNavigation()

  try {
    const summary = await getDashboardSummary()

    updateSummaryValue('totalOrder', summary.totalOrder)
    updateSummaryValue('onOrder', summary.onOrder)
    updateSummaryValue('partArrival', summary.partArrival)
    updateSummaryValue('booking', summary.booking)
    updateSummaryValue('noShow', summary.noShow)

    setSummaryMessage('')
  }
  catch (error) {
    console.error(
      'GAGAL MEMUAT SUMMARY DASHBOARD:',
      error
    )

    setSummaryMessage(
      error.message ||
      'Gagal memuat summary order.'
    )
  }
}


function initSummaryCardNavigation() {
  document
    .querySelectorAll('.dashboard-summary-card')
    .forEach(card => {
      card.addEventListener('click', () => {
        const status = card.dataset.dashboardStatus || ''

        document.dispatchEvent(
          new CustomEvent('open-all-order-filter', {
            detail: {
              statusFilter: status
            }
          })
        )
      })
    })
}


function updateSummaryValue(key, value) {
  const element = document.getElementById(
    `dashboard-summary-${key}`
  )

  if (!element) {
    return
  }

  element.textContent = Number(value || 0)
}


function setSummaryMessage(message) {
  const element = document.getElementById(
    'dashboard-summary-message'
  )

  if (!element) {
    return
  }

  element.textContent = message
  element.style.display = message
    ? 'block'
    : 'none'
}
