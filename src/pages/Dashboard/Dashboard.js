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

        ${renderSummaryCard('TOTAL ORDER', 'totalOrder')}
        ${renderSummaryCard('ON ORDER', 'onOrder')}
        ${renderSummaryCard('PART ARRIVAL', 'partArrival')}
        ${renderSummaryCard('BOOKING', 'booking')}
        ${renderSummaryCard('NO SHOW', 'noShow')}

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


function renderSummaryCard(label, key) {
  return `
    <div class="dashboard-summary-card">
      <span class="dashboard-summary-label">${label}</span>
      <strong
        id="dashboard-summary-${key}"
        class="dashboard-summary-value"
      >
        -
      </strong>
    </div>
  `
}


export async function initDashboard() {

  setSummaryMessage('Memuat summary order...')

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
