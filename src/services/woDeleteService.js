import {
  collection,
  doc,
  getDoc,
  getDocs,
  writeBatch
} from 'firebase/firestore'

import {
  db
} from './firebase.js'


const BATCH_SIZE = 450


/*
  ==================================================
  DELETE WORK ORDER
  ==================================================

  Menghapus seluruh data turunan WO:
  - supplies
  - etaHistory
  - parts
  - woRegistry
  - order utama

  Penghapusan dilakukan bertahap menggunakan batch
  agar aman ketika jumlah data cukup banyak.
*/
export async function deleteWorkOrder(
  orderId
) {

  if (!orderId) {
    throw new Error(
      'Order ID tidak tersedia.'
    )
  }

  const orderRef =
    doc(
      db,
      'orders',
      orderId
    )

  const orderSnapshot =
    await getDoc(
      orderRef
    )

  if (!orderSnapshot.exists()) {
    throw new Error(
      'Data Work Order tidak ditemukan.'
    )
  }

  const orderData =
    orderSnapshot.data()

  const noWo =
    orderData.noWo
      ?.trim()
      .toUpperCase() || ''

  const partsRef =
    collection(
      db,
      'orders',
      orderId,
      'parts'
    )

  const partsSnapshot =
    await getDocs(
      partsRef
    )

  const deleteRefs = []

  for (const partDocument of partsSnapshot.docs) {

    const partRef =
      partDocument.ref

    const suppliesSnapshot =
      await getDocs(
        collection(
          partRef,
          'supplies'
        )
      )

    suppliesSnapshot.forEach(
      supplyDocument => {
        deleteRefs.push(
          supplyDocument.ref
        )
      }
    )

    const etaHistorySnapshot =
      await getDocs(
        collection(
          partRef,
          'etaHistory'
        )
      )

    etaHistorySnapshot.forEach(
      historyDocument => {
        deleteRefs.push(
          historyDocument.ref
        )
      }
    )

    deleteRefs.push(partRef)

  }

  if (noWo) {
    deleteRefs.push(
      doc(
        db,
        'woRegistry',
        noWo
      )
    )
  }

  deleteRefs.push(orderRef)

  for (
    let start = 0;
    start < deleteRefs.length;
    start += BATCH_SIZE
  ) {

    const batch =
      writeBatch(db)

    const chunk =
      deleteRefs.slice(
        start,
        start + BATCH_SIZE
      )

    chunk.forEach(
      reference => {
        batch.delete(reference)
      }
    )

    await batch.commit()

  }

  return {
    orderId,
    noWo,
    deletedItems:
      deleteRefs.length
  }
}
