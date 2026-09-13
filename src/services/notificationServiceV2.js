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

    const parts = await Promise.all((detail.parts || []).map(async part => ({
      ...part,
      totalSupply: await getTotalSupply(order.id, part.id),
      etaChange: await latestEtaChange(order.id, part.id)
    })))

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

async function getTotalSupply(orderId, partId) {
  const ref = collection(db, 'orders', orderId, 'parts', partId, 'supplies')
  const snapshot = await getDocs(ref)
  return snapshot.docs.reduce((sum, doc) => sum + Number(doc.data().qtySupply || 0), 0)
}

async function latestEtaChange(orderId, partId) {
  const ref = collection(db, 'orders', orderId, 'parts', partId, 'etaHistory')
  const snapshot = await getDocs(query(ref, orderBy('updatedAt', 'desc'), limit(2)))
  if (snapshot.docs.length < 2) return null
  const latest = snapshot.docs[0].data().eta || ''
  const previous = snapshot.docs[1].data().eta || ''
  if (!latest || !previous || latest === previous) return null
  return { oldEta: previous, newEta: latest }
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
  return Boolean(date && date.getTime() === b.getTime())
}

function dateDiff(from, to) {
  return Math.round((startOfDay(to) - startOfDay(from)) / DAY_MS)
}

function workingDaysBetween(from, to) {
  const start = startOfDay(from)
  const end = startOfDay(to)
  let count = 0
  const cursor = new Date(start)
  cursor.setDate(cursor.getDate() + 1)
  while (cursor <= end) {
    if (cursor.getDay() !== 0) count++
    cursor.setDate(cursor.getDate() + 1)
  }
  return count
}

export function formatDate(value) {
  const date = typeof value === 'string' ? parseISO(value) : value
  if (!date) return '-'
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}
