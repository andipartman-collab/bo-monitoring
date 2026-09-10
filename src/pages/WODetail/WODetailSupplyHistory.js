import {
  getSupplyHistory
} from '../../services/orderService.js'


import {
  escapeHTML,
  formatDate,
  formatTimestamp
} from './WODetailUtils.js'


/*
  ==================================================
  STATE
  ==================================================
*/

let currentOrderId = null

let currentPartId = null


/*
  ==================================================
  RENDER SUPPLY HISTORY MODAL
  ==================================================
*/

export function renderSupplyHistoryModal() {

  return `

    <div
      id="supply-history-modal"
      class="supply-history-modal"
    >

      <div
        id="supply-history-overlay"
        class="supply-history-overlay"
      ></div>


      <div class="supply-history-content">

        <div class="supply-history-header">

          <div>

            <h3>
              Supply History
            </h3>

            <p
              id="supply-history-subtitle"
            >
              Riwayat kedatangan part.
            </p>

          </div>


          <button
            type="button"
            id="supply-history-close"
            class="supply-history-close"
          >
            ×
          </button>

        </div>


        <div class="supply-history-body">

          <div
            id="supply-history-loading"
            class="supply-history-loading"
          >
            Memuat history...
          </div>


          <div
            id="supply-history-error"
            class="supply-history-error"
          ></div>


          <div
            id="supply-history-table-container"
          ></div>

        </div>


        <div class="supply-history-footer">

          <button
            type="button"
            id="supply-history-close-button"
            class="supply-history-close-button"
          >
            Tutup
          </button>

        </div>

      </div>

    </div>

  `

}


/*
  ==================================================
  INIT SUPPLY HISTORY
  ==================================================
*/

export function initSupplyHistory(
  orderId
) {

  currentOrderId =
    orderId


  /*
    ==========================================
    HISTORY BUTTON
    ==========================================
  */

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
            button
          )

        }
      )

    }
  )


  /*
    ==========================================
    MODAL BUTTONS
    ==========================================
  */

  initHistoryModalButtons()

}


/*
  ==================================================
  OPEN HISTORY
  ==================================================
*/

async function openSupplyHistory(
  button
) {

  const modal =
    document.getElementById(
      'supply-history-modal'
    )


  if (!modal) {

    return

  }


  currentPartId =
    button.dataset.partId || ''


  const pno =
    button.dataset.pno || ''


  const namaPart =
    button.dataset.namaPart || ''


  const subtitle =
    document.getElementById(
      'supply-history-subtitle'
    )


  if (subtitle) {

    subtitle.textContent =
      `${pno} - ${namaPart}`

  }


  const loading =
    document.getElementById(
      'supply-history-loading'
    )


  const error =
    document.getElementById(
      'supply-history-error'
    )


  const container =
    document.getElementById(
      'supply-history-table-container'
    )


  if (loading) {

    loading.style.display =
      'block'

  }


  if (error) {

    error.style.display =
      'none'

    error.textContent =
      ''

  }


  if (container) {

    container.innerHTML =
      ''

  }


  modal.classList.add(
    'show'
  )


  if (
    !currentOrderId ||
    !currentPartId
  ) {

    showHistoryError(
      'Data part tidak tersedia.'
    )

    return

  }


  try {

    const history =
      await getSupplyHistory(
        currentOrderId,
        currentPartId
      )


    renderHistoryTable(
      history
    )

  }
  catch (error) {

    console.error(
      'GAGAL MEMUAT SUPPLY HISTORY:',
      error
    )


    showHistoryError(
      error.message ||
      'Gagal memuat supply history.'
    )

  }
  finally {

    if (loading) {

      loading.style.display =
        'none'

    }

  }

}


/*
  ==================================================
  RENDER HISTORY TABLE
  ==================================================
*/

function renderHistoryTable(
  history
) {

  const container =
    document.getElementById(
      'supply-history-table-container'
    )


  if (!container) {

    return

  }


  if (
    !Array.isArray(history) ||
    history.length === 0
  ) {

    container.innerHTML = `

      <div class="supply-history-empty">

        Belum ada riwayat supply.

      </div>

    `

    return

  }


  const totalSupply =
    history.reduce(
      (
        total,
        item
      ) => {

        return (
          total +
          Number(
            item.qtySupply || 0
          )
        )

      },
      0
    )


  container.innerHTML = `

    <div class="supply-history-summary">

      <div>

        <span>Total Transaksi</span>

        <strong>
          ${history.length}
        </strong>

      </div>


      <div>

        <span>Total Supply</span>

        <strong>
          ${totalSupply}
        </strong>

      </div>

    </div>


    <div class="supply-history-table-wrapper">

      <table class="supply-history-table">

        <thead>

          <tr>

            <th>No</th>

            <th>ATA</th>

            <th>Qty Supply</th>

            <th>Dicatat</th>

          </tr>

        </thead>


        <tbody>

          ${history
            .map(
              (
                item,
                index
              ) => `

                <tr>

                  <td>
                    ${index + 1}
                  </td>


                  <td>
                    ${formatDate(
                      item.ata
                    )}
                  </td>


                  <td>

                    <strong>
                      ${Number(
                        item.qtySupply || 0
                      )}
                    </strong>

                  </td>


                  <td>
                    ${formatTimestamp(
                      item.createdAt
                    )}
                  </td>

                </tr>

              `
            )
            .join('')
          }

        </tbody>

      </table>

    </div>

  `

}


/*
  ==================================================
  MODAL BUTTONS
  ==================================================
*/

function initHistoryModalButtons() {

  const closeButton =
    document.getElementById(
      'supply-history-close'
    )


  const closeFooterButton =
    document.getElementById(
      'supply-history-close-button'
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


  if (closeFooterButton) {

    closeFooterButton.addEventListener(
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


/*
  ==================================================
  CLOSE HISTORY
  ==================================================
*/

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


/*
  ==================================================
  ERROR
  ==================================================
*/

function showHistoryError(
  message
) {

  const error =
    document.getElementById(
      'supply-history-error'
    )


  const loading =
    document.getElementById(
      'supply-history-loading'
    )


  if (loading) {

    loading.style.display =
      'none'

  }


  if (error) {

    error.style.display =
      'block'

    error.textContent =
      message

  }

}