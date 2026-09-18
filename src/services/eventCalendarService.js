import { getOrders, getPartsWithSupply } from './orderService.js'

export const SA_LIST = [
  'ADN',
  'AGS',
  'ALF',
  'ANT',
  'DWI',
  'EKS',
  'HDS',
  'IND',
  'LUT',
  'NUR',
  'VIK',
  'OTHERS'
]

export const EVENT_TYPES = {
  ETA: 'ETA',
  PART_ARRIVAL: 'PART_ARRIVAL',
  BOOKING: 'BOOKING'
}

const PAGE_SIZE = 200

export async function getCalendarEvents() {
  const orders = await getAllOrders()

  const activeOrders = orders.filter(order => {
    return !order.completedAt
  })

  const results = await Promise.all(
    activeOrders.map(async order => {
      const events = []

      if (isValidDateKey(order.tanggalBooking)) {
        events.push({
          id: `booking-${order.id}`,
          type: EVENT_TYPES.BOOKING,
          date: order.tanggalBooking,
          orderId: order.id,
          noWo: order.noWo || '-',
          sa: normalizeSA(order.sa),
          customer: order.customer || '-',
          model: order.model || '-',
          pno: '',
          namaPart: ''
        })
      }

      const parts = await getPartsWithSupply(order.id)

      parts.forEach(part => {
        if (isValidDateKey(part.eta)) {
          events.push({
            id: `eta-${order.id}-${part.id}`,
            type: EVENT_TYPES.ETA,
            date: part.eta,
            orderId: order.id,
            partId: part.id,
            noWo: order.noWo || '-',
            sa: normalizeSA(order.sa),
            customer: order.customer || '-',
            model: order.model || '-',
            pno: part.pno || '-',
            namaPart: part.namaPart || '-'
          })
        }

        const partArrivalDate = getPartArrivalDate(part)

        if (partArrivalDate) {
          events.push({
            id: `arrival-${order.id}-${part.id}`,
            type: EVENT_TYPES.PART_ARRIVAL,
            date: partArrivalDate,
            orderId: order.id,
            partId: part.id,
            noWo: order.noWo || '-',
            sa: normalizeSA(order.sa),
            customer: order.customer || '-',
            model: order.model || '-',
            pno: part.pno || '-',
            namaPart: part.namaPart || '-'
          })
        }
      })

      return events
    })
  )

  return results
    .flat()
    .sort(compareEvents)
}

async function getAllOrders() {
  const allOrders = []
  let cursor = null

  while (true) {
    const result = await getOrders(cursor, PAGE_SIZE)

    allOrders.push(...result.orders)

    if (!result.hasNextPage || !result.lastDoc) {
      break
    }

    cursor = result.lastDoc
  }

  return allOrders
}

function getPartArrivalDate(part) {
  const qtyOrder = Number(part.qtyOrder || 0)

  if (qtyOrder <= 0 || !Array.isArray(part.supplies)) {
    return ''
  }

  const supplies = [...part.supplies]
    .filter(supply => isValidDateKey(supply.ata))
    .sort((a, b) => {
      return String(a.ata).localeCompare(String(b.ata))
    })

  let accumulated = 0

  for (const supply of supplies) {
    accumulated += Number(supply.qtySupply || 0)

    if (accumulated >= qtyOrder) {
      return String(supply.ata)
    }
  }

  return ''
}

function compareEvents(a, b) {
  const dateCompare =
    String(a.date).localeCompare(String(b.date))

  if (dateCompare !== 0) {
    return dateCompare
  }

  const rank = {
    [EVENT_TYPES.ETA]: 1,
    [EVENT_TYPES.PART_ARRIVAL]: 2,
    [EVENT_TYPES.BOOKING]: 3
  }

  return (rank[a.type] || 99) - (rank[b.type] || 99)
}

function isValidDateKey(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))
}

function normalizeSA(value) {
  const sa = String(value || '').trim().toUpperCase()
  return sa || 'OTHERS'
}
