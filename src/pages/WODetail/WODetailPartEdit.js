import {
  escapeHTML
} from './WODetailUtils.js'


/*
  ==================================================
  RENDER PART EDIT MODAL
  ==================================================
*/

export function renderWODetailPartEditModal() {

  return `

    <div
      id="part-edit-modal"
      class="wo-edit-modal"
      style="display: none;"
    >

      <div
        class="wo-edit-overlay"
        data-part-edit-close
      ></div>

      <div
        class="wo-edit-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="part-edit-title"
      >

        <div class="wo-edit-header">

          <div>

            <h2 id="part-edit-title">
              Edit Part Order
            </h2>

            <p>
              Ubah informasi part order.
            </p>

          </div>

          <button
            type="button"
            class="wo-edit-close-button"
            data-part-edit-close
            aria-label="Tutup"
          >
            ×
          </button>

        </div>

        <form
          id="part-edit-form"
          class="wo-edit-form"
        >

          <div class="wo-edit-grid">

            <div class="wo-edit-field">

              <label for="part-edit-pno">
                PNO
              </label>

              <input
                type="text"
                id="part-edit-pno"
                required
              >

            </div>

            <div class="wo-edit-field">

              <label for="part-edit-nama-part">
                Nama Part
              </label>

              <input
                type="text"
                id="part-edit-nama-part"
                required
              >

            </div>

            <div class="wo-edit-field">

              <label for="part-edit-no-order">
                No Order
              </label>

              <input
                type="text"
                id="part-edit-no-order"
                required
              >

            </div>

            <div class="wo-edit-field">

              <label for="part-edit-tgl-order">
                Tgl Order
              </label>

              <input
                type="date"
                id="part-edit-tgl-order"
                required
              >

            </div>

            <div class="wo-edit-field">

              <label for="part-edit-qty-order">
                Qty Order
              </label>

              <input
                type="number"
                id="part-edit-qty-order"
                min="1"
                step="1"
                required
              >

              <small id="part-edit-supply-info">
                Supply saat ini: 0
              </small>

            </div>

            <div class="wo-edit-field">

              <label for="part-edit-eta">
                ETA
              </label>

              <input
                type="date"
                id="part-edit-eta"
              >

              <small>
                Jika ETA berubah, sistem akan mencatat history ETA.
              </small>

            </div>

          </div>

          <div
            id="part-edit-message"
            class="wo-edit-message"
          ></div>

          <div class="wo-edit-actions">

            <button
              type="button"
              class="wo-edit-cancel-button"
              data-part-edit-close
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
  INIT PART EDIT
  ==================================================
*/

export function initWODetailPartEdit(
  orderId,
  onSaved
) {

  const modal =
    document.getElementById('part-edit-modal')

  const form =
    document.getElementById('part-edit-form')

  const message =
    document.getElementById('part-edit-message')

  if (!modal || !form) {
    return
  }

  const pnoInput =
    document.getElementById('part-edit-pno')

  const namaPartInput =
    document.getElementById('part-edit-nama-part')

  const noOrderInput =
    document.getElementById('part-edit-no-order')

  const tglOrderInput =
    document.getElementById('part-edit-tgl-order')

  const qtyOrderInput =
    document.getElementById('part-edit-qty-order')

  const etaInput =
    document.getElementById('part-edit-eta')

  const supplyInfo =
    document.getElementById('part-edit-supply-info')

  const saveButton =
    form.querySelector('.wo-edit-save-button')

  let currentPartId = null

  let currentOriginalETA = ''

  let currentTotalSupply = 0


  function clearMessage() {

    if (!message) return

    message.textContent = ''
    message.className = 'wo-edit-message'

  }


  function showMessage(text, type) {

    if (!message) return

    message.textContent = text
    message.className =
      `wo-edit-message ${type}`

  }


  function openModal(part) {

    if (!part || !part.id) {
      return
    }

    currentPartId = part.id
    currentOriginalETA = part.eta || ''
    currentTotalSupply = Number(
      part.totalSupply || 0
    )

    pnoInput.value =
      part.pno || ''

    namaPartInput.value =
      part.namaPart || ''

    noOrderInput.value =
      part.noOrder || ''

    tglOrderInput.value =
      part.tglOrder || ''

    qtyOrderInput.value =
      Number(part.qtyOrder || 0)

    etaInput.value =
      part.eta || ''

    if (supplyInfo) {
      supplyInfo.textContent =
        `Supply saat ini: ${currentTotalSupply}`
    }

    qtyOrderInput.min =
      Math.max(1, currentTotalSupply)

    clearMessage()

    modal.style.display = 'flex'

    document.body.classList.add(
      'wo-edit-modal-open'
    )

    setTimeout(() => {
      pnoInput.focus()
    }, 0)

  }


  function closeModal() {

    modal.style.display = 'none'

    document.body.classList.remove(
      'wo-edit-modal-open'
    )

    clearMessage()

    currentPartId = null

  }


  document
    .querySelectorAll('.wo-detail-part-edit-button')
    .forEach(button => {

      button.onclick = () => {

        const part = {
          id:
            button.dataset.partId || '',
          pno:
            button.dataset.pno || '',
          namaPart:
            button.dataset.namaPart || '',
          noOrder:
            button.dataset.noOrder || '',
          tglOrder:
            button.dataset.tglOrder || '',
          qtyOrder:
            Number(button.dataset.qtyOrder || 0),
          eta:
            button.dataset.eta || '',
          totalSupply:
            Number(button.dataset.totalSupply || 0)
        }

        openModal(part)

      }

    })


  modal
    .querySelectorAll('[data-part-edit-close]')
    .forEach(element => {

      element.onclick = closeModal

    })


  form.onsubmit = async event => {

    event.preventDefault()
    clearMessage()

    const pno =
      pnoInput.value.trim().toUpperCase()

    const namaPart =
      namaPartInput.value.trim().toUpperCase()

    const noOrder =
      noOrderInput.value.trim().toUpperCase()

    const tglOrder =
      tglOrderInput.value || ''

    const qtyOrder =
      Number(qtyOrderInput.value || 0)

    const eta =
      etaInput.value || ''

    if (!currentPartId) {
      showMessage(
        'Part tidak ditemukan.',
        'error'
      )
      return
    }

    if (!pno) {
      showMessage('PNO wajib diisi.', 'error')
      pnoInput.focus()
      return
    }

    if (!namaPart) {
      showMessage('Nama Part wajib diisi.', 'error')
      namaPartInput.focus()
      return
    }

    if (!noOrder) {
      showMessage('No Order wajib diisi.', 'error')
      noOrderInput.focus()
      return
    }

    if (!tglOrder) {
      showMessage('Tgl Order wajib diisi.', 'error')
      tglOrderInput.focus()
      return
    }

    if (!Number.isInteger(qtyOrder) || qtyOrder <= 0) {
      showMessage(
        'Qty Order harus berupa angka bulat lebih dari 0.',
        'error'
      )
      qtyOrderInput.focus()
      return
    }

    if (qtyOrder < currentTotalSupply) {
      showMessage(
        `Qty Order tidak boleh kurang dari Supply saat ini (${currentTotalSupply}).`,
        'error'
      )
      qtyOrderInput.focus()
      return
    }

    saveButton.disabled = true
    saveButton.textContent = 'Menyimpan...'

    try {

      await import('../../services/orderService.js').then(
        ({ updatePart }) =>
          updatePart(
            orderId,
            currentPartId,
            {
              pno,
              namaPart,
              noOrder,
              tglOrder,
              qtyOrder,
              eta,
              originalETA:
                currentOriginalETA
            }
          )
      )

      closeModal()

      if (typeof onSaved === 'function') {
        await onSaved()
      }

    }
    catch (error) {

      console.error(
        'GAGAL UPDATE PART:',
        error
      )

      showMessage(
        error.message ||
          'Gagal menyimpan perubahan part.',
        'error'
      )

    }
    finally {

      saveButton.disabled = false
      saveButton.textContent =
        'Simpan Perubahan'

    }

  }
}
