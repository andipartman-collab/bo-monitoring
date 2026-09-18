import {
  addPartToWorkOrder
} from '../../services/partService.js'


export function renderWODetailPartAddModal() {
  return `
    <div
      id="part-add-modal"
      class="wo-edit-modal"
      style="display:none;"
    >
      <div class="wo-edit-overlay" data-part-add-close></div>

      <div
        class="wo-edit-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="part-add-title"
      >
        <div class="wo-edit-header">
          <div>
            <h2 id="part-add-title">Tambah Part Order</h2>
            <p>Tambahkan spare part ke Work Order ini.</p>
          </div>

          <button
            type="button"
            class="wo-edit-close-button"
            data-part-add-close
            aria-label="Tutup"
          >
            ×
          </button>
        </div>

        <form id="part-add-form" class="wo-edit-form">
          <div class="wo-edit-grid">

            <div class="wo-edit-field">
              <label for="part-add-pno">PNO</label>
              <input
                type="text"
                id="part-add-pno"
                required
                autocomplete="off"
              >
            </div>

            <div class="wo-edit-field">
              <label for="part-add-nama-part">Nama Part</label>
              <input
                type="text"
                id="part-add-nama-part"
                required
                autocomplete="off"
              >
            </div>

            <div class="wo-edit-field">
              <label for="part-add-no-order">No Order</label>
              <input
                type="text"
                id="part-add-no-order"
                required
                autocomplete="off"
              >
            </div>

            <div class="wo-edit-field">
              <label for="part-add-tgl-order">Tgl Order</label>
              <input
                type="date"
                id="part-add-tgl-order"
                required
              >
            </div>

            <div class="wo-edit-field">
              <label for="part-add-qty-order">Qty Order</label>
              <input
                type="number"
                id="part-add-qty-order"
                min="1"
                step="1"
                required
              >
            </div>

            <div class="wo-edit-field">
              <label for="part-add-eta">ETA</label>
              <input
                type="date"
                id="part-add-eta"
              >
            </div>

          </div>

          <div id="part-add-message" class="wo-edit-message"></div>

          <div class="wo-edit-actions">
            <button
              type="button"
              class="wo-edit-cancel-button"
              data-part-add-close
            >
              Batal
            </button>

            <button
              type="submit"
              class="wo-edit-save-button"
            >
              Tambah Part
            </button>
          </div>
        </form>
      </div>
    </div>
  `
}


export function initWODetailPartAdd(
  orderId,
  onSaved
) {
  const modal = document.getElementById('part-add-modal')
  const form = document.getElementById('part-add-form')

  if (!modal || !form) {
    return
  }

  const pnoInput = document.getElementById('part-add-pno')
  const namaPartInput = document.getElementById('part-add-nama-part')
  const noOrderInput = document.getElementById('part-add-no-order')
  const tglOrderInput = document.getElementById('part-add-tgl-order')
  const qtyOrderInput = document.getElementById('part-add-qty-order')
  const etaInput = document.getElementById('part-add-eta')
  const message = document.getElementById('part-add-message')
  const saveButton = form.querySelector('.wo-edit-save-button')

  const clearMessage = () => {
    if (!message) return
    message.textContent = ''
    message.className = 'wo-edit-message'
  }

  const showMessage = text => {
    if (!message) return
    message.textContent = text
    message.className = 'wo-edit-message error'
  }

  const getTodayDate = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const openModal = () => {
    form.reset()
    clearMessage()
    tglOrderInput.value = getTodayDate()
    modal.style.display = 'flex'
    document.body.classList.add('wo-edit-modal-open')

    setTimeout(() => {
      pnoInput.focus()
    }, 0)
  }

  const closeModal = () => {
    modal.style.display = 'none'
    document.body.classList.remove('wo-edit-modal-open')
    clearMessage()
    form.reset()
  }

  const addButton =
    document.getElementById('wo-add-part-button')

  if (addButton) {
    addButton.onclick = openModal
  }

  modal
    .querySelectorAll('[data-part-add-close]')
    .forEach(element => {
      element.onclick = closeModal
    })

  form.onsubmit = async event => {
    event.preventDefault()
    clearMessage()

    const pno = pnoInput.value.trim().toUpperCase()
    const namaPart = namaPartInput.value.trim().toUpperCase()
    const noOrder = noOrderInput.value.trim().toUpperCase()
    const tglOrder = tglOrderInput.value || ''
    const qtyOrder = Number(qtyOrderInput.value || 0)
    const eta = etaInput.value || ''

    if (!pno) {
      showMessage('PNO wajib diisi.')
      pnoInput.focus()
      return
    }

    if (!namaPart) {
      showMessage('Nama Part wajib diisi.')
      namaPartInput.focus()
      return
    }

    if (!noOrder) {
      showMessage('No Order wajib diisi.')
      noOrderInput.focus()
      return
    }

    if (!tglOrder) {
      showMessage('Tgl Order wajib diisi.')
      tglOrderInput.focus()
      return
    }

    if (!Number.isInteger(qtyOrder) || qtyOrder <= 0) {
      showMessage(
        'Qty Order harus berupa angka bulat lebih dari 0.'
      )
      qtyOrderInput.focus()
      return
    }

    if (saveButton) {
      saveButton.disabled = true
      saveButton.textContent = 'Menambahkan...'
    }

    try {
      await addPartToWorkOrder(
        orderId,
        {
          pno,
          namaPart,
          noOrder,
          tglOrder,
          qtyOrder,
          eta
        }
      )

      closeModal()

      if (typeof onSaved === 'function') {
        await onSaved()
      }
    }
    catch (error) {
      console.error(
        'GAGAL TAMBAH PART:',
        error
      )

      showMessage(
        error.message ||
        'Gagal menambahkan part.'
      )
    }
    finally {
      if (saveButton) {
        saveButton.disabled = false
        saveButton.textContent = 'Tambah Part'
      }
    }
  }
}
