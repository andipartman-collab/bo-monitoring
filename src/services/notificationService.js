import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore'
import { db } from './firebase.js'
import { getOrders, getOrderDetail } from './orderService.js'
import { getOrderStatus } from './orderStatusService.js'

const PAGE_SIZE = 200
const DAY_MS = 86400000

const TYPES = {
  BOOKING_NO_SHOW: 'booking-no-show',
  BOOKING_TODAY: 'booking-today',
  BOOKING_H1: 'booking-h1',
  BOOKING_H2: 'booking-h2',
  BOOKING_H3: 'booking-h3',
  PART_ARRIVAL_TODAY: 'part-arrival-today',
  ETA_NOT_FOUND: 'eta-not-found',
  ETA_LONG_LEAD_TIME: 'eta-long-lead-time',
  POTENTIAL_DEADSTOCK: 'potential-deadstock',
  ETA_CHANGED: 'eta-changed',
  ETA_OVERDUE: 'eta-overdue'
}

export const NOTIFICATION_DEFINITIONS = {
  [TYPES.BOOKING_NO_SHOW]: {
    group: 'WO',
    title: 'Booking No Show',
    description: 'Tanggal booking sudah terlewati tetapi WO belum selesai.',
    action: 'Follow Up Pelanggan',
    icon: '◉'
  },
  [TYPES.BOOKING_TODAY]: {
    group: 'WO',
    title: 'Booking Today',
    description: 'WO memiliki jadwal booking hari ini.',
    action: 'Prepare Part di Rak Special Order Part',
    icon: '●'
  },
  [TYPES.BOOKING_H1]: {
    group: 'WO',
    title: 'Booking H-1',
    description: 'WO memiliki jadwal booking besok.',
    action: 'Prepare Part di Rak Special Order Part',
    icon: '●'
  },
  [TYPES.BOOKING_H2]: {
    group: 'WO',
    title: 'Booking H-2',
    description: 'WO memiliki jadwal booking dua hari lagi.',
    action: 'Prepare Part di Rak Special Order Part',
    icon: '●'
  },
  [TYPES.BOOKING_H3]: {
    group: 'WO',
    title: 'Booking H-3',
    description: 'WO memiliki jadwal booking tiga hari lagi.',
    action: 'Prepare Part di Rak Special Order Part',
    icon: '●'
  },
  [TYPES.PART_ARRIVAL_TODAY]: {
    group: 'WO',
    title: 'Part Arrival Today',
    description: 'Status WO berubah menjadi PART ARRIVAL hari ini.',
    action: 'Follow Up Pelanggan',
    icon: '✓'
  },
  [TYPES.ETA_NOT_FOUND]: {
    group: 'PART',
    title: 'ETA Not Found',
    description: 'Sudah H+2 hari kerja sejak order tetapi ETA masih kosong.',
    action: 'Follow Up Depo',
    icon: '?'
  },
  [TYPES.ETA_LONG_LEAD_TIME]: {
    group: 'PART',
    title: 'ETA Long Lead Time',
    description: 'ETA lebih dari 14 hari sejak tanggal order.',
    action: 'Follow Up Depo',
    icon: '↗'
  },
  [TYPES.POTENTIAL_DEADSTOCK]: {
    group: 'PART',
    title: 'Potential Deadstock',
    description: 'WO sudah PART ARRIVAL selama minimal 30 hari.',
    action: 'Follow Up Pelanggan',
    icon: '!' 
  },
  [TYPES.ETA_CHANGED]: {
    group: 'PART',
    title: 'ETA Changed',
    description: 'ETA berubah berdasarkan dua history ETA terakhir.',
    action: 'Follow Up Pelanggan & Depo',
    icon: '↔'
  },
  [TYPES.ETA_OVERDUE]: {
    group: 'PART',
    title: 'ETA Overdue',
    description: 'ETA sudah lewat tetapi supply belum lengkap.',
    action: 'Follow Up Depo',
    icon: '⚠'
  }
}

export async function buildNotifications() {
  const orders = await getAllOrders()
  const notifications = Object.fromEntries(
    Object.keys(NOTIFICATION_DEFINITIONS).map(type => [type, []])
  )

  const today = startOfDay(new Date())

  for (const order of orders) {
    const detail = await getOrderDetail(order.id)
    const statusInfo = await getOrderStatus(order.id, detail.order, detail.parts)

    if (statusInfo.status === 'COMPLETED') continue

    addBookingNotifications(notifications, order, statusInfo.status, today)
    if (statusInfo.status === 'PART ARRIVAL' && sameDate(statusInfo.fullArrivalDate, today)) {
      notifications[TYPES.PART_ARRIVAL_TODAY].push({
        kind: 'WO',
        orderId: order.id,
        noWo: order.noWo || '-',
        sa: order.sa || '-',
        customer: order.customer || '-',
        noPolisi: order.noPolisi || '-',
        model: order.model || '-',
        tanggalBooking: order.tanggalBooking || '',
        detailText: `Full arrival ${formatDate(statusInfo.fullArrivalDate)}`
      })
    }

    if (statusInfo.status === 'PART ARRIVAL' && dateDiffInDays(parseISO(order.updatedAt ? '' : statusInfo.fullArrivalDate), today) >= 30) {
      notifications[TYPES.POTENTIAL_DEADSTOCK]
    }

    const parts = detail.parts || []
    const enrichedParts = await enrichParts(order, parts, today)

    for (const part of enrichedParts) {
      const base = {
        kind: 'PART',
        orderId: order.id,
        noWo: order.noWo || '-',
        sa: order.sa || '-',
        customer: order.customer || '-',
        noPolisi: order.noPolisi || '-',
        model: order.model || '-',
        partId: part.id,
        pno: part.pno || '-',
        namaPart: part.namaPart || '-',
        noOrder: part.noOrder || '-',
        tglOrder: part.tglOrder || '',
        eta: part.eta || '',
        qtyOrder: Number(part.qtyOrder || 0),
        supply: Number(part.totalSupply || 0),
        sisa: Math.max(Number(part.qtyOrder || 0) - Number(part.totalSupply || 0), 0)
      }

      const orderDate = parseISO(part.tglOrder)
      if (!part.eta && orderDate && workingDaysBetween(orderDate, today) >= 2) {
        notifications[TYPES.ETA_NOT_FOUND].push({ ...base })
      }

      if (part.eta && orderDate && dateDiffInDays(orderDate, parseISO(part.eta)) > 14) {
        notifications[TYPES.ETA_LONG_LEAD_TIME].push({ ...base })
      }

      if (part.eta && parseISO(part.eta) < today && base.sisa > 0) {
        notifications[TYPES.ETA_OVERDUE].push({ ...base })
      }

      if (part.etaChange && part.etaChange.oldEta && part.etaChange.newEta) {
        notifications[TYPES.ETA_CHANGED].push({
          ...base,
          etaOld: part.etaChange.oldEta,
          etaNew: part.etaChange.newEta
        })
      }

      if (
        statusInfo.status === 'PART ARRIVAL' &&
        statusInfo.fullArrivalDate &&
        dateDiffInDays(parseISO(statusInfo.fullArrivalDate), today) >= 30
      ) {
        notifications[TYPES.POTENTIAL_DEADSTOCK].push({
          ...base,
          partArrivalDate: statusInfo.fullArrivalDate
        })
      }
    }
  }

  return notifications
}

async function enrichParts(order, parts, today) {
  return Promise.all(parts.map(async part => ({
    ...part,
    etaChange: await getLatestETAChange(order.id, part.id)
  })))
}

async function getLatestETAChange(orderId, partId) {
  if (!orderId || !partId) return null

  const historyRef = collection(
    db,
    'orders',
    orderId,
    'parts',
    partId,
    'etaHistory'
  )

  const snapshot = await getDocs(
    query(historyRef, orderBy('updatedAt', 'desc'), limit(2))
  )

  if (snapshot.docs.length < 2) return null

  const latest = snapshot.docs[0].data()
  const previous = snapshot.docs[1].data()
  const oldEta = previous.eta || ''
  const newEta = latest.eta || ''

  if (!oldEta || !newEta || oldEta === newEta) return null

  return { oldEta, newEta }
}

function addBookingNotifications(target, order, status, today) {
  if (status !== 'BOOKING' || !order.tanggalBooking) return
  const booking = parseISO(order.tanggalBooking)
  if (!booking) return

  const diff = dateDiffInDays(today, booking)
  const item = {
    kind: 'WO',
    orderId: order.id,
    noWo: order.noWo || '-',
    sa: order.sa || '-',
    customer: order.customer || '-',
    noPolisi: order.noPolisi || '-',
    model: order.model || '-',
    tanggalBooking: order.tanggalBooking
  }

  if (diff < 0) target[TYPES.BOOKING_NO_SHOW].push(item)
  if (diff === 0) target[TYPES.BOOKING_TODAY].push(item)
  if (diff === 1) target[TYPES.BOOKING_H1].push(item)
  if (diff === 2) target[TYPES.BOOKING_H2].push(item)
  if (diff === 3) target[TYPES.BOOKING_H3].push(item)
}

async function getAllOrders() {
  const result = []
  let cursor = null

  while (true) {
    const page = await getOrders(cursor, PAGE_SIZE)
    result.push(...page.orders)
    if (!page.hasNextPage || !page.lastDoc) break
    cursor = page.lastDoc
  }

  return result
}

function startOfDay(value) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

function parseISO(value) {
  if (!value) return null
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Number.isNaN(date.getTime()) ? null : startOfDay(date)
}

function sameDate(value, date) {
  const parsed = parseISO(value)
  return Boolean(parsed && parsed.getTime() === date.getTime())
}

function dateDiffInDays(from, to) {
  return Math.round((startOfDay(to) - startOfDay(from)) / DAY_MS)
}

function workingDaysBetween(from, to) {
  const start = startOfDay(from)
  const end = startOfDay(to)
  if (end <= start) return 0

  let count = 0
  const cursor = new Date(start)
  cursor.setDate(cursor.getDate() + 1)

  while (cursor <= end) {
    const day = cursor.getDay()
    if (day !== 0) count += 1
    cursor.setDate(cursor.getDate() + 1)
  }

  return count
}

function formatDate(value) {
  const date = typeof value === 'string' ? parseISO(value) : value
  if (!date) return '-'
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}

export { formatDate }
