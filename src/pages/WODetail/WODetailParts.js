import {
  addSupply
} from '../../services/orderService.js'


import {
  escapeHTML,
  formatDate
} from './WODetailUtils.js'


/*
  ==================================================
  STATE
  ==================================================
*/

let currentOrderId = null

let currentOnSaved = null


/*
  ==================================================
  RENDER PART ORDER
  ==================================================
*/

export function renderWODetailParts(
  parts
) {

  if (
    !Array.isArray(parts) ||
    parts.length === 0
  ) {

    return `

      <section class="wo-detail-card">

        <div class="wo-detail-card-header">

          <div>

            <h2>Part Order</h2>

            <p>
              Daftar part yang dipesan
              beserta progress supply.
            </p>

          </div>

        </div>


        <div class="wo-detail-empty">

          Belum ada part pada Work Order ini.

        </div>

      </section>

    `

  }


  return `

    <section class="wo-detail-card">

      <div class="wo-detail-card-header">

        <div>

          <h2>Part Order</h2>

          <p>
            Daftar part yang dipesan
            beserta progress supply.
          </p>

        </div>

      </div>


      <div class="wo-detail-table-wrapper">

        <table class="wo-detail-table">

          <thead>

            <tr>

              <th>No</th>

              <th>PNO</th>

              <th>Nama Part</th>

              <th>No Order</th>

              <th>Tgl Order</th>

              <th>Qty Order</th>

              <th>Supply</th>

              <th>Sisa</th>

              <th>ETA</th>

              <th>Aksi</th>

            </tr>

          </thead>


          <tbody>

            ${parts
              .map(
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
                      Number(
                        part.sisa ??
                        (
                          qtyOrder -
                          totalSupply
                        )
                      ),
                      0
                    )


                  const supplyDisabled =
                    sisa <= 0


                  return `

                    <tr>

                      <td>
                        ${index + 1}
                      </td>


                      <td>

                        <strong>
                          ${escapeHTML(
                            part.pno || '-'
                          )}
                        </strong>

                      </td>


                      <td>
                        ${escapeHTML(
                          part.namaPart || '-'
                        )}
                      </td>


                      <td>
                        ${escapeHTML(
                          part.noOrder || '-'
                        )}
                      </td>


                      <td>
                        ${formatDate(
                          part.tglOrder
                        )}
                      </td>


                      <td class="wo-detail-qty">

                        ${qtyOrder}

                      </td>


                      <td class="wo-detail-supply">

                        ${totalSupply}

                      </td>


                      <td class="wo-detail-sisa">

                        ${sisa}

                      </td>


                      <td>
                        ${formatDate(
                          part.eta
                        )}
                      </td>


                      <td>

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
                          ${supplyDisabled
                            ? 'disabled'
                            : ''
                          }
                        >
                          + Supply
                        </button>

                      </td>

                    </tr>

                  `

                }
              )
              .join('')
            }

          </tbody>

        </table>

      </div>

    </section>


    <!--
      ==================================================
      SUPPLY MODAL
      ==================================================
    -->

    <div
      id="supply-modal"
      class="supply-modal"
    >

      <div
        id="supply-modal-overlay"
        class="supply-modal-overlay"
      ></div>


      <div class="supply-modal-content">

        <div class="supply-modal-header">

          <div>

            <h3>
              Tambah Supply
            </h3>

            <p>
              Catat kedatangan part.
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

              <strong
                id="supply-modal-pno"
              >
                -
              </strong>

            </div>


            <div>

              <span>
                Nama Part
              </span>

              <strong
                id="supply-modal-nama"
              >
                -
              </strong>

            </div>


            <div>

              <span>
                Qty Order
              </span>

              <strong
                id="supply-modal-qty-order"
              >
                0
              </strong>

            </div>


            <div>

              <span>
                Supply Saat Ini
              </span>

              <strong
                id="supply-modal-total-supply"
              >
                0
              </strong>

            </div>


            <div>

              <span>
                Sisa
              </span>

              <strong
                id="supply-modal-sisa"
              >
                0
              </strong>

            </div>

          </div>


          <div class="supply-form-group">

            <label
              for="supply-qty"
            >
              Qty Supply
            </label>

            <input
              type="number"
              id="supply-qty"
              min="1"
              step="1"
              placeholder="Masukkan jumlah supply"
            >

            <small
              id="supply-qty-help"
            >
              Maksimal sesuai jumlah sisa.
            </small>

          </div>


          <div class="supply-form-group">

            <label
              for="supply-ata"
            >
              ATA
            </label>

            <input
              type="date"
              id="supply-ata"
            >

            <small>
              Tanggal aktual part diterima.
            </small>

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


/*
  ==================================================
  INIT SUPPLY
  ==================================================
*/

export function initWODetailSupply(
  orderId,
  onSaved
) {

  currentOrderId =
    orderId


  currentOnSaved =
    onSaved


  /*
    ==========================================
    SUPPLY BUTTON
    ==========================================
  */

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


  /*
    ==========================================
    MODAL BUTTON
    ==========================================
  */

  initSupplyModalButtons()

}


/*
  ==================================================
  OPEN SUPPLY MODAL
  ==================================================
*/

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


  /*
    ==========================================
    AMBIL DATA PART
    ==========================================
  */

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


  /*
    ==========================================
    SIMPAN PART ID DI MODAL
    ==========================================
  */

  modal.dataset.partId =
    partId


  /*
    ==========================================
    ELEMENT MODAL
    ==========================================
  */

  const pnoElement =
    document.getElementById(
      'supply-modal-pno'
    )


  const namaElement =
    document.getElementById(
      'supply-modal-nama'
    )


  const qtyOrderElement =
    document.getElementById(
      'supply-modal-qty-order'
    )


  const totalSupplyElement =
    document.getElementById(
      'supply-modal-total-supply'
    )


  const sisaElement =
    document.getElementById(
      'supply-modal-sisa'
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


  /*
    ==========================================
    ISI INFORMASI PART
    ==========================================
  */

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


  if (totalSupplyElement) {

    totalSupplyElement.textContent =
      totalSupply

  }


  if (sisaElement) {

    sisaElement.textContent =
      sisa

  }


  /*
    ==========================================
    RESET QTY
    ==========================================
  */

  if (qtyInput) {

    qtyInput.value =
      ''

    qtyInput.max =
      String(sisa)

  }


  /*
    ==========================================
    DEFAULT ATA = HARI INI
    ==========================================
  */

  if (ataInput) {

    ataInput.value =
      getTodayDate()

  }


  /*
    ==========================================
    RESET ERROR
    ==========================================
  */

  if (errorElement) {

    errorElement.textContent =
      ''

    errorElement.className =
      'supply-form-error'

  }


  /*
    ==========================================
    TAMPILKAN MODAL
    ==========================================
  */

  modal.classList.add(
    'show'
  )


  /*
    ==========================================
    FOCUS QTY
    ==========================================
  */

  if (qtyInput) {

    setTimeout(
      () => {

        qtyInput.focus()

      },
      50
    )

  }

}


/*
  ==================================================
  CLOSE SUPPLY MODAL
  ==================================================
*/

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


/*
  ==================================================
  INIT MODAL BUTTONS
  ==================================================
*/

function initSupplyModalButtons() {

  const closeButton =
    document.getElementById(
      'supply-modal-close'
    )


  const cancelButton =
    document.getElementById(
      'supply-cancel'
    )


  const overlay =
    document.getElementById(
      'supply-modal-overlay'
    )


  const saveButton =
    document.getElementById(
      'supply-save'
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


/*
  ==================================================
  HANDLE SUPPLY SAVE
  ==================================================
*/

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


  const saveButton =
    document.getElementById(
      'supply-save'
    )


  /*
    ==========================================
    AMBIL DATA
    ==========================================
  */

  const partId =
    modal?.dataset.partId || ''


  const qty =
    Number(
      qtyInput?.value || 0
    )


  const maxQty =
    Number(
      qtyInput?.max || 0
    )


  const ata =
    ataInput?.value || ''


  /*
    ==========================================
    VALIDASI PART ID
    ==========================================
  */

  if (!partId) {

    showSupplyError(
      'Part ID tidak tersedia.'
    )

    return

  }


  /*
    ==========================================
    VALIDASI ORDER ID
    ==========================================
  */

  if (!currentOrderId) {

    showSupplyError(
      'Order ID tidak tersedia.'
    )

    return

  }


  /*
    ==========================================
    VALIDASI QTY
    ==========================================
  */

  if (
    !Number.isInteger(qty) ||
    qty <= 0
  ) {

    showSupplyError(
      'Qty Supply harus berupa angka bulat lebih dari 0.'
    )

    return

  }


  /*
    ==========================================
    VALIDASI MAKSIMAL
    ==========================================
  */

  if (
    maxQty <= 0
  ) {

    showSupplyError(
      'Part ini sudah tidak memiliki sisa supply.'
    )

    return

  }


  if (
    qty > maxQty
  ) {

    showSupplyError(
      `Qty Supply tidak boleh lebih dari sisa ${maxQty}.`
    )

    return

  }


  /*
    ==========================================
    VALIDASI ATA
    ==========================================
  */

  if (!ata) {

    showSupplyError(
      'ATA wajib diisi.'
    )

    return

  }


  /*
    ==========================================
    BUTTON LOADING
    ==========================================
  */

  if (saveButton) {

    saveButton.disabled =
      true

    saveButton.textContent =
      'Menyimpan...'

  }


  try {

    /*
      ========================================
      SIMPAN KE FIRESTORE
      ========================================
    */

    const result =
      await addSupply(
        currentOrderId,
        partId,
        qty,
        ata
      )


    console.log(
      'SUPPLY BERHASIL DISIMPAN:',
      result
    )


    /*
      ========================================
      TUTUP MODAL
      ========================================
    */

    closeSupplyModal()


    /*
      ========================================
      REFRESH DATA
      ========================================
    */

    if (
      typeof currentOnSaved ===
      'function'
    ) {

      await currentOnSaved()

    }

  }
  catch (error) {

    console.error(
      'GAGAL MENYIMPAN SUPPLY:',
      error
    )


    showSupplyError(
      error.message ||
      'Gagal menyimpan supply.'
    )

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


/*
  ==================================================
  SHOW SUPPLY ERROR
  ==================================================
*/

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


  errorElement.className =
    'supply-form-error show'

  errorElement.textContent =
    message

}


/*
  ==================================================
  GET TODAY DATE
  ==================================================
*/

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


  return (
    `${year}-${month}-${day}`
  )

}