import {
  collection,
  doc,
  getDocs,
  runTransaction,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore'

import {
  db
} from './firebase.js'


/*
  ==================================================
  UPDATE PART
  ==================================================

  Mengubah data part order.

  Aturan:
  - Qty Order tidak boleh lebih kecil dari Supply.
  - Jika ETA berubah, simpan history ETA.
  - Jika ETA tidak berubah, tidak membuat history.
*/

export async function updatePart(
  orderId,
  partId,
  partData
) {

  if (!orderId) {
    throw new Error(
      'Order ID tidak tersedia.'
    )
  }

  if (!partId) {
    throw new Error(
      'Part ID tidak tersedia.'
    )
  }

  if (!partData) {
    throw new Error(
      'Data perubahan part tidak tersedia.'
    )
  }

  const pno =
    partData.pno
      ?.trim()
      .toUpperCase() || ''

  const namaPart =
    partData.namaPart
      ?.trim()
      .toUpperCase() || ''

  const noOrder =
    partData.noOrder
      ?.trim()
      .toUpperCase() || ''

  const tglOrder =
    partData.tglOrder || ''

  const qtyOrder =
    Number(partData.qtyOrder)

  const eta =
    partData.eta || ''

  if (!pno) {
    throw new Error('PNO wajib diisi.')
  }

  if (!namaPart) {
    throw new Error('Nama Part wajib diisi.')
  }

  if (!noOrder) {
    throw new Error('No Order wajib diisi.')
  }

  if (!tglOrder) {
    throw new Error('Tgl Order wajib diisi.')
  }

  if (!Number.isInteger(qtyOrder) || qtyOrder <= 0) {
    throw new Error(
      'Qty Order harus berupa angka bulat lebih dari 0.'
    )
  }

  const partRef =
    doc(
      db,
      'orders',
      orderId,
      'parts',
      partId
    )

  const suppliesRef =
    collection(
      partRef,
      'supplies'
    )

  const suppliesSnapshot =
    await getDocs(
      suppliesRef
    )

  let totalSupply = 0

  suppliesSnapshot.forEach(
    supplyDocument => {
      const supplyData =
        supplyDocument.data()

      totalSupply +=
        Number(
          supplyData.qtySupply || 0
        )
    }
  )

  if (qtyOrder < totalSupply) {
    throw new Error(
      `Qty Order tidak boleh kurang dari Supply saat ini (${totalSupply}).`
    )
  }

  const etaHistoryRef =
    collection(
      partRef,
      'etaHistory'
    )

  const orderRef =
    doc(
      db,
      'orders',
      orderId
    )

  const historyRef =
    doc(etaHistoryRef)

  let etaChanged = false
  let previousETA = ''

  await runTransaction(
    db,
    async transaction => {

      const partSnapshot =
        await transaction.get(
          partRef
        )

      if (!partSnapshot.exists()) {
        throw new Error(
          'Data part tidak ditemukan.'
        )
      }

      const currentPart =
        partSnapshot.data()

      previousETA =
        currentPart.eta || ''

      etaChanged =
        previousETA !== eta

      transaction.update(
        partRef,
        {
          pno,
          namaPart,
          noOrder,
          tglOrder,
          qtyOrder,
          eta
        }
      )

      if (etaChanged) {
        transaction.set(
          historyRef,
          {
            eta,
            updatedAt:
              serverTimestamp()
          }
        )
      }

      transaction.update(
        orderRef,
        {
          updatedAt:
            serverTimestamp()
        }
      )

    }
  )

  return {
    partId,
    etaChanged,
    previousETA,
    eta,
    totalSupply
  }
}


/*
  ==================================================
  ADD PART TO WORK ORDER
  ==================================================
*/

export async function addPartToWorkOrder(
  orderId,
  partData
) {
  if (!orderId) {
    throw new Error('Order ID tidak tersedia.')
  }

  if (!partData) {
    throw new Error('Data part tidak tersedia.')
  }

  const pno =
    partData.pno?.trim().toUpperCase() || ''

  const namaPart =
    partData.namaPart?.trim().toUpperCase() || ''

  const noOrder =
    partData.noOrder?.trim().toUpperCase() || ''

  const tglOrder =
    partData.tglOrder || ''

  const qtyOrder =
    Number(partData.qtyOrder)

  const eta =
    partData.eta || ''

  if (!pno) {
    throw new Error('PNO wajib diisi.')
  }

  if (!namaPart) {
    throw new Error('Nama Part wajib diisi.')
  }

  if (!noOrder) {
    throw new Error('No Order wajib diisi.')
  }

  if (!tglOrder) {
    throw new Error('Tgl Order wajib diisi.')
  }

  if (!Number.isInteger(qtyOrder) || qtyOrder <= 0) {
    throw new Error(
      'Qty Order harus berupa angka bulat lebih dari 0.'
    )
  }

  const orderRef =
    doc(db, 'orders', orderId)

  const partsRef =
    collection(orderRef, 'parts')

  const partRef =
    doc(partsRef)

  await runTransaction(
    db,
    async transaction => {
      const orderSnapshot =
        await transaction.get(orderRef)

      if (!orderSnapshot.exists()) {
        throw new Error(
          'Data Work Order tidak ditemukan.'
        )
      }

      const order =
        orderSnapshot.data()

      if (order.completedAt) {
        throw new Error(
          'Work Order yang sudah Completed tidak dapat ditambah part.'
        )
      }

      transaction.set(
        partRef,
        {
          pno,
          namaPart,
          noOrder,
          tglOrder,
          qtyOrder,
          eta
        }
      )

      transaction.update(
        orderRef,
        {
          updatedAt:
            serverTimestamp()
        }
      )
    }
  )

  return {
    partId: partRef.id,
    pno,
    namaPart,
    noOrder,
    tglOrder,
    qtyOrder,
    eta
  }
}


/*
  ==================================================
  DELETE PART
  ==================================================

  Menghapus part beserta:
  - supplies
  - etaHistory

  Work Order utama tetap dipertahankan.
*/

export async function deletePart(
  orderId,
  partId
) {
  if (!orderId) {
    throw new Error(
      'Order ID tidak tersedia.'
    )
  }

  if (!partId) {
    throw new Error(
      'Part ID tidak tersedia.'
    )
  }

  const orderRef =
    doc(
      db,
      'orders',
      orderId
    )

  const partRef =
    doc(
      db,
      'orders',
      orderId,
      'parts',
      partId
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

  const order =
    orderSnapshot.data()

  if (order.completedAt) {
    throw new Error(
      'Work Order yang sudah Completed tidak dapat diubah.'
    )
  }

  const partSnapshot =
    await getDoc(
      partRef
    )

  if (!partSnapshot.exists()) {
    throw new Error(
      'Data part tidak ditemukan.'
    )
  }

  const suppliesSnapshot =
    await getDocs(
      collection(
        partRef,
        'supplies'
      )
    )

  const etaHistorySnapshot =
    await getDocs(
      collection(
        partRef,
        'etaHistory'
      )
    )

  const refs = [
    ...suppliesSnapshot.docs.map(
      document => document.ref
    ),
    ...etaHistorySnapshot.docs.map(
      document => document.ref
    ),
    partRef
  ]

  for (
    let start = 0;
    start < refs.length;
    start += 450
  ) {
    const batch =
      writeBatch(db)

    refs
      .slice(start, start + 450)
      .forEach(reference => {
        batch.delete(reference)
      })

    batch.update(
      orderRef,
      {
        updatedAt:
          serverTimestamp()
      }
    )

    await batch.commit()
  }

  return {
    orderId,
    partId,
    deletedItems: refs.length
  }
}
