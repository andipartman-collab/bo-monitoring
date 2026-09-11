import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase.js'

export async function updateBookingDate(orderId, tanggalBooking) {
  if (!orderId) {
    throw new Error('Order ID tidak tersedia.')
  }

  const bookingDate = tanggalBooking || ''
  const orderRef = doc(db, 'orders', orderId)

  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(orderRef)

    if (!snapshot.exists()) {
      throw new Error('Data Work Order tidak ditemukan.')
    }

    transaction.update(orderRef, {
      tanggalBooking: bookingDate,
      updatedAt: serverTimestamp()
    })
  })

  return {
    orderId,
    tanggalBooking: bookingDate
  }
}
