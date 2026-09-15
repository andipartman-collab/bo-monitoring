import {
  escapeHTML,
  formatDate
} from './WODetailUtils.js'

import {
  getOrders,
  getOrderDetail,
  getPartsWithSupply
} from '../../services/orderService.js'

const LOGO_PATH = '/nasmoco-slamet-riyadi-logo.png'

let currentOrder = null
let currentParts = []

export function initWODetailPrint(order, parts) {
  currentOrder = order
  currentParts = parts || []

  const button = document.getElementById('wo-print-button')
  if (!button) return

  button.addEventListener('click', () => {
    openPrintSelector()
  })
}

async function openPrintSelector() {
  removePrintSelector()
  showSelectorLoading()

  try {
    const result = await getOrders(null, 20)
    const orders = mergeCurrentOrder(result.orders || [])
    renderPrintSelector(orders)
  }
  catch (error) {
    console.error('GAGAL MEMUAT PILIHAN CETAK WO:', error)
    removePrintSelector()
    window.alert(error.message || 'Gagal memuat daftar Work Order.')
  }
}

function mergeCurrentOrder(orders) {
  if (!currentOrder?.id) {
    return orders
  }

  const exists = orders.some(order => order.id === currentOrder.id)

  if (exists) {
    return orders
  }

  return [currentOrder, ...orders]
}

function showSelectorLoading() {
  const overlay = document.createElement('div')
  overlay.id = 'wo-print-selector'
  overlay.className = 'wo-print-selector-overlay'
  overlay.innerHTML = `
    <div class="wo-print-selector-dialog">
      <div class="wo-print-selector-header">
        <div>
          <h3>Pilih Work Order untuk Dicetak</h3>
          <p>WO yang dipilih akan disusun otomatis seefisien mungkin dalam A4.</p>
        </div>
        <button type="button" id="wo-print-selector-close">×</button>
      </div>
      <div class="wo-print-selector-body">Memuat daftar Work Order...</div>
    </div>
  `

  document.body.appendChild(overlay)

  document.getElementById('wo-print-selector-close')
    ?.addEventListener('click', removePrintSelector)

  overlay.addEventListener('click', event => {
    if (event.target === overlay) {
      removePrintSelector()
    }
  })
}

function renderPrintSelector(orders) {
  const body = document.querySelector('.wo-print-selector-body')
  if (!body) return

  body.innerHTML = `
    <div class="wo-print-selector-list">
      ${orders.map(order => `
        <label class="wo-print-selector-item">
          <input
            type="checkbox"
            class="wo-print-order-checkbox"
            value="${escapeHTML(order.id)}"
            ${order.id === currentOrder?.id ? 'checked' : ''}
          >
          <span class="wo-print-selector-main">
            <strong>${escapeHTML(order.noWo || '-')}</strong>
            <small>${escapeHTML(order.sa || '-')} · ${escapeHTML(order.customer || '-')}</small>
          </span>
        </label>
      `).join('')}
    </div>

    <div class="wo-print-selector-note">
      Sistem tidak memaksakan 2 WO dalam satu halaman. Bila ruang tidak cukup, WO berikutnya otomatis pindah ke halaman berikutnya.
    </div>

    <div class="wo-print-selector-actions">
      <button type="button" id="wo-print-selector-cancel">Batal</button>
      <button type="button" id="wo-print-selector-print">🖨 Cetak</button>
    </div>
  `

  document.getElementById('wo-print-selector-cancel')
    ?.addEventListener('click', removePrintSelector)

  document.getElementById('wo-print-selector-print')
    ?.addEventListener('click', handleBatchPrint)
}

async function handleBatchPrint() {
  const ids = [
    ...document.querySelectorAll('.wo-print-order-checkbox:checked')
  ].map(input => input.value)

  if (!ids.length) {
    window.alert('Pilih minimal satu Work Order.')
    return
  }

  const printButton = document.getElementById('wo-print-selector-print')
  if (printButton) {
    printButton.disabled = true
    printButton.textContent = 'Memuat data...'
  }

  try {
    const selectedOrders = []

    for (const orderId of ids) {
      if (orderId === currentOrder?.id) {
        selectedOrders.push({
          order: currentOrder,
          parts: currentParts
        })
        continue
      }

      const detail = await getOrderDetail(orderId)
      const parts = await getPartsWithSupply(orderId)

      selectedOrders.push({
        order: detail.order,
        parts
      })
    }

    removePrintSelector()
    openPrintWindow(selectedOrders)
  }
  catch (error) {
    console.error('GAGAL MENYIAPKAN CETAK WO:', error)
    window.alert(error.message || 'Gagal menyiapkan data cetak.')

    if (printButton) {
      printButton.disabled = false
      printButton.textContent = '🖨 Cetak'
    }
  }
}

function removePrintSelector() {
  document.getElementById('wo-print-selector')?.remove()
}

function openPrintWindow(workOrders) {
  const printWindow = window.open('', '_blank', 'width=900,height=1200')

  if (!printWindow) {
    window.alert('Popup cetak diblokir browser. Izinkan popup untuk halaman ini.')
    return
  }

  printWindow.document.open()
  printWindow.document.write(renderPrintDocument(workOrders))
  printWindow.document.close()

  printWindow.addEventListener('load', () => {
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
    }, 250)
  })

  printWindow.addEventListener('afterprint', () => {
    printWindow.close()
  })
}

function renderPrintDocument(workOrders) {
  const documents = (workOrders || [])
    .map(({ order, parts }) => renderWorkOrder(order, parts))
    .join('')

  return `
    <!doctype html>
    <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <title>Special Order Part</title>
        <link rel="stylesheet" href="/wo-print.css" />
      </head>
      <body>
        <main class="print-page">
          ${documents}
        </main>
      </body>
    </html>
  `
}

function renderWorkOrder(order, parts) {
  const rows = (parts || []).map((part, index) => `
    <tr>
      <td class="center">${index + 1}</td>
      <td>${escapeHTML(part.pno || '-')}</td>
      <td>${escapeHTML(part.namaPart || '-')}</td>
      <td>${escapeHTML(part.noOrder || '-')}</td>
      <td class="center">${formatDate(part.tglOrder)}</td>
      <td class="center">${Number(part.qtyOrder || 0)}</td>
      <td class="center">${formatDate(part.eta)}</td>
      <td class="center">${formatDate(getPartAta(part))}</td>
    </tr>
  `).join('')

  return `
    <section class="print-order">
      <header class="print-header">
        <div class="print-logo-wrap">
          <img src="${LOGO_PATH}" alt="Nasmoco Slamet Riyadi" />
        </div>
        <div class="print-title-wrap">
          <h1>SPECIAL ORDER PART</h1>
          <h2>Nasmoco Slamet Riyadi</h2>
        </div>
      </header>

      <section class="print-section">
        <div class="print-section-title">DATA WORK ORDER</div>
        <div class="print-wo-grid">
          <div class="print-wo-column">
            ${renderInfoRow('No WO', order.noWo)}
            ${renderInfoRow('Customer', order.customer)}
            ${renderInfoRow('Model', order.model)}
          </div>
          <div class="print-wo-column">
            ${renderInfoRow('SA', order.sa)}
            ${renderInfoRow('No Polisi', order.noPolisi)}
            ${renderInfoRow('Tgl Booking', formatDate(order.tanggalBooking))}
          </div>
        </div>
      </section>

      <section class="print-section print-parts-section">
        <div class="print-section-title">PART YANG DIPESAN</div>
        <table class="print-parts-table">
          <thead>
            <tr>
              <th>No</th><th>PNO</th><th>Nama Part</th><th>No Order</th>
              <th>Tgl Order</th><th>Qty</th><th>ETA</th><th>ATA</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="8" class="empty-row">Belum ada part order.</td></tr>'}
          </tbody>
        </table>
      </section>

      <section class="print-signatures">
        <div class="print-signature-box">
          <div class="print-signature-title">PARTMAN</div>
          <div class="print-signature-space"></div>
          <div class="print-signature-line"></div>
          <div class="print-signature-name">Nama: __________________</div>
        </div>
        <div class="print-signature-box">
          <div class="print-signature-title">SERVICE ADVISOR</div>
          <div class="print-signature-space"></div>
          <div class="print-signature-line"></div>
          <div class="print-signature-name">${escapeHTML(order.sa || '-')}</div>
        </div>
      </section>

      <footer class="print-footer">Mudah, Lengkap, Nyaman</footer>
    </section>
  `
}

function renderInfoRow(label, value) {
  return `
    <div class="print-info-row">
      <span>${label}</span>
      <strong>${escapeHTML(value || '-')}</strong>
    </div>
  `
}

function getPartAta(part) {
  const qtyOrder = Number(part.qtyOrder || 0)
  if (qtyOrder <= 0 || !Array.isArray(part.supplies)) return ''

  const supplies = [...part.supplies].sort(
    (a, b) => getTimestamp(a.createdAt) - getTimestamp(b.createdAt)
  )

  let totalSupply = 0

  for (const supply of supplies) {
    totalSupply += Number(supply.qtySupply || 0)

    if (totalSupply >= qtyOrder) {
      return supply.ata || ''
    }
  }

  return ''
}

function getTimestamp(timestamp) {
  if (!timestamp) return 0
  if (typeof timestamp.toMillis === 'function') return timestamp.toMillis()
  if (typeof timestamp.toDate === 'function') return timestamp.toDate().getTime()
  return 0
}
