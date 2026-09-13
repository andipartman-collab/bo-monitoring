import { getOrders, getOrderDetail } from './orderService.js'
import { getOrderStatus } from './orderStatusService.js'

const PAGE_SIZE = 200

export async function getDashboardSummary() {
  const summary = {
    totalOrder: 0,
    onOrder: 0,
    partArrival: 0,
    booking: 0,
    noShow: 0
  }

  const orders = await getAllOrders()
  for (const order of orders) {
    const detail = await getOrderDetail(order.id)
    const statusInfo = await getOrderStatus(order.id, detail.order, detail.parts)
    if (statusInfo.status === 'COMPLETED') continue

    summary.totalOrder++
    if (statusInfo.status === 'ON ORDER') summary.onOrder++
    else if (statusInfo.status === 'PART ARRIVAL') summary.partArrival++
    else if (statusInfo.status === 'BOOKING') summary.booking++
    else if (statusInfo.status === 'NO SHOW') summary.noShow++
  }

  return summary
}

export async function getSAMonitoringSummary(sa) {
  const selectedSA = String(sa || '').trim().toUpperCase()
  const summary = {
    total: 0,
    onOrder: 0,
    partArrival: 0,
    booking: 0,
    noShow: 0
  }

  if (!selectedSA) return summary

  const orders = await getAllOrders()
  for (const order of orders) {
    if (String(order.sa || '').trim().toUpperCase() !== selectedSA) continue

    const detail = await getOrderDetail(order.id)
    const statusInfo = await getOrderStatus(order.id, detail.order, detail.parts)
    if (statusInfo.status === 'COMPLETED') continue

    summary.total++
    if (statusInfo.status === 'ON ORDER') summary.onOrder++
    else if (statusInfo.status === 'PART ARRIVAL') summary.partArrival++
    else if (statusInfo.status === 'BOOKING') summary.booking++
    else if (statusInfo.status === 'NO SHOW') summary.noShow++
  }

  return summary
}

async function getAllOrders() {
  const orders = []
  let cursor = null

  while (true) {
    const result = await getOrders(cursor, PAGE_SIZE)
    orders.push(...result.orders)
    if (!result.hasNextPage || !result.lastDoc) break
    cursor = result.lastDoc
  }

  return orders
}
