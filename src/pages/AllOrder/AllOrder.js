import {
  getOrders
} from '../../services/orderService.js'

import {
  getOrderDetail
} from '../../services/orderService.js'

import {
  getOrderStatus
} from '../../services/orderStatusService.js'


const PAGE_SIZE = 20

let currentPage = 1
let pageCursors = []
let currentOrders = []
let searchTerm = ''
let searchTimer = null


/*
  ==================================================
  RENDER ALL ORDER
  ==================================================
*/
export function renderAllOrder() {

  return `
    <div class="all-order-page">

      <div class="all-order-search">
        <div class="all-order-search-field">
          <input
            type="search"
            id="all-order-search-input"
            placeholder="Cari No WO / SA / Customer / No Polisi..."
            autocomplete="off"
          >
          <button
            type="button"
            id="all-order-search-clear"
            class="all-order-search-clear"
            aria-label="Hapus pencarian"
            style="display:none;"
          >
            ×
          </button>
        </div>

        <button
          type="button"
          id="all-order-search-button"
          class="all-order-search-button"
        >
          Cari
        </button>
      </div>

      <div
        id="all-order-message"
        class="all-order-message"
      ></div>

      <div class="all-order-card">

        <div
          id="all-order-loading"
          class="all-order-loading"
        >
          Memuat data...
        </div>

        <div
          id="all-order-table-container"
          class="all-order-table-container"
        ></div>

        <div
          id="all-order-pagination"
          class="all-order-pagination"
        ></div>

      </div>

    </div>
  `
}


/*
  ==================================================
  INIT ALL ORDER
  ==================================================
*/
export async function initAllOrder() {

  currentPage = 1
  pageCursors = []
  currentOrders = []

  const input = document.getElementById(
    'all-order-search-input'
  )

  if (input) {
    input.value = searchTerm
  }

  updateSearchControls()

  if (searchTerm) {
    await loadSearchResults()
    return
  }

  await loadPage()
}


function initSearch() {
  const input = document.getElementById(
    'all-order-search-input'
  )

  const button = document.getElementById(
    'all-order-search-button'
  )

  const clear = document.getElementById(
    'all-order-search-clear'
  )

  if (!input || !button || !clear) {
    return
  }

  input.addEventListener('input', () => {
    searchTerm = input.value.trim()
    updateSearchControls()

    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      initAllOrder()
    }, 350)
  })

  input.addEventListener('keydown', event => {
    if (event.key !== 'Enter') {
      return
    }

    event.preventDefault()
    searchTerm = input.value.trim()
    updateSearchControls()
    initAllOrder()
  })

  button.addEventListener('click', () => {
    searchTerm = input.value.trim()
    updateSearchControls()
    initAllOrder()
  })

  clear.addEventListener('click', () => {
    searchTerm = ''
    input.value = ''
    updateSearchControls()
    initAllOrder()
  })
}


function updateSearchControls() {
  const input = document.getElementById(
    'all-order-search-input'
  )

  const clear = document.getElementById(
    'all-order-search-clear'
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


/*
  ==================================================
  LOAD PAGE
  ==================================================
*/
async function loadPage() {

  showLoading()

  try {
    let cursor = null

    if (currentPage > 1) {
      cursor = pageCursors[currentPage - 2]
    }

    const result = await getOrders(
      cursor,
      PAGE_SIZE
    )

    currentOrders = result.orders

    if (result.lastDoc) {
      pageCursors[currentPage - 1] = result.lastDoc
    }

    renderTable(currentOrders)
    renderPagination(result.hasNextPage)
    await applyStatuses(currentOrders)
  }
  catch (error) {
    console.error(
      'GAGAL MEMUAT ALL ORDER:',
      error
    )

    showError(
      error.message ||
      'Gagal memuat data order.'
    )
  }
}


/*
  ==================================================
  SEARCH
  ==================================================
*/
async function loadSearchResults() {

  showLoading()

  try {
    const result = await getAllOrdersForSearch()

    const normalizedTerm = searchTerm
      .toUpperCase()

    const filtered = result.filter(order => {
      return [
        order.noWo,
        order.sa,
        order.customer,
        order.noPolisi
      ].some(value => {
        return String(value || '')
          .toUpperCase()
          .includes(normalizedTerm)
      })
    })

    if (filtered.length === 0) {
      renderEmptySearch()
      return
    }

    currentOrders = filtered.slice(0, PAGE_SIZE)

    renderTable(currentOrders)

    const pagination = document.getElementById(
      'all-order-pagination'
    )

    if (pagination) {
      pagination.innerHTML = `
        <div class="pagination-info">
          Menampilkan <strong>${currentOrders.length}</strong>
          dari <strong>${filtered.length}</strong> hasil
        </div>
      `
    }

    await applyStatuses(currentOrders)
  }
  catch (error) {
    console.error(
      'GAGAL MENCARI ALL ORDER:',
      error
    )

    showError(
      error.message ||
      'Gagal melakukan pencarian.'
    )
  }
}


async function getAllOrdersForSearch() {
  const pageSize = 200
  const allOrders = []
  let cursor = null

  while (true) {
    const result = await getOrders(cursor, pageSize)

    allOrders.push(...result.orders)

    if (!result.hasNextPage || !result.lastDoc) {
      break
    }

    cursor = result.lastDoc
  }

  return allOrders
}


/*
  ==================================================
  RENDER TABLE
  ==================================================
*/
function renderTable(orders) {

  const loading = document.getElementById(
    'all-order-loading'
  )

  const container = document.getElementById(
    'all-order-table-container'
  )

  if (loading) {
    loading.style.display = 'none'
  }

  if (!container) {
    return
  }

  if (orders.length === 0) {
    container.innerHTML = `
      <div class="all-order-empty">
        <div class="all-order-empty-icon">▤</div>
        <h3>Belum ada data order</h3>
        <p>Belum terdapat Work Order di database.</p>
      </div>
    `

    return
  }

  container.innerHTML = `
    <div class="all-order-table-wrapper">
      <table class="all-order-table">
        <thead>
          <tr>
            <th>No</th>
            <th>No WO</th>
            <th>SA</th>
            <th>Customer</th>
            <th>No Polisi</th>
            <th>Model</th>
            <th>Tgl Booking</th>
            <th>Status WO</th>
            <th>Aksi</th>
          </tr>
        </thead>

        <tbody>
          ${orders.map((order, index) => {
            const number = searchTerm
              ? index + 1
              : ((currentPage - 1) * PAGE_SIZE) + index + 1

            return `
              <tr>
                <td>${number}</td>

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

                <td class="all-order-status-cell">
                  <div class="all-order-status-loading">
                    Memuat...
                  </div>
                </td>

                <td>
                  <button
                    type="button"
                    class="all-order-detail-button"
                    data-order-id="${escapeHTML(order.id)}"
                  >
                    Detail
                  </button>
                </td>
              </tr>
            `
          }).join('')}
        </tbody>
      </table>
    </div>
  `

  initDetailButtons()
}


/*
  ==================================================
  APPLY STATUS
  ==================================================
*/
async function applyStatuses(orders) {

  const rows = [
    ...document.querySelectorAll(
      '.all-order-table tbody tr'
    )
  ]

  await Promise.all(
    rows.map(async (row, index) => {
      const order = orders[index]

      if (!order?.id) {
        return
      }

      try {
        const result = await getOrderDetail(order.id)

        const statusInfo = await getOrderStatus(
          order.id,
          result.order,
          result.parts
        )

        const statusCell = row.querySelector(
          '.all-order-status-cell'
        )

        if (!statusCell) {
          return
        }

        statusCell.innerHTML = `
          <span class="all-order-status-badge ${statusClass(statusInfo.status)}">
            ${escapeHTML(statusInfo.status)}
          </span>
        `
      }
      catch (error) {
        console.error(
          'GAGAL MEMUAT STATUS WO:',
          error
        )
      }
    })
  )
}


/*
  ==================================================
  STATUS CLASS
  ==================================================
*/
function statusClass(status) {
  return String(status || '')
    .toLowerCase()
    .replaceAll(' ', '-')
}


/*
  ==================================================
  PAGINATION
  ==================================================
*/
function renderPagination(hasNextPage) {

  const pagination = document.getElementById(
    'all-order-pagination'
  )

  if (!pagination) {
    return
  }

  if (searchTerm) {
    return
  }

  const canGoPrevious = currentPage > 1

  pagination.innerHTML = `
    <div class="pagination-info">
      Halaman <strong>${currentPage}</strong>
    </div>

    <div class="pagination-buttons">
      <button
        type="button"
        id="all-order-prev"
        class="pagination-button"
        ${canGoPrevious ? '' : 'disabled'}
      >
        ← Sebelumnya
      </button>

      <button
        type="button"
        id="all-order-next"
        class="pagination-button"
        ${hasNextPage ? '' : 'disabled'}
      >
        Berikutnya →
      </button>
    </div>
  `

  const previousButton = document.getElementById(
    'all-order-prev'
  )

  const nextButton = document.getElementById(
    'all-order-next'
  )

  previousButton?.addEventListener(
    'click',
    goPrevious
  )

  nextButton?.addEventListener(
    'click',
    goNext
  )
}


async function goNext() {
  if (currentPage >= pageCursors.length + 1) {
    return
  }

  currentPage++
  await loadPage()
}


async function goPrevious() {
  if (currentPage <= 1) {
    return
  }

  currentPage--
  await loadPage()
}


/*
  ==================================================
  DETAIL BUTTON
  ==================================================
*/
function initDetailButtons() {

  document
    .querySelectorAll('.all-order-detail-button')
    .forEach(button => {
      button.addEventListener('click', () => {
        const orderId = button.dataset.orderId

        if (!orderId) {
          return
        }

        document.dispatchEvent(
          new CustomEvent(
            'open-wo-detail',
            {
              detail: {
                orderId
              }
            }
          )
        )
      })
    })
}


function renderEmptySearch() {
  const loading = document.getElementById(
    'all-order-loading'
  )

  const container = document.getElementById(
    'all-order-table-container'
  )

  const pagination = document.getElementById(
    'all-order-pagination'
  )

  if (loading) {
    loading.style.display = 'none'
  }

  if (pagination) {
    pagination.innerHTML = ''
  }

  if (container) {
    container.innerHTML = `
      <div class="all-order-empty">
        <div class="all-order-empty-icon">⌕</div>
        <h3>Data tidak ditemukan</h3>
        <p>
          Tidak ada WO yang cocok dengan pencarian
          "${escapeHTML(searchTerm)}".
        </p>
      </div>
    `
  }
}


/*
  ==================================================
  LOADING
  ==================================================
*/
function showLoading() {

  const loading = document.getElementById(
    'all-order-loading'
  )

  const container = document.getElementById(
    'all-order-table-container'
  )

  const pagination = document.getElementById(
    'all-order-pagination'
  )

  const message = document.getElementById(
    'all-order-message'
  )

  if (loading) {
    loading.style.display = 'block'
    loading.textContent = searchTerm
      ? 'Mencari data...'
      : 'Memuat data...'
  }

  if (container) {
    container.innerHTML = ''
  }

  if (pagination) {
    pagination.innerHTML = ''
  }

  if (message) {
    message.className = 'all-order-message'
    message.textContent = ''
  }
}


/*
  ==================================================
  ERROR
  ==================================================
*/
function showError(messageText) {

  const loading = document.getElementById(
    'all-order-loading'
  )

  const message = document.getElementById(
    'all-order-message'
  )

  if (loading) {
    loading.style.display = 'none'
  }

  if (message) {
    message.className = 'all-order-message error'
    message.textContent = messageText
  }
}


/*
  ==================================================
  FORMAT DATE
  ==================================================
*/
function formatDate(dateString) {

  if (!dateString) {
    return '-'
  }

  const parts = String(dateString).split('-')

  if (parts.length !== 3) {
    return dateString
  }

  const [year, month, day] = parts

  return `${day}/${month}/${year}`
}


/*
  ==================================================
  ESCAPE HTML
  ==================================================
*/
function escapeHTML(value) {

  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}


export function initAllOrderPage() {
  initSearch()
}
