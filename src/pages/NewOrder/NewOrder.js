import { renderNewOrderForm } from './NewOrderForm.js'

import {
  renderNewOrderParts,
  initNewOrderParts
} from './NewOrderParts.js'

import {
  initUppercaseInputs
} from './NewOrderUtils.js'

import {
  validateNewOrder
} from './NewOrderValidation.js'

import {
  getNewOrderData
} from './NewOrderData.js'

import {
  createNewOrder
} from '../../services/orderService.js'


export function renderNewOrder() {

  return `
    <div class="new-order-page">

      <form id="new-order-form">

        ${renderNewOrderForm()}

        ${renderNewOrderParts()}

        <div class="new-order-actions">

          <button
            type="button"
            id="cancel-new-order"
            class="btn btn-secondary"
          >
            Batal
          </button>

          <button
            type="submit"
            id="save-new-order"
            class="btn btn-success"
          >
            Simpan Order
          </button>

        </div>

        <!--
          Notifikasi ditempatkan di bawah tombol
          agar hasil simpan langsung terlihat.
        -->

        <div
          id="new-order-message"
          class="new-order-message"
        ></div>

      </form>

    </div>
  `
}


export function initNewOrder() {

  initUppercaseInputs()

  initNewOrderParts()

  initNewOrderForm()

}


function initNewOrderForm() {

  const form =
    document.getElementById(
      'new-order-form'
    )

  if (!form) {
    return
  }


  form.addEventListener(
    'submit',
    handleSubmit
  )


  const cancelButton =
    document.getElementById(
      'cancel-new-order'
    )

  if (cancelButton) {

    cancelButton.addEventListener(
      'click',
      handleCancel
    )

  }

}


async function handleSubmit(event) {

  event.preventDefault()

  clearValidation()


  const result =
    validateNewOrder()


  if (!result.valid) {

    showValidationErrors(
      result.errors
    )

    return

  }


  const orderData =
    getNewOrderData()


  /*
    ========================================
    SIMPAN KE FIRESTORE
    ========================================
  */

  const saveButton =
    document.getElementById(
      'save-new-order'
    )


  if (saveButton) {

    saveButton.disabled = true

    saveButton.textContent =
      'Menyimpan...'

  }


  try {

    const result =
      await createNewOrder(
        orderData
      )


    console.log(
      'NEW ORDER BERHASIL DISIMPAN:',
      result
    )


    showSuccessMessage(
      `Order ${result.noWo} berhasil disimpan.`
    )


  }
  catch (error) {

    console.error(
      'GAGAL MENYIMPAN NEW ORDER:',
      error
    )


    showErrorMessage(
      error.message ||
      'Terjadi kesalahan saat menyimpan order.'
    )


  }
  finally {

    if (saveButton) {

      saveButton.disabled = false

      saveButton.textContent =
        'Simpan Order'

    }

  }

}


function handleCancel() {

  const form =
    document.getElementById(
      'new-order-form'
    )

  if (!form) {
    return
  }


  const confirmed =
    window.confirm(
      'Batalkan pengisian New Order? Data yang sudah diisi akan dihapus.'
    )

  if (!confirmed) {
    return
  }


  form.reset()


  const tbody =
    document.getElementById(
      'parts-table-body'
    )

  if (tbody) {

    tbody.innerHTML = `
      <tr id="empty-parts-row">

        <td
          colspan="8"
          class="empty-parts"
        >
          Belum ada part.
          Silakan klik
          <strong>+ Tambah Part</strong>.
        </td>

      </tr>
    `

  }


  clearValidation()


  const message =
    document.getElementById(
      'new-order-message'
    )

  if (message) {

    message.textContent = ''

  }

}


/*
  ========================================
  VALIDATION ERROR
  ========================================
*/

function showValidationErrors(errors) {

  const message =
    document.getElementById(
      'new-order-message'
    )

  if (message) {

    message.className =
      'new-order-message error'

    message.innerHTML = `
      <strong>
        Data belum lengkap.
      </strong>

      <ul>
        ${errors
          .map(
            error => `
              <li>
                ${escapeHTML(
                  error.message
                )}
              </li>
            `
          )
          .join('')
        }
      </ul>
    `

  }


  /*
    Tandai field yang bermasalah
  */

  errors.forEach(
    error => {

      if (
        error.field === 'parts'
      ) {
        return
      }


      if (error.row) {

        const input =
          error.row.querySelector(
            `.${error.field}`
          )

        if (input) {

          input.classList.add(
            'validation-error'
          )

        }

      }
      else {

        const input =
          document.getElementById(
            error.field
          )

        if (input) {

          input.classList.add(
            'validation-error'
          )

        }

      }

    }
  )


  /*
    Fokus ke error pertama
  */

  const firstError =
    errors.find(
      error =>
        error.field !== 'parts'
    )


  if (firstError) {

    let input = null


    if (firstError.row) {

      input =
        firstError.row.querySelector(
          `.${firstError.field}`
        )

    }
    else {

      input =
        document.getElementById(
          firstError.field
        )

    }


    if (input) {

      input.focus()

      input.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })

    }

  }
  else {

    /*
      Kalau error hanya:
      "Minimal tambahkan 1 part",
      arahkan layar ke bagian Part Order.
    */

    const partsSection =
      document.querySelector(
        '.new-order-section:nth-of-type(2)'
      )

    if (partsSection) {

      partsSection.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })

    }

  }

}


/*
  ========================================
  CLEAR VALIDATION
  ========================================
*/

function clearValidation() {

  const invalidFields =
    document.querySelectorAll(
      '.validation-error'
    )


  invalidFields.forEach(
    field => {

      field.classList.remove(
        'validation-error'
      )

    }
  )


  const message =
    document.getElementById(
      'new-order-message'
    )


  if (message) {

    message.className =
      'new-order-message'

    message.innerHTML = ''

  }

}


/*
  ========================================
  SUCCESS MESSAGE
  ========================================
*/

function showSuccessMessage(messageText) {

  const message =
    document.getElementById(
      'new-order-message'
    )


  if (!message) {
    return
  }


  message.className =
    'new-order-message success'


  message.innerHTML = `
    <strong>
      ✓ ${escapeHTML(messageText)}
    </strong>
  `


  /*
    Scroll ke notifikasi
    agar user langsung melihat hasil.
  */

  scrollToMessage()

}


/*
  ========================================
  ERROR MESSAGE
  ========================================
*/

function showErrorMessage(messageText) {

  const message =
    document.getElementById(
      'new-order-message'
    )


  if (!message) {
    return
  }


  message.className =
    'new-order-message error'


  message.innerHTML = `
    <strong>
      ✕ ${escapeHTML(messageText)}
    </strong>
  `


  /*
    Scroll ke notifikasi
    agar error langsung terlihat.
  */

  scrollToMessage()

}


/*
  ========================================
  SCROLL KE NOTIFIKASI
  ========================================
*/

function scrollToMessage() {

  const message =
    document.getElementById(
      'new-order-message'
    )


  if (!message) {
    return
  }


  setTimeout(
    () => {

      message.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })

    },
    50
  )

}


/*
  ========================================
  ESCAPE HTML
  ========================================
*/

function escapeHTML(value) {

  return String(value)
    .replaceAll(
      '&',
      '&amp;'
    )
    .replaceAll(
      '<',
      '&lt;'
    )
    .replaceAll(
      '>',
      '&gt;'
    )
    .replaceAll(
      '"',
      '&quot;'
    )
    .replaceAll(
      "'",
      '&#039;'
    )

}