import * as XLSX from 'xlsx'

import {
  applyATAUpdate,
  previewATAUpdate
} from '../../services/ataUpdateService.js'


let currentPreview = []
let currentSummary = null


export function renderATAUpdate() {
  return `
    <div class="ata-update-page">

      <section class="ata-update-card">
        <div class="ata-update-card-header">
          <h3>1. Upload File Excel Logistic</h3>
          <p>Data yang digunakan: Cust. Order No., Part No., dan Shipped Qty.</p>
        </div>

        <div class="ata-update-upload-body">
          <input
            type="file"
            id="ata-update-file"
            accept=".xlsx,.xls"
          >

          <div id="ata-update-file-name" class="ata-update-file-name">
            Belum ada file dipilih.
          </div>

          <button
            type="button"
            id="ata-update-preview-button"
            class="ata-update-primary-button"
            disabled
          >
            Cek & Preview
          </button>
        </div>
      </section>

      <section class="ata-update-card" id="ata-update-summary-card" style="display:none;">
        <div class="ata-update-card-header">
          <h3>2. Hasil Pencocokan</h3>
          <p id="ata-update-summary-note">Belum ada data yang disimpan sampai tombol Update ATA ditekan.</p>
        </div>

        <div class="ata-update-summary" id="ata-update-summary"></div>

        <div class="ata-update-actions" id="ata-update-actions">
          <button
            type="button"
            id="ata-update-apply-button"
            class="ata-update-primary-button"
            disabled
          >
            Update ATA
          </button>
        </div>
      </section>

      <section class="ata-update-card" id="ata-update-result-card" style="display:none;">
        <div class="ata-update-card-header">
          <h3>3. Preview Data</h3>
          <p id="ata-update-result-note"></p>
        </div>

        <div class="ata-update-table-wrapper">
          <table class="ata-update-table">
            <thead>
              <tr>
                <th>No Order</th>
                <th>Part No.</th>
                <th>Nama Part</th>
                <th>Qty Supply</th>
                <th>Supply Saat Ini</th>
                <th>Sisa</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="ata-update-table-body"></tbody>
          </table>
        </div>
      </section>

      <div id="ata-update-message" class="ata-update-message"></div>

    </div>
  `
}


export function initATAUpdate() {
  const fileInput = document.getElementById('ata-update-file')
  const fileName = document.getElementById('ata-update-file-name')
  const previewButton = document.getElementById('ata-update-preview-button')
  const applyButton = document.getElementById('ata-update-apply-button')

  if (!fileInput || !previewButton || !applyButton) {
    return
  }

  currentPreview = []
  currentSummary = null

  fileInput.onchange = () => {
    const file = fileInput.files?.[0]

    fileName.textContent = file
      ? file.name
      : 'Belum ada file dipilih.'

    previewButton.disabled = !file
    hideResults()
    clearMessage()
  }

  previewButton.onclick = async () => {
    const file = fileInput.files?.[0]

    if (!file) {
      showMessage(
        'Silakan pilih file Excel Logistic terlebih dahulu.',
        'error'
      )
      return
    }

    previewButton.disabled = true
    previewButton.textContent = 'Membaca Excel...'
    clearMessage()
    hideResults()

    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, {
        type: 'array',
        cellDates: true
      })

      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]

      if (!worksheet) {
        throw new Error('Sheet Excel tidak ditemukan.')
      }

      const rows = XLSX.utils.sheet_to_json(
        worksheet,
        {
          defval: '',
          raw: false
        }
      )

      const result = await previewATAUpdate(rows)

      currentPreview = result.preview
      currentSummary = result.summary

      renderSummary(result.summary)
      renderPreview(result.preview)
      showResults()
    }
    catch (error) {
      console.error('GAGAL PREVIEW ATA:', error)
      showMessage(
        error.message || 'Gagal membaca dan mencocokkan file Excel.',
        'error'
      )
    }
    finally {
      previewButton.disabled = !fileInput.files?.[0]
      previewButton.textContent = 'Cek & Preview'
    }
  }

  applyButton.onclick = async () => {
    if (!currentPreview.length || !currentSummary?.matched) {
      showMessage(
        'Tidak ada data supply yang bisa diupdate.',
        'error'
      )
      return
    }

    const confirmed = window.confirm(
      `Tambahkan supply untuk ${currentSummary.matched} part sekarang?`
    )

    if (!confirmed) {
      return
    }

    applyButton.disabled = true
    applyButton.textContent = 'Mengupdate ATA...'
    clearMessage()

    try {
      const result = await applyATAUpdate(currentPreview)

      showUpdateSuccess(result.updated)

      currentPreview = []
      currentSummary = null
    }
    catch (error) {
      console.error('GAGAL UPDATE ATA:', error)
      showMessage(
        error.message || 'Gagal menyimpan supply hasil import.',
        'error'
      )
    }
    finally {
      if (document.getElementById('ata-update-apply-button')) {
        applyButton.disabled = true
        applyButton.textContent = 'Update ATA'
      }
    }
  }
}


function renderSummary(summary) {
  const container = document.getElementById('ata-update-summary')
  const applyButton = document.getElementById('ata-update-apply-button')
  const note = document.getElementById('ata-update-summary-note')

  if (!container) return

  const notMatched =
    Number(summary.notFound || 0) +
    Number(summary.overSupply || 0) +
    Number(summary.invalid || 0)

  const messages = []

  if (summary.matched > 0) {
    messages.push(`
      <div class="ata-update-summary-message matched">
        Terdapat <strong>${summary.matched} supply part baru</strong>
      </div>
    `)
  }

  if (notMatched > 0) {
    messages.push(`
      <div class="ata-update-summary-message not-found">
        Tidak ditemukan data supply baru
      </div>
    `)
  }

  if (messages.length === 0) {
    messages.push(`
      <div class="ata-update-summary-message not-found">
        Tidak ditemukan data supply baru
      </div>
    `)
  }

  container.innerHTML = messages.join('')

  if (note) {
    note.textContent =
      'Data belum disimpan sampai tombol Update ATA ditekan. Duplicate Excel sudah dijumlahkan.'
  }

  if (applyButton) {
    applyButton.disabled = summary.matched === 0
  }
}


function showUpdateSuccess(updatedCount) {
  const summaryContainer = document.getElementById('ata-update-summary')
  const summaryNote = document.getElementById('ata-update-summary-note')
  const actions = document.getElementById('ata-update-actions')
  const tbody = document.getElementById('ata-update-table-body')

  if (tbody) {
    tbody.innerHTML = ''
  }

  if (summaryNote) {
    summaryNote.textContent = 'Proses update ATA telah selesai.'
  }

  if (summaryContainer) {
    summaryContainer.innerHTML = `
      <div class="ata-update-summary-message success">
        Supply berhasil ditambahkan &raquo; <strong>${updatedCount} part</strong>
      </div>
    `
  }

  if (actions) {
    actions.style.display = 'none'
  }

  const resultCard = document.getElementById('ata-update-result-card')

  if (resultCard) {
    resultCard.style.display = 'none'
  }

  clearMessage()
}


function renderPreview(rows) {
  const tbody = document.getElementById('ata-update-table-body')
  const note = document.getElementById('ata-update-result-note')

  if (!tbody) return

  const visibleRows = rows.slice(0, 100)

  tbody.innerHTML = visibleRows.map(row => `
    <tr>
      <td>${escapeCell(row.noOrder)}</td>
      <td>${escapeCell(row.pno)}</td>
      <td>${escapeCell(row.namaPart || '-')}</td>
      <td>${row.qtySupply}</td>
      <td>${row.currentSupply}</td>
      <td>${row.sisa}</td>
      <td>
        <span class="ata-update-status ${row.status.toLowerCase().replaceAll('_', '-')}"">
          ${row.status}
        </span>
      </td>
    </tr>
  `).join('')

  note.textContent = rows.length > 100
    ? `Menampilkan 100 dari ${rows.length} kombinasi.`
    : `${rows.length} kombinasi diproses.`
}


function showResults() {
  const summaryCard = document.getElementById('ata-update-summary-card')
  const resultCard = document.getElementById('ata-update-result-card')

  if (summaryCard) summaryCard.style.display = 'block'
  if (resultCard) resultCard.style.display = 'block'
}


function hideResults() {
  const summaryCard = document.getElementById('ata-update-summary-card')
  const resultCard = document.getElementById('ata-update-result-card')
  const tbody = document.getElementById('ata-update-table-body')
  const applyButton = document.getElementById('ata-update-apply-button')
  const actions = document.getElementById('ata-update-actions')
  const summaryContainer = document.getElementById('ata-update-summary')
  const summaryNote = document.getElementById('ata-update-summary-note')

  if (summaryCard) summaryCard.style.display = 'none'
  if (resultCard) resultCard.style.display = 'none'
  if (tbody) tbody.innerHTML = ''
  if (applyButton) applyButton.disabled = true
  if (actions) actions.style.display = 'flex'
  if (summaryContainer) summaryContainer.innerHTML = ''
  if (summaryNote) {
    summaryNote.textContent =
      'Belum ada data yang disimpan sampai tombol Update ATA ditekan.'
  }
}


function showMessage(text, type) {
  const message = document.getElementById('ata-update-message')

  if (!message) return

  message.textContent = text
  message.className = `ata-update-message ${type}`
}


function clearMessage() {
  const message = document.getElementById('ata-update-message')

  if (!message) return

  message.textContent = ''
  message.className = 'ata-update-message'
}


function escapeCell(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
