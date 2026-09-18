import {
  collection,
  getDocs
} from 'firebase/firestore'

import {
  db
} from './firebase.js'

import {
  deleteWorkOrder
} from './woDeleteService.js'


const completedOrdersRef = collection(
  db,
  'orders'
)


function toDate(value) {
  if (!value) {
    return null
  }

  if (value?.toDate instanceof Function) {
    return value.toDate()
  }

  if (value instanceof Date) {
    return value
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? null
    : date
}


function getCutoffDate(months) {
  const value = Number(months)

  if (![3, 6, 12].includes(value)) {
    throw new Error(
      'Periode penghapusan harus 3, 6, atau 12 bulan.'
    )
  }

  const cutoff = new Date()
  cutoff.setHours(0, 0, 0, 0)
  cutoff.setMonth(cutoff.getMonth() - value)

  return cutoff
}


function normalizeOrder(document) {
  const data = document.data()

  return {
    id: document.id,
    ...data,
    completedDate: toDate(data.completedAt)
  }
}


export async function getCompletedOrders() {
  const snapshot = await getDocs(
    completedOrdersRef
  )

  return snapshot.docs
    .map(normalizeOrder)
    .filter(order => order.completedDate)
    .sort((a, b) => {
      return (
        b.completedDate.getTime() -
        a.completedDate.getTime()
      )
    })
}


export function getDeleteCutoffDate(months) {
  return getCutoffDate(months)
}


export async function findCompletedOrdersOlderThan(
  months
) {
  const cutoff = getCutoffDate(months)
  const orders = await getCompletedOrders()

  return orders.filter(order => {
    return order.completedDate < cutoff
  })
}


export async function deleteCompletedOrdersOlderThan(
  months,
  onProgress
) {
  const targets =
    await findCompletedOrdersOlderThan(months)

  let deletedCount = 0

  for (const order of targets) {
    await deleteWorkOrder(order.id)

    deletedCount++

    if (typeof onProgress === 'function') {
      onProgress({
        completed: deletedCount,
        total: targets.length,
        order
      })
    }
  }

  return {
    totalFound: targets.length,
    deletedCount
  }
}
