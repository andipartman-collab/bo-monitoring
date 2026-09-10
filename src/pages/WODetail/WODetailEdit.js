import {
  updateOrder
} from '../../services/orderService.js'

import {
  escapeHTML
} from './WODetailUtils.js'

import {
  saList
} from '../NewOrder/saList.js'


/*
  ==================================================
  RENDER EDIT MODAL
  ==================================================
*/

export function renderWODetailEditModal() {

  return `

    <div
      id="wo-edit-modal"
      class="wo-edit-modal"
      style="display: none;"
    >

      <div class="wo-edit-overlay" data-edit-close></div>

      <div
        class="wo-edit-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wo-edit-title"
      >

        <div class="wo-edit-header">

          <div>
            <h2 id="wo-edit-title">
              Edit Informasi Work Order
            </h2>
            <p>
              Ubah informasi utama Work Order.
            </p>
          </div>

          <button
            type="button"
            class="wo-edit-close-button"
            data-edit-close
            aria-label="Tutup"
          >
            ×
          </button>

        </div>

        <form id="wo-edit-form" class="wo-edit-form">

          <div class="wo-edit-grid">

            <div class="wo-edit-field">
              <label for="wo-edit-no-wo">No WO</label>
              <input
                type="text"
                id="wo-edit-no-wo"
                disabled
              >
              <small>
                No WO tidak dapat diubah. Jika salah, hapus WO lalu buat ulang.
              </small>
            </div>

            <div class="wo-edit-field">
              <label for="wo-edit-sa">SA</label>
              <select id="wo-edit-sa" required>
                <option value="">Pilih SA</option>
                ${saList.map(sa => `
                  <option value="${escapeHTML(sa)}">
                    ${escapeHTML(sa)}
                  </option>
                `).join('')}
              </select>
            </div>

            <div class="wo-edit-field">
              <label for="wo-edit-customer">Customer</label>
              <input
                type="text"
                id="wo-edit-customer"
                required
              >
            </div>

            <div class="wo-edit-field">
              <label for="wo-edit-no-polisi">No Polisi</label>
              <input
                type="text"
                id="wo-edit-no-polisi"
                required
              >
            </div>

            <div class="wo-edit-field">
              <label for="wo-edit-model">Model</label>
              <input
                type="text"
                id="wo-edit-model"
                required
              >
            </div>

            <div class="wo-edit-field">
              <label for="wo-edit-tanggal-booking">Tgl Booking</label>
              <input
                type="date"
                id="wo-edit-tanggal-booking"
              >
            </div>

            <div class="wo-edit-field wo-edit-field-full">
              <label for="wo-edit-note">Note</label>
              <textarea
                id="wo-edit-note"
                rows="4"
              ></textarea>
            </div>

          </div>

          <div
            id="wo-edit-message"
            class="wo-edit-message"
          ></div>

          <div class="wo-edit-actions">

            <button
              type="button"
              class="wo-edit-cancel-button"
              data-edit-close
            >
              Batal
            </button>

            <button
              type="submit"
              class="wo-edit-save-button"
            >
              Simpan Perubahan
            </button>

          </div>

        </form>

      </div>

    </div>

  `
}


/*
  ==================================================
  INIT EDIT
  ==================================================
*/

export function initWODetailEdit(
  orderId,
  order,
  onSaved
) {

  const editButton =
    document.getElementById('wo-edit-button')

  const modal =
    document.getElementById('wo-edit-modal')

  const form =
    document.getElementById('wo-edit-form')

  if (!editButton || !modal || !form) {

    console.warn(
      'WO EDIT: elemen edit belum tersedia.'
    )

    return
  }

  const noWoInput =
    document.getElementById('wo-edit-no-wo')

  const saInput =
    document.getElementById('wo-edit-sa')

  const customerInput =
    document.getElementById('wo-edit-customer')

  const noPolisiInput =
    document.getElementById('wo-edit-no-polisi')

  const modelInput =
    document.getElementById('wo-edit-model')

  const tanggalBookingInput =
    document.getElementById('wo-edit-tanggal-booking')

  const noteInput =
    document.getElementById('wo-edit-note')

  const message =
    document.getElementById('wo-edit-message')

  const saveButton =
    form.querySelector('.wo-edit-save-button')


  function clearMessage() {

    if (!message) return

    message.textContent = ''
    message.className = 'wo-edit-message'
  }


  function fillForm() {

    noWoInput.value =
      order.noWo || ''

    saInput.value =
      order.sa || ''

    customerInput.value =
      order.customer || ''

    noPolisiInput.value =
      order.noPolisi || ''

    modelInput.value =
      order.model || ''

    tanggalBookingInput.value =
      order.tanggalBooking || ''

    noteInput.value =
      order.note || ''

    clearMessage()
  }


  function openModal() {

    fillForm()

    modal.style.display = 'flex'
    modal.removeAttribute('hidden')

    document.body.classList.add(
      'wo-edit-modal-open'
    )

    setTimeout(() => {
      customerInput.focus()
    }, 0)
  }


  function closeModal() {

    modal.style.display = 'none'

    document.body.classList.remove(
      'wo-edit-modal-open'
    )

    clearMessage()
  }


  editButton.onclick = openModal


  modal.querySelectorAll('[data-edit-close]').forEach(
    element => {

      element.onclick = closeModal

    }
  )


  form.onsubmit = async event => {

    event.preventDefault()
    clearMessage()

    const sa =
      saInput.value.trim().toUpperCase()

    const customer =
      customerInput.value.trim().toUpperCase()

    const noPolisi =
      noPolisiInput.value.trim().toUpperCase()

    const model =
      modelInput.value.trim().toUpperCase()

    const tanggalBooking =
      tanggalBookingInput.value || ''

    const note =
      noteInput.value.trim().toUpperCase()

    if (!sa) {
      showMessage('SA wajib dipilih.', 'error')
      saInput.focus()
      return
    }

    if (!customer) {
      showMessage('Customer wajib diisi.', 'error')
      customerInput.focus()
      return
    }

    if (!noPolisi) {
      showMessage('No Polisi wajib diisi.', 'error')
      noPolisiInput.focus()
      return
    }

    if (!model) {
      showMessage('Model wajib diisi.', 'error')
      modelInput.focus()
      return
    }

    saveButton.disabled = true
    saveButton.textContent = 'Menyimpan...'

    try {

      await updateOrder(
        orderId,
        {
          sa,
          customer,
          noPolisi,
          model,
          tanggalBooking,
          note
        }
      )

      closeModal()

      if (typeof onSaved === 'function') {
        await onSaved()
      }

    }
    catch (error) {

      console.error(
        'GAGAL UPDATE WO:',
        error
      )

      showMessage(
        error.message ||
        'Gagal menyimpan perubahan WO.',
        'error'
      )

    }
    finally {

      saveButton.disabled = false
      saveButton.textContent =
        'Simpan Perubahan'

    }

  }


  function showMessage(
    text,
    type
  ) {

    if (!message) return

    message.textContent = text
    message.className =
      `wo-edit-message ${type}`
  }
}
