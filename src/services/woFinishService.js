import {
  doc,
  runTransaction,
  serverTimestamp
} from 'firebase/firestore'

import {
  db
} from './firebase.js'


const FINISHABLE_STATUSES = [
  'BOOKING',
  'PART ARRIVAL'
]


export async function finishWorkOrder(
  orderId,
  currentStatus
) {
  if (!orderId) {
    throw new Error('Order ID tidak tersedia.')
  }

  if (!FINISHABLE_STATUSES.includes(currentStatus)) {
    throw new Error(
      'Work Order belum dapat di-Finish. Status harus BOOKING atau PART ARRIVAL.'
    )
  }

  const orderRef = doc(
    db,
    'orders',
    orderId
  )

  await runTransaction(
    db,
    async transaction => {
      const snapshot = await transaction.get(orderRef)

      if (!snapshot.exists()) {
        throw new Error(
          'Data Work Order tidak ditemukan.'
        )
      }

      const order = snapshot.data()

      if (order.completedAt) {
        throw new Error(
          'Work Order ini sudah berstatus Completed.'
        )
      }

      transaction.update(
        orderRef,
        {
          completedAt:
            serverTimestamp(),
          updatedAt:
            serverTimestamp()
        }
      )
    }
  )

  return {
    orderId,
    completed: true
  }
}
