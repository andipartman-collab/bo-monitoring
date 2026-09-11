import {
  getOrders,
  getOrderDetail
} from './orderService.js'

import {
  getOrderStatus
} from './orderStatusService.js'


const PAGE_SIZE = 200


export async function getDashboardSummary() {

  const summary = {
    totalOrder: 0,
    onOrder: 0,
    partArrival: 0,
    booking: 0,
    noShow: 0
  }

  let cursor = null

  while (true) {
    const result = await getOrders(
      cursor,
      PAGE_SIZE
    )

    for (const order of result.orders) {
      const detail = await getOrderDetail(order.id)

      const statusInfo = await getOrderStatus(
        order.id,
        detail.order,
        detail.parts
      )

      if (statusInfo.status === 'COMPLETED') {
        continue
      }

      summary.totalOrder++

      if (statusInfo.status === 'ON ORDER') {
        summary.onOrder++
      }
      else if (statusInfo.status === 'PART ARRIVAL') {
        summary.partArrival++
      }
      else if (statusInfo.status === 'BOOKING') {
        summary.booking++
      }
      else if (statusInfo.status === 'NO SHOW') {
        summary.noShow++
      }
    }

    if (!result.hasNextPage || !result.lastDoc) {
      break
    }

    cursor = result.lastDoc
  }

  return summary
}
