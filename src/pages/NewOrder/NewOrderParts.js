import { getTodayDate } from './NewOrderUtils.js'


let partCounter = 0


export function renderNewOrderParts() {

  return `
    <section class="new-order-section">

      <div class="new-order-section-header">

        <div>

          <span class="new-order-section-number">
            02
          </span>

          <div>

            <h2>Part Order</h2>

            <p>
              Tambahkan part yang akan dipesan
            </p>

          </div>

        </div>


        <button
          type="button"
          id="add-part-button"
          class="btn btn-primary"
        >
          + Tambah Part
        </button>

      </div>


      <div class="parts-table-wrapper">

        <table class="parts-table">

          <thead>

            <tr>
              <th>No</th>
              <th>PNO</th>
              <th>Nama Part</th>
              <th>No Order</th>
              <th>Tgl Order</th>
              <th>Qty</th>
              <th>ETA</th>
              <th>Aksi</th>
            </tr>

          </thead>


          <tbody id="parts-table-body">

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

          </tbody>

        </table>

      </div>

    </section>
  `
}


export function initNewOrderParts() {

  const addButton =
    document.getElementById(
      'add-part-button'
    )


  if (!addButton) {
    return
  }


  addButton.addEventListener(
    'click',
    addPartRow
  )

}


function addPartRow() {

  const tbody =
    document.getElementById(
      'parts-table-body'
    )


  if (!tbody) {
    return
  }


  const emptyRow =
    document.getElementById(
      'empty-parts-row'
    )


  if (emptyRow) {
    emptyRow.remove()
  }


  partCounter++


  const previousRow =
    tbody.querySelector(
      '.part-row:last-child'
    )


  let previousNoOrder = ''


  if (previousRow) {

    const previousInput =
      previousRow.querySelector(
        '.part-no-order'
      )


    if (previousInput) {

      previousNoOrder =
        previousInput.value

    }

  }


  const today =
    getTodayDate()


  const row =
    document.createElement('tr')


  row.className =
    'part-row'


  row.dataset.partId =
    `PART-${partCounter}`


  row.innerHTML = `

    <td class="part-number">
      ${partCounter}
    </td>


    <td>

      <input
        type="text"
        class="part-input part-pno"
        placeholder="PNO"
        autocomplete="off"
        maxlength="30"
      />

    </td>


    <td>

      <input
        type="text"
        class="part-input part-name"
        placeholder="Nama Part"
        autocomplete="off"
      />

    </td>


    <td>

      <input
        type="text"
        class="part-input part-no-order"
        placeholder="No Order"
        autocomplete="off"
        value="${previousNoOrder}"
      />

    </td>


    <td>

      <input
        type="date"
        class="part-input part-tgl-order"
        value="${today}"
      />

    </td>


    <td>

      <input
        type="number"
        class="part-input part-qty"
        min="1"
        step="1"
        placeholder="Qty"
      />

    </td>


    <td>

      <input
        type="date"
        class="part-input part-eta"
      />

    </td>


    <td>

      <button
        type="button"
        class="delete-part-button"
        title="Hapus Part"
      >
        ×
      </button>

    </td>

  `


  tbody.appendChild(row)


  initPartInputs(row)


  const deleteButton =
    row.querySelector(
      '.delete-part-button'
    )


  deleteButton.addEventListener(
    'click',
    () => {

      row.remove()

      renumberParts()

      showEmptyRowIfNeeded()

    }
  )


  const firstInput =
    row.querySelector(
      '.part-pno'
    )


  if (firstInput) {
    firstInput.focus()
  }

}


function initPartInputs(row) {

  const uppercaseFields =
    row.querySelectorAll(
      '.part-name, .part-no-order'
    )


  uppercaseFields.forEach(
    input => {

      input.addEventListener(
        'input',
        () => {

          const start =
            input.selectionStart

          const end =
            input.selectionEnd


          input.value =
            input.value.toUpperCase()


          input.setSelectionRange(
            start,
            end
          )

        }
      )

    }
  )


  const pnoInput =
    row.querySelector(
      '.part-pno'
    )


  if (pnoInput) {

    pnoInput.addEventListener(
      'input',
      () => {

        const start =
          pnoInput.selectionStart

        const end =
          pnoInput.selectionEnd


        const oldValue =
          pnoInput.value


        const cleanValue =
          oldValue
            .replace(
              /[^a-zA-Z0-9]/g,
              ''
            )
            .toUpperCase()


        pnoInput.value =
          cleanValue


        const removedCharacters =
          oldValue.length -
          cleanValue.length


        const newPosition =
          Math.max(
            0,
            start - removedCharacters
          )


        pnoInput.setSelectionRange(
          newPosition,
          newPosition
        )

      }
    )

  }

}


function renumberParts() {

  const rows =
    document.querySelectorAll(
      '#parts-table-body .part-row'
    )


  rows.forEach(
    (row, index) => {

      const numberCell =
        row.querySelector(
          '.part-number'
        )


      if (numberCell) {

        numberCell.textContent =
          index + 1

      }

    }
  )


  partCounter =
    rows.length

}


function showEmptyRowIfNeeded() {

  const tbody =
    document.getElementById(
      'parts-table-body'
    )


  if (!tbody) {
    return
  }


  const rows =
    tbody.querySelectorAll(
      '.part-row'
    )


  if (rows.length > 0) {
    return
  }


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