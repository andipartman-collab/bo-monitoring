import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore'
import { db } from './firebase.js'
import { getOrders, getOrderDetail } from './orderService.js'
import { getOrderStatus } from './orderStatusService.js'

const PAGE_SIZE = 200
const DAY_MS = 86400000

export const NOTIFICATION_DEFINITIONS = {
  'booking-no-show': { group: 'WO', title: 'Booking No Show', description: 'Tanggal booking sudah terlewati tetapi WO belum selesai.', action: 'Follow Up Pelanggan', icon: '◉' },
  'booking-today': { group: 'WO', title: 'Booking Today', description: 'WO memiliki jadwal booking hari ini.', action: 'Prepare Part di Rak Special Order Part', icon: '●' },
  'booking-h1': { group: 'WO', title: 'Booking H-1', description: 'WO memiliki jadwal booking besok.', action: 'Prepare Part di Rak Special Order Part', icon: '●' },
  'booking-h2': { group: 'WO', title: 'Booking H-2', description: 'WO memiliki jadwal booking dua hari lagi.', action: 'Prepare Part di Rak Special Order Part', icon: '●' },
  'booking-h3': { group: 'WO', title: 'Booking H-3', description: 'WO memiliki jadwal booking tiga hari lagi.', action: 'Prepare Part di Rak Special Order Part', icon: '●' },
  'part-arrival-today': { group: 'WO', title: 'Part Arrival Today', description: 'Status WO menjadi PART ARRIVAL hari ini.', action: 'Follow Up Pelanggan', icon: '✓' },
  'eta-not-found': { group: 'PART', title: 'ETA Not Found', description: 'Sudah H+2 hari kerja sejak order tetapi ETA masih kosong.', action: 'Follow Up Depo', icon: '?' },
  'eta-long-lead-time': { group: 'PART', title: 'ETA Long Lead Time', description: 'ETA lebih dari 14 hari sejak tanggal order.', action: 'Follow Up Depo', icon: '↗' },
  'potential-deadstock': { group: 'PART', title: 'Potential Deadstock', description: 'WO sudah PART ARRIVAL minimal 30 hari.', action: 'Follow Up Pelanggan', icon: '!' },
  'eta-changed': { group: 'PART', title: 'ETA Changed', description: 'Perubahan ETA terakhir berdasarkan history ke-1 dan ke-2.', action: 'Follow Up Pelanggan & Depo', icon: '↔' },
  'eta-overdue': { group: 'PART', title: 'ETA Overdue', description: 'ETA sudah lewat tetapi supply belum lengkap.', action: 'Follow Up Depo', icon: '⚠' }
}

export async function buildNotifications() {
  const data = Object.fromEntries(Object.keys(NOTIFICATION_DEFINITIONS).map(key => [key, []]))
  const today = startOfDay(new Date())
  const orders = await getAllOrders()

  for (const order of orders) {
    const detail = await getOrderDetail(order.id)
    const statusInfo = await getOrderStatus(order.id, detail.order, detail.parts)
    if (statusInfo.status === 'COMPLETED') continue

    addBooking(data, order, statusInfo.status, today)

    if (statusInfo.status === 'PART ARRIVAL' && sameDate(statusInfo.fullArrivalDate, today)) {
      data['part-arrival-today'].push(woRow(order))
    }

    const parts = await enrichParts(order.id, detail.parts || [])

    for (const part of parts) {
      const qty = Number(part.qtyOrder || 0)
      const supply = Number(part.totalSupply || 0)
      const sisa = Math.max(qty - supply, 0)
      const row = partRow(order, part, supply, sisa)
      const orderDate = parseISO(part.tglOrder)
      const etaDate = parseISO(part.eta)

      if (!part.eta && orderDate && workingDaysBetween(orderDate, today) >= 2) data['eta-not-found'].push(row)
      if (etaDate && orderDate && dateDiff(orderDate, etaDate) > 14) data['eta-long-lead-time'].push(row)
      if (etaDate && etaDate < today && sisa > 0) data['eta-overdue'].push(row)
      if (part.etaChange) data['eta-changed'].push({ ...row, etaOld: part.etaChange.oldEta, etaNew: part.etaChange.newEta })

      if (statusInfo.status === 'PART ARRIVAL' && statusInfo.fullArrivalDate && dateDiff(parseISO(statusInfo.fullArrivalDate), today) >= 30) {
        data['potential-deadstock'].push({ ...row, partArrivalDate: statusInfo.fullArrivalDate })
      }
    }
  }

  return data
}

export async function buildTodayTodoNotifications() {
  const today = startOfDay(new Date())
  const data = Object.fromEntries(Object.keys(NOTIFICATION_DEFINITIONS).map(key => [key, []]))
  const orders = await getAllOrders()

  for (const order of orders) {
    const detail = await getOrderDetail(order.id)
    const statusInfo = await getOrderStatus(order.id, detail.order, detail.parts)
    if (statusInfo.status === 'COMPLETED') continue

    const booking = parseISO(order.tanggalBooking)
    if (statusInfo.status === 'BOOKING' && booking) {
      const diff = dateDiff(today, booking)
      const row = woRow(order)
      if (diff < 0 && sameDate(addCalendarDays(booking, 1), today)) data['booking-no-show'].push(row)
      if (diff === 0) data['booking-today'].push(row)
      if (diff === 1) data['booking-h1'].push(row)
      if (diff === 2) data['booking-h2'].push(row)
      if (diff === 3) data['booking-h3'].push(row)
    }

    if (statusInfo.status === 'PART ARRIVAL' && sameDate(statusInfo.fullArrivalDate, today)) {
      data['part-arrival-today'].push(woRow(order))
    }

    const parts = await enrichParts(order.id, detail.parts || [])

    for (const part of parts) {
      const orderDate = parseISO(part.tglOrder)
      const etaDate = parseISO(part.eta)
      const sisa = Math.max(Number(part.qtyOrder || 0) - Number(part.totalSupply || 0), 0)
      const row = partRow(order, part, Number(part.totalSupply || 0), sisa)

      if (!part.eta && orderDate && sameDate(addWorkingDays(orderDate, 2), today)) {
        data['eta-not-found'].push(row)
      }

      if (etaDate && orderDate && dateDiff(orderDate, etaDate) > 14) {
        if (part.etaHistoryLatestUpdatedAt && sameDate(part.etaHistoryLatestUpdatedAt, today)) {
          data['eta-long-lead-time'].push(row)
        }
      }

      if (etaDate && sisa > 0 && sameDate(addCalendarDays(etaDate, 1), today)) {
        data['eta-overdue'].push(row)
      }

      if (part.etaChange && part.etaChange.updatedAt && sameDate(part.etaChange.updatedAt, today)) {
        data['eta-changed'].push({ ...row, etaOld: part.etaChange.oldEta, etaNew: part.etaChange.newEta })
      }

      if (statusInfo.status === 'PART ARRIVAL' && statusInfo.fullArrivalDate && sameDate(addCalendarDays(parseISO(statusInfo.fullArrivalDate), 30), today)) {
        data['potential-deadstock'].push({ ...row, partArrivalDate: statusInfo.fullArrivalDate })
      }
    }
  }

  return data
}

export async function buildTodayTodos() {
  const data = await buildTodayTodoNotifications()
  return Object.entries(data)
    .filter(([, rows]) => rows.length > 0)
    .map(([type, rows]) => ({ type, count: 1, ...NOTIFICATION_DEFINITIONS[type] }))
}

async function enrichParts(orderId, parts) {
  return Promise.all(parts.map(async part => ({
    ...part,
    totalSupply: await getTotalSupply(orderId, part.id),
    etaChange: await latestEtaChange(orderId, part.id),
    etaHistoryLatestUpdatedAt: await latestEtaHistoryUpdatedAt(orderId, part.id)
  })))
}

async function getTotalSupply(orderId, partId) {
  const ref = collection(db, 'orders', orderId, 'parts', partId, 'supplies')
  const snapshot = await getDocs(ref)
  return snapshot.docs.reduce((sum, doc) => sum + Number(doc.data().qtySupply || 0), 0)
}

async function latestEtaChange(orderId, partId) {
  const historyRef = collection(db, 'orders', orderId, 'parts', partId, 'etaHistory')
  const snapshot = await getDocs(query(historyRef, orderBy('updatedAt', 'desc'), limit(2)))
  if (snapshot.docs.length < 2) return null
  const latestData = snapshot.docs[0].data()
  const previousData = snapshot.docs[1].data()
  const newEta = latestData.eta || ''
  const oldEta = previousData.eta || ''
  const updatedAt = toDateOnly(latestData.updatedAt)
  if (!oldEta || !newEta || oldEta === newEta) return null
  return { oldEta, newEta, updatedAt }
}

async function latestEtaHistoryUpdatedAt(orderId, partId) {
  const historyRef = collection(db, 'orders', orderId, 'parts', partId, 'etaHistory')
  const snapshot = await getDocs(query(historyRef, orderBy('updatedAt', 'desc'), limit(1)))
  if (!snapshot.docs.length) return null
  return toDateOnly(snapshot.docs[0].data().updatedAt)
}

function addBooking(data, order, status, today) {
  if (status !== 'BOOKING') return
  const booking = parseISO(order.tanggalBooking)
  if (!booking) return
  const diff = dateDiff(today, booking)
  const row = woRow(order)
  if (diff < 0) data['booking-no-show'].push(row)
  else if (diff === 0) data['booking-today'].push(row)
  else if (diff === 1) data['booking-h1'].push(row)
  else if (diff === 2) data['booking-h2'].push(row)
  else if (diff === 3) data['booking-h3'].push(row)
}

function woRow(order) {
  return { kind: 'WO', orderId: order.id, noWo: order.noWo || '-', sa: order.sa || '-', customer: order.customer || '-', noPolisi: order.noPolisi || '-', model: order.model || '-', tanggalBooking: order.tanggalBooking || '' }
}

function partRow(order, part, supply, sisa) {
  return { kind: 'PART', orderId: order.id, noWo: order.noWo || '-', sa: order.sa || '-', customer: order.customer || '-', noPolisi: order.noPolisi || '-', model: order.model || '-', partId: part.id, pno: part.pno || '-', namaPart: part.namaPart || '-', noOrder: part.noOrder || '-', tglOrder: part.tglOrder || '', eta: part.eta || '', qtyOrder: Number(part.qtyOrder || 0), supply, sisa }
}

async function getAllOrders() {
  const all = []
  let cursor = null
  while (true) {
    const page = await getOrders(cursor, PAGE_SIZE)
    all.push(...page.orders)
    if (!page.hasNextPage || !page.lastDoc) break
    cursor = page.lastDoc
  }
  return all
}

function parseISO(value) {
  if (!value) return null
  if (value instanceof Date) return startOfDay(value)
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Number.isNaN(date.getTime()) ? null : startOfDay(date)
}

function startOfDay(value) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

function sameDate(a, b) {
  const date = parseISO(a)
  return Boolean(date && date.getTime() === startOfDay(b).getTime())
}

function dateDiff(from, to) {
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
    if (cursor.getDay() !== 0) count += 1
    cursor.setDate(cursor.getDate() + 1)
  }
  return count
}

function addWorkingDays(from, count) {
  const date = startOfDay(from)
  let added = 0
  while (added < count) {
    date.setDate(date.getDate() + 1)
    if (date.getDay() !== 0) added += 1
  }
  return date
}

function addCalendarDays(from, count) {
  const date = startOfDay(from)
  date.setDate(date.getDate() + count)
  return date
}

function toDateOnly(value) {
  if (!value) return null
  if (typeof value?.toDate === 'function') return startOfDay(value.toDate())
  if (value instanceof Date) return startOfDay(value)
  return parseISO(value)
}

export function formatDate(value) {
  const date = typeof value === 'string' ? parseISO(value) : value
  if (!date) return '-'
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}
