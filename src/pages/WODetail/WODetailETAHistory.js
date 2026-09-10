import {
  getETAHistory
} from '../../services/orderService.js'

import {
  escapeHTML,
  formatDate,
  formatTimestamp
} from './WODetailUtils.js'


let currentOrderId = null


let currentPartId = null


let currentPno = ''


let currentNamaPart = ''



export function renderETAHistoryModal() {

  return `

    <div
      id="eta-history-modal"
      class="supply-modal"
    >

      <div
        class="supply-modal-overlay"
        id="eta-history-overlay"
      ></div>


      <div class="supply-modal-content">

        <div class="supply-modal-header">

          <div>

            <h3>
              ETA History
            </h3>

            <p
              id="eta-history-part-title"
            ></p>

          </div>


          <button
            type="button"
            id="eta-history-close"
            class="supply-modal-close"
          >
            ×
          </button>

        </div>


        <div
          class="supply-modal-body"
          id="eta-history-body"
        >

          <div class="wo-detail-loading">
            Memuat ETA History...
          </div>

        </div>


        <div class="supply-modal-footer">

          <button
            type="button"
            id="eta-history-footer-close"
            class="supply-cancel-button"
          >
            Tutup
          </button>

        </div>

      </div>

    </div>

  `

}



export function initETAHistory(
  orderId
) {

  currentOrderId =
    orderId


  initCloseButtons()


  initETAButtons()

}



function initCloseButtons() {

  const closeButton =
    document.getElementById(
      'eta-history-close'
    )


  const footerButton =
    document.getElementById(
      'eta-history-footer-close'
    )


  const overlay =
    document.getElementById(
      'eta-history-overlay'
    )


  if (closeButton) {

    closeButton.addEventListener(
      'click',
      closeETAHistory
    )

  }


  if (footerButton) {

    footerButton.addEventListener(
      'click',
      closeETAHistory
    )

  }


  if (overlay) {

    overlay.addEventListener(
      'click',
      closeETAHistory
    )

  }

}



function initETAButtons() {

  const buttons =
    document.querySelectorAll(
      '.wo-detail-eta-history-button'
    )


  buttons.forEach(
    button => {

      button.addEventListener(
        'click',
        () => {

          const partId =
            button.dataset.partId


          const pno =
            button.dataset.pno || ''


          const namaPart =
            button.dataset.namaPart || ''


          openETAHistory(
            partId,
            pno,
            namaPart
          )

        }
      )

    }
  )

}



async function openETAHistory(
  partId,
  pno,
  namaPart
) {

  if (!currentOrderId) {

    return

  }


  if (!partId) {

    return

  }


  currentPartId =
    partId


  currentPno =
    pno


  currentNamaPart =
    namaPart


  const modal =
    document.getElementById(
      'eta-history-modal'
    )


  const body =
    document.getElementById(
      'eta-history-body'
    )


  const title =
    document.getElementById(
      'eta-history-part-title'
    )


  if (!modal || !body) {

    return

  }


  if (title) {

    title.textContent =
      `${currentPno} - ${currentNamaPart}`

  }


  modal.classList.add(
    'show'
  )


  body.innerHTML = `

    <div class="wo-detail-loading">
      Memuat ETA History...
    </div>

  `


  try {

    const history =
      await getETAHistory(
        currentOrderId,
        currentPartId
      )


    renderETAHistoryTable(
      history
    )

  }
  catch (error) {

    console.error(
      'GAGAL MEMUAT ETA HISTORY:',
      error
    )


    body.innerHTML = `

      <div class="supply-form-error show">
        ${escapeHTML(
          error.message ||
          'Gagal memuat ETA History.'
        )}
      </div>

    `

  }

}



function renderETAHistoryTable(
  history
) {

  const body =
    document.getElementById(
      'eta-history-body'
    )


  if (!body) {

    return

  }


  if (!history.length) {

    body.innerHTML = `

      <div class="supply-history-empty">
        Belum ada perubahan ETA.
      </div>

    `

    return

  }


  const rows =
    history.map(
      (item, index) => {

        return `

          <tr>

            <td>
              ${index + 1}
            </td>

            <td>
              ${
                item.eta
                  ? formatDate(item.eta)
                  : '-'
              }
            </td>

            <td>
              ${
                item.updatedAt
                  ? formatTimestamp(
                      item.updatedAt
                    )
                  : '-'
              }
            </td>

          </tr>

        `

      }
    ).join('')


  body.innerHTML = `

    <div class="supply-history-table-wrapper">

      <table class="wo-detail-table">

        <thead>

          <tr>

            <th>No</th>

            <th>ETA</th>

            <th>Diubah</th>

          </tr>

        </thead>


        <tbody>

          ${rows}

        </tbody>

      </table>

    </div>

  `

}



function closeETAHistory() {

  const modal =
    document.getElementById(
      'eta-history-modal'
    )


  if (!modal) {

    return

  }


  modal.classList.remove(
    'show'
  )



  currentPartId = null

  currentPno = ''

  currentNamaPart = ''

}