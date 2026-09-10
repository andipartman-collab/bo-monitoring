import {
  addSupply,
  getSupplyHistory
} from '../../services/orderService.js'


import {
  escapeHTML,
  formatDate,
  formatTimestamp
} from './WODetailUtils.js'


import {
  renderETAHistoryModal,
  initETAHistory
} from './WODetailETAHistory.js'



let currentOrderId = null


let currentOnSaved = null



export function renderWODetailParts(
  parts
) {

  if (!parts || !parts.length) {

    return `

      <section class="wo-detail-section">

        <div class="wo-detail-section-header">

          <h2>
            Part Order
          </h2>

        </div>


        <div class="wo-detail-empty">
          Belum ada part order.
        </div>

      </section>


      ${renderSupplyModal()}


      ${renderSupplyHistoryModal()}


      ${renderETAHistoryModal()}

    `

  }



  const rows =
    parts.map(
      (part, index) => {

        const qtyOrder =
          Number(
            part.qtyOrder || 0
          )


        const totalSupply =
          Number(
            part.totalSupply || 0
          )


        const sisa =
          Math.max(
            qtyOrder -
            totalSupply,
            0
          )



        const etaHTML =
          part.eta
            ? `

              <button
                type="button"
                class="wo-detail-eta-history-button"
                data-part-id="${escapeHTML(
                  part.id || ''
                )}"
                data-pno="${escapeHTML(
                  part.pno || ''
                )}"
                data-nama-part="${escapeHTML(
                  part.namaPart || ''
                )}"
              >
                ${escapeHTML(
                  formatDate(part.eta)
                )}
              </button>

            `
            : '-'




        return `

          <tr>

            <td>
              ${index + 1}
            </td>


            <td>
              ${escapeHTML(
                part.pno || ''
              )}
            </td>


            <td>
              ${escapeHTML(
                part.namaPart || ''
              )}
            </td>


            <td>
              ${escapeHTML(
                part.noOrder || ''
              )}
            </td>


            <td>
              ${
                part.tglOrder
                  ? escapeHTML(
                      formatDate(
                        part.tglOrder
                      )
                    )
                  : '-'
              }
            </td>


            <td class="text-center">
              ${qtyOrder}
            </td>


            <td class="text-center">
              ${totalSupply}
            </td>


            <td class="text-center">
              ${sisa}
            </td>


            <td>
              ${etaHTML}
            </td>


            <td>

              <div class="wo-detail-action-buttons">

                <button
                  type="button"
                  class="wo-detail-supply-button"
                  data-part-id="${escapeHTML(
                    part.id || ''
                  )}"
                  data-pno="${escapeHTML(
                    part.pno || ''
                  )}"
                  data-nama-part="${escapeHTML(
                    part.namaPart || ''
                  )}"
                  data-qty-order="${qtyOrder}"
                  data-total-supply="${totalSupply}"
                  data-sisa="${sisa}"
                >
                  + Supply
                </button>


                <button
                  type="button"
                  class="wo-detail-history-button"
                  data-part-id="${escapeHTML(
                    part.id || ''
                  )}"
                  data-pno="${escapeHTML(
                    part.pno || ''
                  )}"
                  data-nama-part="${escapeHTML(
                    part.namaPart || ''
                  )}"
                >
                  History
                </button>

              </div>

            </td>

          </tr>

        `

      }
    ).join('')



  return `

    <section class="wo-detail-section">

      <div class="wo-detail-section-header">

        <h2>
          Part Order
        </h2>

        <span>
          ${parts.length} Part
        </span>

      </div>


      <div class="wo-detail-table-wrapper">

        <table class="wo-detail-table">

          <thead>

            <tr>

              <th>
                No
              </th>

              <th>
                PNO
              </th>

              <th>
                Nama Part
              </th>

              <th>
                No Order
              </th>

              <th>
                Tgl Order
              </th>

              <th>
                Qty Order
              </th>

              <th>
                Supply
              </th>

              <th>
                Sisa
              </th>

              <th>
                ETA
              </th>

              <th>
                Aksi
              </th>

            </tr>

          </thead>


          <tbody>

            ${rows}

          </tbody>

        </table>

      </div>

    </section>


    ${renderSupplyModal()}


    ${renderSupplyHistoryModal()}


    ${renderETAHistoryModal()}

  `

}



function renderSupplyModal() {

  return `

    <div
      id="supply-modal"
      class="supply-modal"
    >

      <div
        class="supply-modal-overlay"
        id="supply-modal-overlay"
      ></div>


      <div class="supply-modal-content">

        <div class="supply-modal-header">

          <div>

            <h3>
              Input Supply
            </h3>

            <p>
              Catat penerimaan spare part
            </p>

          </div>


          <button
            type="button"
            id="supply-modal-close"
            class="supply-modal-close"
          >
            ×
          </button>

        </div>


        <div class="supply-modal-body">

          <div class="supply-part-info">

            <div>

              <span>
                PNO
              </span>

              <strong id="supply-pno">
                -
              </strong>

            </div>


            <div>

              <span>
                Nama Part
              </span>

              <strong id="supply-nama-part">
                -
              </strong>

            </div>


            <div>

              <span>
                Qty Order
              </span>

              <strong id="supply-qty-order">
                0
              </strong>

            </div>


            <div>

              <span>
                Supply Saat Ini
              </span>

              <strong id="supply-current">
                0
              </strong>

            </div>


            <div>

              <span>
                Sisa
              </span>

              <strong id="supply-sisa">
                0
              </strong>

            </div>

          </div>


          <div class="supply-form-group">

            <label for="supply-qty">
              Qty Supply
            </label>

            <input
              type="number"
              id="supply-qty"
              min="1"
              step="1"
              placeholder="Masukkan qty supply"
            />

          </div>


          <div class="supply-form-group">

            <label for="supply-ata">
              ATA
            </label>

            <input
              type="date"
              id="supply-ata"
            />

          </div>


          <div
            id="supply-form-error"
            class="supply-form-error"
          ></div>

        </div>


        <div class="supply-modal-footer">

          <button
            type="button"
            id="supply-cancel"
            class="supply-cancel-button"
          >
            Batal
          </button>


          <button
            type="button"
            id="supply-save"
            class="supply-save-button"
          >
            Simpan
          </button>

        </div>

      </div>

    </div>

  `

}



function renderSupplyHistoryModal() {

  return `

    <div
      id="supply-history-modal"
      class="supply-modal"
    >

      <div
        class="supply-modal-overlay"
        id="supply-history-overlay"
      ></div>


      <div class="supply-modal-content">

        <div class="supply-modal-header">

          <div>

            <h3>
              Supply History
            </h3>

            <p id="supply-history-part-title">
              -
            </p>

          </div>


          <button
            type="button"
            id="supply-history-close"
            class="supply-modal-close"
          >
            ×
          </button>

        </div>


        <div
          class="supply-modal-body"
          id="supply-history-body"
        ></div>


        <div class="supply-modal-footer">

          <button
            type="button"
            id="supply-history-footer-close"
            class="supply-cancel-button"
          >
            Tutup
          </button>

        </div>

      </div>

    </div>

  `

}



export function initWODetailSupply(
  orderId,
  onSaved
) {

  currentOrderId =
    orderId


  currentOnSaved =
    onSaved



  initSupplyButtons()


  initSupplyModalButtons()


  initSupplyHistoryButtons()


  initHistoryModalButtons()


  initETAHistory(
    orderId
  )

}



function initSupplyButtons() {

  const buttons =
    document.querySelectorAll(
      '.wo-detail-supply-button'
    )


  buttons.forEach(
    button => {

      button.addEventListener(
        'click',
        () => {

          openSupplyModal(
            button
          )

        }
      )

    }
  )

}



function openSupplyModal(
  button
) {

  const modal =
    document.getElementById(
      'supply-modal'
    )


  if (!modal) {

    return

  }



  const partId =
    button.dataset.partId || ''


  const pno =
    button.dataset.pno || ''


  const namaPart =
    button.dataset.namaPart || ''


  const qtyOrder =
    Number(
      button.dataset.qtyOrder || 0
    )


  const totalSupply =
    Number(
      button.dataset.totalSupply || 0
    )


  const sisa =
    Number(
      button.dataset.sisa || 0
    )



  modal.dataset.partId =
    partId



  const pnoElement =
    document.getElementById(
      'supply-pno'
    )


  const namaElement =
    document.getElementById(
      'supply-nama-part'
    )


  const qtyOrderElement =
    document.getElementById(
      'supply-qty-order'
    )


  const currentElement =
    document.getElementById(
      'supply-current'
    )


  const sisaElement =
    document.getElementById(
      'supply-sisa'
    )


  const qtyInput =
    document.getElementById(
      'supply-qty'
    )


  const ataInput =
    document.getElementById(
      'supply-ata'
    )


  const errorElement =
    document.getElementById(
      'supply-form-error'
    )



  if (pnoElement) {

    pnoElement.textContent =
      pno || '-'

  }


  if (namaElement) {

    namaElement.textContent =
      namaPart || '-'

  }


  if (qtyOrderElement) {

    qtyOrderElement.textContent =
      qtyOrder

  }


  if (currentElement) {

    currentElement.textContent =
      totalSupply

  }


  if (sisaElement) {

    sisaElement.textContent =
      sisa

  }


  if (qtyInput) {

    qtyInput.value = ''

    qtyInput.max =
      sisa

  }


  if (ataInput) {

    ataInput.value =
      getTodayDate()

  }


  if (errorElement) {

    errorElement.textContent =
      ''

    errorElement.classList.remove(
      'show'
    )

  }



  modal.classList.add(
    'show'
  )

}



function initSupplyModalButtons() {

  const closeButton =
    document.getElementById(
      'supply-modal-close'
    )


  const cancelButton =
    document.getElementById(
      'supply-cancel'
    )


  const saveButton =
    document.getElementById(
      'supply-save'
    )


  const overlay =
    document.getElementById(
      'supply-modal-overlay'
    )



  if (closeButton) {

    closeButton.addEventListener(
      'click',
      closeSupplyModal
    )

  }


  if (cancelButton) {

    cancelButton.addEventListener(
      'click',
      closeSupplyModal
    )

  }


  if (overlay) {

    overlay.addEventListener(
      'click',
      closeSupplyModal
    )

  }


  if (saveButton) {

    saveButton.addEventListener(
      'click',
      handleSupplySave
    )

  }

}



async function handleSupplySave() {

  const modal =
    document.getElementById(
      'supply-modal'
    )


  const qtyInput =
    document.getElementById(
      'supply-qty'
    )


  const ataInput =
    document.getElementById(
      'supply-ata'
    )


  const errorElement =
    document.getElementById(
      'supply-form-error'
    )


  const saveButton =
    document.getElementById(
      'supply-save'
    )



  if (!modal) {

    return

  }



  const partId =
    modal.dataset.partId



  const qty =
    Number(
      qtyInput?.value || 0
    )


  const ata =
    ataInput?.value || ''



  if (
    !Number.isInteger(qty) ||
    qty <= 0
  ) {

    showSupplyError(
      'Qty Supply harus berupa angka bulat lebih dari 0.'
    )

    return

  }



  if (!ata) {

    showSupplyError(
      'ATA wajib diisi.'
    )

    return

  }



  try {

    if (saveButton) {

      saveButton.disabled =
        true

      saveButton.textContent =
        'Menyimpan...'

    }



    await addSupply(
      currentOrderId,
      partId,
      qty,
      ata
    )



    closeSupplyModal()



    if (
      typeof currentOnSaved ===
      'function'
    ) {

      await currentOnSaved()

    }

  }
  catch (error) {

    console.error(
      'GAGAL SIMPAN SUPPLY:',
      error
    )


    if (errorElement) {

      errorElement.textContent =
        error.message ||
        'Gagal menyimpan supply.'

      errorElement.classList.add(
        'show'
      )

    }

  }
  finally {

    if (saveButton) {

      saveButton.disabled =
        false

      saveButton.textContent =
        'Simpan'

    }

  }

}



function closeSupplyModal() {

  const modal =
    document.getElementById(
      'supply-modal'
    )


  if (!modal) {

    return

  }


  modal.classList.remove(
    'show'
  )

}



function showSupplyError(
  message
) {

  const errorElement =
    document.getElementById(
      'supply-form-error'
    )


  if (!errorElement) {

    return

  }


  errorElement.textContent =
    message


  errorElement.classList.add(
    'show'
  )

}



function initSupplyHistoryButtons() {

  const buttons =
    document.querySelectorAll(
      '.wo-detail-history-button'
    )


  buttons.forEach(
    button => {

      button.addEventListener(
        'click',
        () => {

          openSupplyHistory(
            button.dataset.partId,
            button.dataset.pno,
            button.dataset.namaPart
          )

        }
      )

    }
  )

}



async function openSupplyHistory(
  partId,
  pno,
  namaPart
) {

  const modal =
    document.getElementById(
      'supply-history-modal'
    )


  const body =
    document.getElementById(
      'supply-history-body'
    )


  const title =
    document.getElementById(
      'supply-history-part-title'
    )



  if (!modal || !body) {

    return

  }



  if (title) {

    title.textContent =
      `${pno || ''} - ${namaPart || ''}`

  }



  modal.classList.add(
    'show'
  )



  body.innerHTML = `

    <div class="wo-detail-loading">

      Memuat Supply History...

    </div>

  `



  try {

    const history =
      await getSupplyHistory(
        currentOrderId,
        partId
      )


    renderSupplyHistoryTable(
      history
    )

  }
  catch (error) {

    console.error(
      'GAGAL MEMUAT SUPPLY HISTORY:',
      error
    )


    body.innerHTML = `

      <div class="supply-form-error show">

        ${escapeHTML(
          error.message ||
          'Gagal memuat Supply History.'
        )}

      </div>

    `

  }

}



function renderSupplyHistoryTable(
  history
) {

  const body =
    document.getElementById(
      'supply-history-body'
    )


  if (!body) {

    return

  }



  if (!history.length) {

    body.innerHTML = `

      <div class="supply-history-empty">

        Belum ada history supply.

      </div>

    `

    return

  }



  let totalSupply = 0



  const rows =
    history.map(
      (item, index) => {

        const qty =
          Number(
            item.qtySupply || 0
          )


        totalSupply +=
          qty



        return `

          <tr>

            <td>
              ${index + 1}
            </td>


            <td>
              ${
                item.ata
                  ? escapeHTML(
                      formatDate(
                        item.ata
                      )
                    )
                  : '-'
              }
            </td>


            <td>
              ${qty}
            </td>


            <td>
              ${
                item.createdAt
                  ? escapeHTML(
                      formatTimestamp(
                        item.createdAt
                      )
                    )
                  : '-'
              }
            </td>

          </tr>

        `

      }
    ).join('')



  body.innerHTML = `

    <div class="supply-history-summary">

      <div>

        <span>
          Total Transaksi
        </span>

        <strong>
          ${history.length}
        </strong>

      </div>


      <div>

        <span>
          Total Supply
        </span>

        <strong>
          ${totalSupply}
        </strong>

      </div>

    </div>


    <div class="supply-history-table-wrapper">

      <table class="wo-detail-table">

        <thead>

          <tr>

            <th>
              No
            </th>

            <th>
              ATA
            </th>

            <th>
              Qty Supply
            </th>

            <th>
              Dicatat
            </th>

          </tr>

        </thead>


        <tbody>

          ${rows}

        </tbody>

      </table>

    </div>

  `

}



function initHistoryModalButtons() {

  const closeButton =
    document.getElementById(
      'supply-history-close'
    )


  const footerButton =
    document.getElementById(
      'supply-history-footer-close'
    )


  const overlay =
    document.getElementById(
      'supply-history-overlay'
    )



  if (closeButton) {

    closeButton.addEventListener(
      'click',
      closeSupplyHistory
    )

  }


  if (footerButton) {

    footerButton.addEventListener(
      'click',
      closeSupplyHistory
    )

  }


  if (overlay) {

    overlay.addEventListener(
      'click',
      closeSupplyHistory
    )

  }

}



function closeSupplyHistory() {

  const modal =
    document.getElementById(
      'supply-history-modal'
    )


  if (!modal) {

    return

  }


  modal.classList.remove(
    'show'
  )

}



function getTodayDate() {

  const today =
    new Date()


  const year =
    today.getFullYear()


  const month =
    String(
      today.getMonth() + 1
    ).padStart(
      2,
      '0'
    )


  const day =
    String(
      today.getDate()
    ).padStart(
      2,
      '0'
    )


  return `${year}-${month}-${day}`

}