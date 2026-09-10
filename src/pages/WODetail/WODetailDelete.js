import {
  deleteWorkOrder
} from '../../services/woDeleteService.js'

import {
  escapeHTML
} from './WODetailUtils.js'


/*
  ==================================================
  RENDER DELETE CONFIRMATION
  ==================================================
*/
export function renderWODetailDeleteModal() {

  return `

    <div
      id="wo-delete-modal"
      class="wo-delete-modal"
      style="display: none;"
    >

      <div
        class="wo-delete-overlay"
        data-wo-delete-close
      ></div>

      <div
        class="wo-delete-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wo-delete-title"
      >

        <div class="wo-delete-header">

          <div class="wo-delete-icon">
            !
          </div>

          <div>
            <h2 id="wo-delete-title">
              Hapus Work Order?
            </h2>
            <p>
              Tindakan ini akan menghapus seluruh data WO.
            </p>
          </div>

        </div>

        <div class="wo-delete-body">

          <div class="wo-delete-wo-info">
            <span>No WO</span>
            <strong id="wo-delete-no-wo">-</strong>
          </div>

          <p class="wo-delete-warning">
            Semua part, supply, history supply, dan history ETA
            yang terkait dengan WO ini juga akan dihapus.
            Data yang sudah dihapus tidak dapat dikembalikan.
          </p>

          <div
            id="wo-delete-message"
            class="wo-delete-message"
          ></div>

        </div>

        <div class="wo-delete-actions">

          <button
            type="button"
            class="wo-delete-cancel-button"
            data-wo-delete-close
          >
            Batal
          </button>

          <button
            type="button"
            id="wo-delete-confirm"
            class="wo-delete-confirm-button"
          >
            Ya, Hapus WO
          </button>

        </div>

      </div>

    </div>

  `
}


/*
  ==================================================
  INIT DELETE
  ==================================================
*/
export function initWODetailDelete(
  orderId,
  order
) {

  const deleteButton =
    document.getElementById('wo-delete-button')

  const modal =
    document.getElementById('wo-delete-modal')

  const confirmButton =
    document.getElementById('wo-delete-confirm')

  const message =
    document.getElementById('wo-delete-message')

  const noWo =
    document.getElementById('wo-delete-no-wo')

  if (
    !deleteButton ||
    !modal ||
    !confirmButton
  ) {
    return
  }

  function clearMessage() {
    if (!message) return

    message.textContent = ''
    message.className = 'wo-delete-message'
  }

  function showMessage(text) {
    if (!message) return

    message.textContent = text
    message.className = 'wo-delete-message error'
  }

  function openModal() {
    clearMessage()

    if (noWo) {
      noWo.innerHTML = escapeHTML(
        order?.noWo || '-'
      )
    }

    confirmButton.disabled = false
    confirmButton.textContent = 'Ya, Hapus WO'

    modal.style.display = 'flex'
    document.body.classList.add('wo-delete-modal-open')
  }

  function closeModal() {
    modal.style.display = 'none'
    document.body.classList.remove('wo-delete-modal-open')
    clearMessage()
  }

  deleteButton.onclick = openModal

  modal
    .querySelectorAll('[data-wo-delete-close]')
    .forEach(element => {
      element.onclick = closeModal
    })

  confirmButton.onclick = async () => {

    clearMessage()

    confirmButton.disabled = true
    confirmButton.textContent = 'Menghapus...'

    try {

      await deleteWorkOrder(
        orderId
      )

      closeModal()

      document.dispatchEvent(
        new CustomEvent(
          'work-order-deleted'
        )
      )

    }
    catch (error) {

      console.error(
        'GAGAL HAPUS WO:',
        error
      )

      showMessage(
        error.message ||
        'Gagal menghapus Work Order.'
      )

      confirmButton.disabled = false
      confirmButton.textContent = 'Ya, Hapus WO'

    }
  }
}
