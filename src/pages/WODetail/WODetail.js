import {
  getOrderDetail,
  getPartsWithSupply
} from '../../services/orderService.js'


import {
  renderWODetailInfo
} from './WODetailInfo.js'


import {
  renderWODetailEditModal,
  initWODetailEdit
} from './WODetailEdit.js'


import {
  renderWODetailPartEditModal,
  initWODetailPartEdit
} from './WODetailPartEdit.js'


import {
  renderWODetailParts,
  initWODetailSupply
} from './WODetailParts.js'


/*
  ==================================================
  RENDER WO DETAIL
  ==================================================
*/

export function renderWODetail() {

  return `

    <div class="wo-detail-page">

      <div class="wo-detail-actions">

        <button
          type="button"
          id="wo-detail-back"
          class="wo-detail-back-button"
        >
          ← Kembali ke All Order
        </button>

      </div>


      <div
        id="wo-detail-loading"
        class="wo-detail-loading"
      >
        Memuat detail Work Order...
      </div>


      <div
        id="wo-detail-message"
        class="wo-detail-message"
      ></div>


      <div
        id="wo-detail-content"
      ></div>

      ${renderWODetailEditModal()}

      ${renderWODetailPartEditModal()}

    </div>

  `
}


/*
  ==================================================
  INIT WO DETAIL
  ==================================================
*/

export async function initWODetail(
  orderId
) {

  initBackButton()

  if (!orderId) {
    showError(
      'Order ID tidak tersedia.'
    )
    return
  }

  try {

    const orderResult =
      await getOrderDetail(
        orderId
      )

    const parts =
      await getPartsWithSupply(
        orderId
      )

    renderDetail(
      orderResult.order,
      parts,
      orderId
    )

  }
  catch (error) {

    console.error(
      'GAGAL MEMUAT WO DETAIL:',
      error
    )

    showError(
      error.message ||
      'Gagal memuat detail Work Order.'
    )

  }
}


/*
  ==================================================
  RENDER DETAIL
  ==================================================
*/

function renderDetail(
  order,
  parts,
  orderId
) {

  const loading =
    document.getElementById(
      'wo-detail-loading'
    )

  const content =
    document.getElementById(
      'wo-detail-content'
    )

  if (loading) {
    loading.style.display =
      'none'
  }

  if (!content) {
    return
  }

  content.innerHTML = `

    ${renderWODetailInfo(
      order
    )}

    ${renderWODetailParts(
      parts
    )}

  `


  /*
    ==========================================
    AKTIFKAN EDIT WO
    ==========================================
  */

  initWODetailEdit(
    orderId,
    order,
    async () => {

      try {

        const refreshedOrder =
          await getOrderDetail(
            orderId
          )

        const refreshedParts =
          await getPartsWithSupply(
            orderId
          )

        renderDetail(
          refreshedOrder.order,
          refreshedParts,
          orderId
        )

      }
      catch (error) {

        console.error(
          'GAGAL REFRESH WO:',
          error
        )

      }

    }
  )


  /*
    ==========================================
    AKTIFKAN EDIT PART
    ==========================================
  */

  initWODetailPartEdit(
    orderId,
    parts,
    async () => {

      try {

        const refreshedOrder =
          await getOrderDetail(
            orderId
          )

        const refreshedParts =
          await getPartsWithSupply(
            orderId
          )

        renderDetail(
          refreshedOrder.order,
          refreshedParts,
          orderId
        )

      }
      catch (error) {

        console.error(
          'GAGAL REFRESH PART:',
          error
        )

      }

    }
  )


  /*
    ==========================================
    AKTIFKAN SUPPLY
    ==========================================
  */

  initWODetailSupply(
    orderId,
    async () => {

      try {

        const updatedParts =
          await getPartsWithSupply(
            orderId
          )

        renderDetail(
          order,
          updatedParts,
          orderId
        )

      }
      catch (error) {

        console.error(
          'GAGAL REFRESH SUPPLY:',
          error
        )

      }

    }
  )

}


/*
  ==================================================
  BACK BUTTON
  ==================================================
*/

function initBackButton() {

  const button =
    document.getElementById(
      'wo-detail-back'
    )

  if (!button) {
    return
  }

  button.addEventListener(
    'click',
    () => {

      document.dispatchEvent(
        new CustomEvent(
          'back-to-all-order'
        )
      )

    }
  )
}


/*
  ==================================================
  ERROR
  ==================================================
*/

function showError(
  messageText
) {

  const loading =
    document.getElementById(
      'wo-detail-loading'
    )

  const message =
    document.getElementById(
      'wo-detail-message'
    )

  if (loading) {
    loading.style.display =
      'none'
  }

  if (message) {

    message.className =
      'wo-detail-message error'

    message.textContent =
      messageText

  }

}
