import {
  doc,
  runTransaction,
  serverTimestamp
} from 'firebase/firestore'

import {
  db
} from './firebase.js'


export async function finishWorkOrder(
  orderId
) {
  if (!orderId) {
    throw new Error('Order ID tidak tersedia.')
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

      if (!order.tanggalBooking) {
        throw new Error(
          'Work Order belum memiliki tanggal booking.'
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
