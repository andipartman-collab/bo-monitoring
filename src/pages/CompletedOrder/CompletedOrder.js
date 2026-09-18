import {
  getCompletedOrders,
  findCompletedOrdersOlderThan,
  deleteCompletedOrdersOlderThan,
  getDeleteCutoffDate
} from '../../services/completedOrderService.js'


let currentOrders = []
let searchTerm = ''


export function renderCompletedOrder() {
  return `
    <div class="completed-order-page">

      <div class="completed-order-toolbar">
        <div class="completed-order-search">
          <div class="completed-order-search-field">
            <input
              type="search"
              id="completed-order-search-input"
              placeholder="Cari No WO / SA / Customer / No Polisi..."
              autocomplete="off"
            >
            <button
              type="button"
              id="completed-order-search-clear"
              class="completed-order-search-clear"
              aria-label="Hapus pencarian"
              style="display:none;"
            >
              ×
            </button>
          </div>

          <button
            type="button"
            id="completed-order-search-button"
            class="completed-order-search-button"
          >
            Cari
          </button>
        </div>
      </div>

      <div
        id="completed-order-message"
        class="completed-order-message"
      ></div>

      <div class="completed-order-card">
        <div class="completed-order-card-header">
          <div>
            <h2>Completed Order</h2>
            <p>Daftar Work Order yang sudah di-Finish.</p>
          </div>
        </div>

        <div
          id="completed-order-loading"
          class="completed-order-loading"
        >
          Memuat data Completed Order...
        </div>

        <div
          id="completed-order-table-container"
          class="completed-order-table-container"
        ></div>
      </div>

      <div class="completed-order-maintenance-card">

        <div class="completed-order-maintenance-header">
          <div>
            <h2>Data Maintenance</h2>
            <p>
              Hapus data Completed Order berdasarkan tanggal
              <strong>Finish</strong> atau <strong>completedAt</strong>.
            </p>
          </div>
        </div>

        <div class="completed-order-maintenance-actions">

          <button
            type="button"
            class="completed-order-delete-button"
            data-months="3"
          >
            Hapus &gt; 3 Bulan
          </button>

          <button
            type="button"
            class="completed-order-delete-button"
            data-months="6"
          >
            Hapus &gt; 6 Bulan
          </button>

          <button
            type="button"
            class="completed-order-delete-button danger"
            data-months="12"
          >
            Hapus &gt; 1 Tahun
          </button>

        </div>

        <div
          id="completed-order-maintenance-progress"
          class="completed-order-maintenance-progress"
        ></div>

      </div>

    </div>
  `
}


export async function initCompletedOrder() {
  currentOrders = []
  searchTerm = ''

  initSearch()
  initMaintenanceActions()

  await loadCompletedOrders()
}


async function loadCompletedOrders() {
  const loading = document.getElementById(
    'completed-order-loading'
  )

  const container = document.getElementById(
    'completed-order-table-container'
  )

  if (loading) {
    loading.style.display = 'block'
  }

  if (container) {
    container.innerHTML = ''
  }

  clearMessage()

  try {
    currentOrders = await getCompletedOrders()
    applyFilterAndRender()
  }
  catch (error) {
    console.error(
      'GAGAL MEMUAT COMPLETED ORDER:',
      error
    )

    showMessage(
      error.message ||
      'Gagal memuat Completed Order.',
      'error'
    )
  }
  finally {
    if (loading) {
      loading.style.display = 'none'
    }
  }
}


function initSearch() {
  const input = document.getElementById(
    'completed-order-search-input'
  )

  const button = document.getElementById(
    'completed-order-search-button'
  )

  const clear = document.getElementById(
    'completed-order-search-clear'
  )

  if (!input || !button || !clear) {
    return
  }

  input.addEventListener('input', () => {
    searchTerm = input.value.trim()
    updateSearchControls()
    applyFilterAndRender()
  })

  input.addEventListener('keydown', event => {
    if (event.key !== 'Enter') {
      return
    }

    event.preventDefault()

    searchTerm = input.value.trim()
    updateSearchControls()
    applyFilterAndRender()
  })

  button.addEventListener('click', () => {
    searchTerm = input.value.trim()
    updateSearchControls()
    applyFilterAndRender()
  })

  clear.addEventListener('click', () => {
    searchTerm = ''
    input.value = ''
    updateSearchControls()
    applyFilterAndRender()
  })
}


function updateSearchControls() {
  const input = document.getElementById(
    'completed-order-search-input'
  )

  const clear = document.getElementById(
    'completed-order-search-clear'
  )

  if (input && input.value !== searchTerm) {
    input.value = searchTerm
  }

  if (clear) {
    clear.style.display = searchTerm
      ? 'block'
      : 'none'
  }
}


function applyFilterAndRender() {
  const term = searchTerm.toUpperCase()

  const filtered = currentOrders.filter(order => {
    if (!term) {
      return true
    }

    return [
      order.noWo,
      order.sa,
      order.customer,
      order.noPolisi,
      order.model
    ].some(value => {
      return String(value || '')
        .toUpperCase()
        .includes(term)
    })
  })

  renderTable(filtered)
}


function renderTable(orders) {
  const container = document.getElementById(
    'completed-order-table-container'
  )

  if (!container) {
    return
  }

  if (orders.length === 0) {
    container.innerHTML = `
      <div class="completed-order-empty">
        <div class="completed-order-empty-icon">✓</div>
        <h3>
          ${searchTerm
            ? 'Data tidak ditemukan'
            : 'Belum ada Completed Order'}
        </h3>
        <p>
          ${searchTerm
            ? 'Tidak ada Completed Order yang cocok dengan pencarian.'
            : 'Belum terdapat Work Order yang sudah di-Finish.'}
        </p>
      </div>
    `

    return
  }

  container.innerHTML = `
    <div class="completed-order-table-wrapper">
      <table class="completed-order-table">
        <thead>
          <tr>
            <th>No</th>
            <th>No WO</th>
            <th>SA</th>
            <th>Customer</th>
            <th>No Polisi</th>
            <th>Model</th>
            <th>Tgl Booking</th>
            <th>Completed</th>
            <th>Aksi</th>
          </tr>
        </thead>

        <tbody>
          ${orders.map((order, index) => `
            <tr>
              <td>${index + 1}</td>

              <td>
                <strong>
                  ${escapeHTML(order.noWo || '-')}
                </strong>
              </td>

              <td>${escapeHTML(order.sa || '-')}</td>

              <td>${escapeHTML(order.customer || '-')}</td>

              <td>${escapeHTML(order.noPolisi || '-')}</td>

              <td>${escapeHTML(order.model || '-')}</td>

              <td>${formatDate(order.tanggalBooking)}</td>

              <td>
                <span class="completed-order-date">
                  ${formatDateTime(order.completedDate)}
                </span>
              </td>

              <td>
                <button
                  type="button"
                  class="completed-order-detail-button"
                  data-order-id="${escapeHTML(order.id)}"
                >
                  Detail
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="completed-order-table-footer">
      Menampilkan <strong>${orders.length}</strong>
      Completed Order
    </div>
  `

  initDetailButtons()
  initRowDeleteButtons()
}


function initDetailButtons() {
  document
    .querySelectorAll('.completed-order-detail-button')
    .forEach(button => {
      button.addEventListener('click', () => {
        const orderId = button.dataset.orderId

        if (!orderId) {
          return
        }

        document.dispatchEvent(
          new CustomEvent('open-completed-order-detail', {
            detail: {
              orderId
            }
          })
        )
      })
    })
}


function initRowDeleteButtons() {
  document
    .querySelectorAll('.completed-order-row-delete-button')
    .forEach(button => {
      button.addEventListener('click', async () => {
        const orderId = button.dataset.orderId
        const noWo = button.dataset.noWo || '-'
        const customer = button.dataset.customer || '-'

        if (!orderId) {
          return
        }

        const confirmed = window.confirm(
          `Hapus Completed Order?

No WO: ${noWo}
Customer: ${customer}

Seluruh data WO, part, supply, ETA history, dan registry akan dihapus permanen.`
        )

        if (!confirmed) {
          return
        }

        button.disabled = true
        button.textContent = 'Menghapus...'

        try {
          const { deleteWorkOrder } =
            await import('../../services/woDeleteService.js')

          await deleteWorkOrder(orderId)

          showMessage(
            `Completed Order ${noWo} berhasil dihapus.`,
            'success'
          )

          await loadCompletedOrders()
        }
        catch (error) {
          console.error(
            'GAGAL MENGHAPUS COMPLETED ORDER:',
            error
          )

          button.disabled = false
          button.textContent = 'Hapus'

          showMessage(
            error.message ||
            'Gagal menghapus Completed Order.',
            'error'
          )
        }
      })
    })
}


function initMaintenanceActions() {
  document
    .querySelectorAll('.completed-order-delete-button')
    .forEach(button => {
      button.addEventListener('click', async () => {
        const months = Number(button.dataset.months || 0)

        if (!months) {
          return
        }

        await handleDeleteOldOrders(
          months,
          button
        )
      })
    })
}


async function handleDeleteOldOrders(
  months,
  button
) {
  const maintenance =
    document.getElementById(
      'completed-order-maintenance-progress'
    )

  if (!maintenance) {
    return
  }

  setMaintenanceButtonsDisabled(true)
  maintenance.className =
    'completed-order-maintenance-progress show'
  maintenance.textContent =
    'Memeriksa data yang memenuhi kriteria...'

  try {
    const targets =
      await findCompletedOrdersOlderThan(months)

    if (targets.length === 0) {
      maintenance.textContent =
        `Tidak ada Completed Order yang lebih dari ${labelMonths(months)}.`
      setMaintenanceButtonsDisabled(false)
      return
    }

    const cutoff =
      getDeleteCutoffDate(months)

    const confirmed = window.confirm(
      `Ditemukan ${targets.length} Completed Order yang selesai sebelum ${formatDateTime(cutoff)}.

Data WO beserta part, supply, ETA history, dan registry akan dihapus permanen.

Lanjutkan penghapusan?`
    )

    if (!confirmed) {
      maintenance.textContent =
        'Penghapusan dibatalkan.'
      setMaintenanceButtonsDisabled(false)
      return
    }

    button.textContent = 'Menghapus...'

    const result =
      await deleteCompletedOrdersOlderThan(
        months,
        progress => {
          maintenance.textContent =
            `Menghapus ${progress.completed} dari ${progress.total} WO...`
        }
      )

    maintenance.textContent =
      `Selesai. ${result.deletedCount} Completed Order berhasil dihapus.`

    await loadCompletedOrders()
  }
  catch (error) {
    console.error(
      'GAGAL MENGHAPUS COMPLETED ORDER:',
      error
    )

    maintenance.textContent = ''
    showMessage(
      error.message ||
      'Gagal menghapus Completed Order.',
      'error'
    )
  }
  finally {
    setMaintenanceButtonsDisabled(false)
  }
}


function setMaintenanceButtonsDisabled(disabled) {
  document
    .querySelectorAll('.completed-order-delete-button')
    .forEach(button => {
      button.disabled = disabled
    })
}


function labelMonths(months) {
  if (months === 12) {
    return '1 tahun'
  }

  return months + ' bulan'
}


function formatDate(value) {
  if (!value) {
    return '-'
  }

  const parts = String(value).split('-')

  if (parts.length !== 3) {
    return value
  }

  const [year, month, day] = parts

  return `${day}/${month}/${year}`
}


function formatDateTime(value) {
  const date =
    value instanceof Date
      ? value
      : value?.toDate instanceof Function
        ? value.toDate()
        : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  return `${day}/${month}/${year}`
}


function showMessage(messageText, type = 'error') {
  const element =
    document.getElementById(
      'completed-order-message'
    )

  if (!element) {
    return
  }

  element.className =
    `completed-order-message ${type}`
  element.textContent = messageText
}


function clearMessage() {
  const element =
    document.getElementById(
      'completed-order-message'
    )

  if (!element) {
    return
  }

  element.className =
    'completed-order-message'
  element.textContent = ''
}


function escapeHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
