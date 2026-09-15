import {
  escapeHTML,
  formatDate
} from './WODetailUtils.js'

const LOGO_PATH = '/nasmoco-slamet-riyadi-logo.png'

export function initWODetailPrint(order, parts) {
  const button = document.getElementById('wo-print-button')
  if (!button) return

  button.addEventListener('click', () => {
    openPrintWindow(order, parts)
  })
}

function openPrintWindow(order, parts) {
  const printWindow = window.open('', '_blank', 'width=900,height=1200')

  if (!printWindow) {
    window.alert('Popup cetak diblokir browser. Izinkan popup untuk halaman ini.')
    return
  }

  printWindow.document.open()
  printWindow.document.write(renderPrintDocument(order, parts))
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

function renderPrintDocument(order, parts) {
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
    <!doctype html>
    <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <title></title>
        <link rel="stylesheet" href="/wo-print.css" />
      </head>
      <body>
        <main class="print-page">
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
        </main>
      </body>
    </html>
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
    if (totalSupply >= qtyOrder) return supply.ata || ''
  }

  return ''
}

function getTimestamp(timestamp) {
  if (!timestamp) return 0
  if (typeof timestamp.toMillis === 'function') return timestamp.toMillis()
  if (typeof timestamp.toDate === 'function') return timestamp.toDate().getTime()
  return 0
}
