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

let currentReadOnly = false
let currentBackEvent = 'back-to-all-order'

export function renderWODetail({ readOnly = false } = {}) {
  currentReadOnly = readOnly

  return `
    <div class="wo-detail-page${readOnly ? ' wo-detail-readonly' : ''}">
      <div class="wo-detail-actions">
        <button
          type="button"
          id="wo-detail-back"
          class="wo-detail-back-button"
        >
          ${readOnly ? '← Kembali ke Monitoring SA' : '← Kembali ke All Order'}
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

      ${readOnly ? '' : renderWODetailEditModal()}
      ${readOnly ? '' : renderWODetailPartEditModal()}
      ${readOnly ? '' : renderWODetailDeleteModal()}
    </div>
  `
}

export async function initWODetail(
  orderId,
  options = {}
) {
  currentReadOnly = Boolean(options.readOnly)
  currentBackEvent = options.backEvent || 'back-to-all-order'

  initBackButton()

  if (!orderId) {
    showError('Order ID tidak tersedia.')
    return
  }

  try {
    await refreshDetail(orderId)
  }
  catch (error) {
    console.error('GAGAL MEMUAT WO DETAIL:', error)
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
  const loading = document.getElementById('wo-detail-loading')
  const content = document.getElementById('wo-detail-content')

  if (loading) {
    loading.style.display = 'none'
  }

  if (!content) {
    return
  }

  content.innerHTML = `
    ${renderWODetailInfo(
      order,
      statusInfo,
      { readOnly: currentReadOnly }
    )}

    ${renderWODetailParts(parts)}
  `

  if (currentReadOnly) {
    initReadOnlyHistory(orderId)
    return
  }

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
        new CustomEvent('back-to-all-order')
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
        console.error('GAGAL REFRESH SUPPLY:', error)
      }
    }
  )

  initFinishButton(
    orderId,
    statusInfo
  )
}

async function refreshDetail(orderId) {
  const orderResult = await getOrderDetail(orderId)
  const parts = await getPartsWithSupply(orderId)

  const statusInfo = await getOrderStatus(
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

function initReadOnlyHistory(orderId) {
  const historyButtons = document.querySelectorAll(
    '.wo-detail-history-button'
  )

  historyButtons.forEach(button => {
    button.addEventListener('click', () => {
      document.dispatchEvent(
        new CustomEvent('open-readonly-supply-history', {
          detail: {
            orderId,
            partId: button.dataset.partId,
            pno: button.dataset.pno || '',
            namaPart: button.dataset.namaPart || ''
          }
        })
      )
    })
  })
}

function initFinishButton(orderId, statusInfo) {
  const button = document.getElementById('wo-finish-button')
  if (!button) return

  button.addEventListener('click', async () => {
    const confirmed = window.confirm('Selesaikan Work Order ini?')
    if (!confirmed) return

    button.disabled = true
    button.textContent = 'Menyelesaikan...'

    try {
      await finishWorkOrder(orderId)
      await refreshDetail(orderId)
    }
    catch (error) {
      console.error('GAGAL FINISH ORDER:', error)
      showError(
        error.message ||
        'Gagal menyelesaikan Work Order.'
      )
      button.disabled = false
      button.textContent = '✓ Finish Order'
    }
  })
}

function initBackButton() {
  const button = document.getElementById('wo-detail-back')
  if (!button) return

  button.addEventListener('click', () => {
    document.dispatchEvent(
      new CustomEvent(currentBackEvent)
    )
  })
}

function showError(messageText) {
  const loading = document.getElementById('wo-detail-loading')
  const message = document.getElementById('wo-detail-message')

  if (loading) {
    loading.style.display = 'none'
  }

  if (message) {
    message.className = 'wo-detail-message error'
    message.textContent = messageText
  }
}
