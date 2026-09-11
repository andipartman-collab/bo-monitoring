import * as XLSX from 'xlsx'

import {
  applyETAUpdate,
  previewETAUpdate,
  normalizeETA
} from '../../services/etaUpdateService.js'


let currentPreview = []
let currentSummary = null


export function renderETAUpdate() {
  return `
    <div class="eta-update-page">

      <div class="eta-update-header">
        <div>
          <h2>Update ETA</h2>
          <p>Upload file Excel Logistic untuk mencocokkan Order No + Process Pno.</p>
        </div>
      </div>

      <section class="eta-update-card">
        <div class="eta-update-card-header">
          <h3>1. Upload File Excel Logistic</h3>
          <p>Data yang digunakan: Order No, Process Pno, dan Latest ETD. ETA baru = Latest ETD + 1 hari.</p>
        </div>

        <div class="eta-update-upload-body">
          <input
            type="file"
            id="eta-update-file"
            accept=".xlsx,.xls"
          >

          <div id="eta-update-file-name" class="eta-update-file-name">
            Belum ada file dipilih.
          </div>

          <button
            type="button"
            id="eta-update-preview-button"
            class="eta-update-primary-button"
            disabled
          >
            Cek & Preview
          </button>
        </div>
      </section>

      <section class="eta-update-card" id="eta-update-summary-card" style="display:none;">
        <div class="eta-update-card-header">
          <h3>2. Hasil Pencocokan</h3>
          <p>Belum ada data yang disimpan sampai tombol Update ETA ditekan.</p>
        </div>

        <div class="eta-update-summary" id="eta-update-summary"></div>

        <div class="eta-update-actions">
          <button
            type="button"
            id="eta-update-apply-button"
            class="eta-update-primary-button"
            disabled
          >
            Update ETA
          </button>
        </div>
      </section>

      <section class="eta-update-card" id="eta-update-result-card" style="display:none;">
        <div class="eta-update-card-header">
          <h3>3. Preview Data</h3>
          <p id="eta-update-result-note"></p>
        </div>

        <div class="eta-update-table-wrapper">
          <table class="eta-update-table">
            <thead>
              <tr>
                <th>Order No</th>
                <th>Process Pno</th>
                <th>Latest ETD</th>
                <th>ETA Lama</th>
                <th>ETA Baru</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="eta-update-table-body"></tbody>
          </table>
        </div>
      </section>

      <div id="eta-update-message" class="eta-update-message"></div>

    </div>
  `
}


export function initETAUpdate() {
  const fileInput = document.getElementById('eta-update-file')
  const fileName = document.getElementById('eta-update-file-name')
  const previewButton = document.getElementById('eta-update-preview-button')
  const applyButton = document.getElementById('eta-update-apply-button')

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

      const result = await previewETAUpdate(rows)

      currentPreview = result.preview
      currentSummary = result.summary

      renderSummary(result.summary)
      renderPreview(result.preview)
      showResults()
    }
    catch (error) {
      console.error('GAGAL PREVIEW ETA:', error)
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
    if (!currentPreview.length || !currentSummary?.changed) {
      showMessage(
        'Tidak ada perubahan ETA yang perlu disimpan.',
        'error'
      )
      return
    }

    const confirmed = window.confirm(
      `Update ${currentSummary.changed} ETA sekarang?`
    )

    if (!confirmed) {
      return
    }

    applyButton.disabled = true
    applyButton.textContent = 'Mengupdate ETA...'
    clearMessage()

    try {
      const result = await applyETAUpdate(currentPreview)

      showMessage(
        `${result.updated} ETA berhasil diperbarui dan history ETA telah dicatat.`,
        'success'
      )

      const refreshedPreview = currentPreview.map(row => {
        if (row.status !== 'CHANGED') {
          return row
        }

        return {
          ...row,
          currentETA: row.newETA,
          status: 'UPDATED'
        }
      })

      currentPreview = refreshedPreview
      currentSummary = {
        ...currentSummary,
        changed: 0,
        same: currentSummary.same + result.updated
      }

      renderSummary(currentSummary)
      renderPreview(currentPreview)
    }
    catch (error) {
      console.error('GAGAL UPDATE ETA:', error)
      showMessage(
        error.message || 'Gagal menyimpan update ETA.',
        'error'
      )
    }
    finally {
      applyButton.disabled = !currentSummary?.changed
      applyButton.textContent = 'Update ETA'
    }
  }
}


function renderSummary(summary) {
  const container = document.getElementById('eta-update-summary')
  const applyButton = document.getElementById('eta-update-apply-button')

  if (!container) return

  if (summary.changed > 0) {
    container.innerHTML = `
      <div class="eta-update-summary-message changed">
        Terdapat perubahan ETA &raquo; <strong>${summary.changed} order</strong>
      </div>
    `
  }
  else {
    container.innerHTML = `
      <div class="eta-update-summary-message no-change">
        ETA tidak berubah
      </div>
    `
  }

  if (applyButton) {
    applyButton.disabled = summary.changed === 0
  }
}


function renderPreview(rows) {
  const tbody = document.getElementById('eta-update-table-body')
  const note = document.getElementById('eta-update-result-note')

  if (!tbody) return

  const visibleRows = rows.slice(0, 100)

  tbody.innerHTML = visibleRows.map(row => `
    <tr>
      <td>${escapeCell(row.noOrder)}</td>
      <td>${escapeCell(row.pno)}</td>
      <td>${formatETA(row.latestETD)}</td>
      <td>${formatETA(row.currentETA)}</td>
      <td>${formatETA(row.newETA)}</td>
      <td>
        <span class="eta-update-status ${row.status.toLowerCase()}">
          ${row.status}
        </span>
      </td>
    </tr>
  `).join('')

  note.textContent = rows.length > 100
    ? `Menampilkan 100 dari ${rows.length} baris preview.`
    : `${rows.length} baris diproses.`
}


function formatETA(value) {
  const eta = normalizeETA(value)

  if (!eta) return '-'

  const [year, month, day] = eta.split('-')
  return `${day}/${month}/${year}`
}


function escapeCell(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}


function showResults() {
  const summaryCard = document.getElementById('eta-update-summary-card')
  const resultCard = document.getElementById('eta-update-result-card')

  if (summaryCard) summaryCard.style.display = 'block'
  if (resultCard) resultCard.style.display = 'block'
}


function hideResults() {
  const summaryCard = document.getElementById('eta-update-summary-card')
  const resultCard = document.getElementById('eta-update-result-card')
  const tbody = document.getElementById('eta-update-table-body')
  const applyButton = document.getElementById('eta-update-apply-button')

  if (summaryCard) summaryCard.style.display = 'none'
  if (resultCard) resultCard.style.display = 'none'
  if (tbody) tbody.innerHTML = ''
  if (applyButton) applyButton.disabled = true
}


function showMessage(text, type) {
  const message = document.getElementById('eta-update-message')

  if (!message) return

  message.textContent = text
  message.className = `eta-update-message ${type}`
}


function clearMessage() {
  const message = document.getElementById('eta-update-message')

  if (!message) return

  message.textContent = ''
  message.className = 'eta-update-message'
}
