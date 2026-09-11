import {
  getOrderDetail,
  getPartsWithSupply
} from '../../services/orderService.js'


import {
  getOrderStatus
} from '../../services/orderStatusService.js'


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
  renderWODetailDeleteModal,
  initWODetailDelete
} from './WODetailDelete.js'


import {
  renderWODetailParts,
  initWODetailSupply
} from './WODetailParts.js'


import {
  finishWorkOrder
} from '../../services/woFinishService.js'


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

      <div id="wo-detail-content"></div>

      ${renderWODetailEditModal()}

      ${renderWODetailPartEditModal()}

      ${renderWODetailDeleteModal()}

    </div>

  `
}


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
    await refreshDetail(orderId)
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


async function renderDetail(
  order,
  parts,
  orderId,
  statusInfo
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
    loading.style.display = 'none'
  }

  if (!content) {
    return
  }

  content.innerHTML = `
    ${renderWODetailInfo(
      order,
      statusInfo
    )}

    ${renderWODetailParts(parts)}
  `

  initWODetailEdit(
    orderId,
    order,
    async () => {
      await refreshDetail(orderId)
    }
  )

  initWODetailPartEdit(
    orderId,
    parts,
    async () => {
      await refreshDetail(orderId)
    }
  )

  initWODetailDelete(
    orderId,
    order,
    () => {
      document.dispatchEvent(
        new CustomEvent(
          'back-to-all-order'
        )
      )
    }
  )

  initWODetailSupply(
    orderId,
    async () => {
      try {
        await refreshDetail(orderId)
      }
      catch (error) {
        console.error(
          'GAGAL REFRESH SUPPLY:',
          error
        )
      }
    }
  )

  initFinishButton(
    orderId,
    statusInfo
  )
}


async function refreshDetail(
  orderId
) {
  const orderResult =
    await getOrderDetail(
      orderId
    )

  const parts =
    await getPartsWithSupply(
      orderId
    )

  const statusInfo =
    await getOrderStatus(
      orderId,
      orderResult.order,
      parts
    )

  await renderDetail(
    orderResult.order,
    parts,
    orderId,
    statusInfo
  )
}


function initFinishButton(
  orderId,
  statusInfo
) {
  const button =
    document.getElementById(
      'wo-finish-button'
    )

  if (!button) {
    return
  }

  button.addEventListener(
    'click',
    async () => {
      const confirmed =
        window.confirm(
          'Selesaikan Work Order ini?'
        )

      if (!confirmed) {
        return
      }

      button.disabled = true
      button.textContent =
        'Menyelesaikan...'

      try {
        await finishWorkOrder(
          orderId
        )

        await refreshDetail(
          orderId
        )
      }
      catch (error) {
        console.error(
          'GAGAL FINISH ORDER:',
          error
        )

        showError(
          error.message ||
          'Gagal menyelesaikan Work Order.'
        )

        button.disabled = false
        button.textContent =
          '✓ Finish Order'
      }
    }
  )
}


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
    loading.style.display = 'none'
  }

  if (message) {
    message.className =
      'wo-detail-message error'

    message.textContent =
      messageText
  }
}
