import { initAllOrder } from './AllOrder.js'

import { searchAllOrders } from '../../services/allOrderSearchService.js'
import { getOrderDetail } from '../../services/orderService.js'
import { getOrderStatus } from '../../services/orderStatusService.js'


const PAGE_SIZE = 20

let observer = null
let searchTimer = null


function escapeHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}


function statusClass(status) {
  return String(status || '')
    .toLowerCase()
    .replaceAll(' ', '-')
}


function renderSearchBar(root) {
  const card = root.querySelector('.all-order-card')

  if (!card || root.querySelector('.all-order-search')) {
    return
  }

  const search = document.createElement('div')
  search.className = 'all-order-search'
  search.innerHTML = `
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
  `

  card.before(search)

  const input = search.querySelector('#all-order-search-input')
  const button = search.querySelector('#all-order-search-button')
  const clear = search.querySelector('#all-order-search-clear')

  const runSearch = () => {
    const term = input.value.trim()
    clear.style.display = term ? 'block' : 'none'
    startSearch(root, term)
  }

  input.addEventListener('input', () => {
    clear.style.display = input.value.trim() ? 'block' : 'none'

    clearTimeout(searchTimer)
    searchTimer = setTimeout(runSearch, 350)
  })

  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault()
      runSearch()
    }
  })

  button.addEventListener('click', runSearch)

  clear.addEventListener('click', () => {
    input.value = ''
    clear.style.display = 'none'
    initAllOrder()
  })
}


async function applyStatuses(root) {
  const buttons = [...root.querySelectorAll('.all-order-detail-button')]

  await Promise.all(buttons.map(async button => {
    const orderId = button.dataset.orderId

    if (!orderId) {
      return
    }

    try {
      const result = await getOrderDetail(orderId)
      const statusInfo = await getOrderStatus(
        orderId,
        result.order,
        result.parts
      )

      const row = button.closest('tr')

      if (!row) {
        return
      }

      const statusCell = row.querySelector('.all-order-status-cell')

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
      console.error('GAGAL MEMUAT STATUS WO:', error)
    }
  }))
}


function replaceCreatedColumn(root) {
  const header = root.querySelector('.all-order-table thead tr')

  if (!header) {
    return
  }

  const headers = [...header.children]
  const createdIndex = headers.findIndex(th => {
    return th.textContent.trim() === 'Dibuat'
  })

  if (createdIndex < 0) {
    return
  }

  headers[createdIndex].textContent = 'Status WO'

  root.querySelectorAll('.all-order-table tbody tr').forEach(row => {
    const cells = [...row.children]

    if (!cells[createdIndex]) {
      return
    }

    cells[createdIndex].innerHTML = `
      <div class="all-order-status-loading">Memuat...</div>
    `
    cells[createdIndex].classList.add('all-order-status-cell')
  })
}


async function enhanceNormalPage(root) {
  replaceCreatedColumn(root)
  await applyStatuses(root)
}


async function startSearch(root, term) {
  const container = root.querySelector('#all-order-table-container')
  const pagination = root.querySelector('#all-order-pagination')

  if (!container || !pagination) {
    return
  }

  if (!term) {
    initAllOrder()
    return
  }

  container.innerHTML = '<div class="all-order-search-loading">Mencari data...</div>'
  pagination.innerHTML = ''

  try {
    const orders = await searchAllOrders(term)

    if (orders.length === 0) {
      container.innerHTML = `
        <div class="all-order-empty">
          <div class="all-order-empty-icon">⌕</div>
          <h3>Data tidak ditemukan</h3>
          <p>Tidak ada WO yang cocok dengan pencarian "${escapeHTML(term)}".</p>
        </div>
      `
      return
    }

    const visible = orders.slice(0, PAGE_SIZE)

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
            ${visible.map((order, index) => `
              <tr>
                <td>${index + 1}</td>
                <td><strong>${escapeHTML(order.noWo || '-')}</strong></td>
                <td>${escapeHTML(order.sa || '-')}</td>
                <td>${escapeHTML(order.customer || '-')}</td>
                <td>${escapeHTML(order.noPolisi || '-')}</td>
                <td>${escapeHTML(order.model || '-')}</td>
                <td>${formatDate(order.tanggalBooking)}</td>
                <td class="all-order-status-cell">
                  <div class="all-order-status-loading">Memuat...</div>
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
            `).join('')}
          </tbody>
        </table>
      </div>
    `

    pagination.innerHTML = `
      <div class="pagination-info">
        Menampilkan <strong>${visible.length}</strong> dari <strong>${orders.length}</strong> hasil
      </div>
    `

    initDetailButtons(root)
    await applyStatuses(root)
  }
  catch (error) {
    console.error('GAGAL MENCARI ALL ORDER:', error)
    container.innerHTML = `
      <div class="all-order-search-error">
        Gagal melakukan pencarian: ${escapeHTML(error.message || 'Terjadi kesalahan.')}
      </div>
    `
  }
}


function initDetailButtons(root) {
  root.querySelectorAll('.all-order-detail-button').forEach(button => {
    if (button.dataset.enhancementBound === '1') {
      return
    }

    button.dataset.enhancementBound = '1'

    button.addEventListener('click', () => {
      const orderId = button.dataset.orderId

      if (!orderId) {
        return
      }

      document.dispatchEvent(
        new CustomEvent('open-wo-detail', {
          detail: { orderId }
        })
      )
    })
  })
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


function enhance(root) {
  if (root.dataset.allOrderEnhanced === '1') {
    return
  }

  root.dataset.allOrderEnhanced = '1'
  renderSearchBar(root)
  enhanceNormalPage(root)
}


export function initAllOrderEnhancement() {
  if (observer) {
    observer.disconnect()
  }

  observer = new MutationObserver(() => {
    const root = document.querySelector('.all-order-page')

    if (!root) {
      return
    }

    enhance(root)
  })

  const pageContent = document.getElementById('page-content')

  if (pageContent) {
    observer.observe(pageContent, {
      childList: true,
      subtree: true
    })
  }
}


initAllOrderEnhancement()
