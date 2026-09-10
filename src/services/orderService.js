import {
  collection,
  doc,
  runTransaction,
  serverTimestamp
} from 'firebase/firestore'

import {
  db
} from './firebase.js'


/*
  ==================================================
  CREATE NEW ORDER
  ==================================================

  Proses:

  1. Cek No WO di woRegistry
  2. Buat document WO
  3. Buat document Parts
  4. Buat registry No WO

  Semua dilakukan dalam 1 transaction.
*/


export async function createNewOrder(orderData) {

  if (!orderData) {
    throw new Error(
      'Data order tidak tersedia.'
    )
  }


  const noWo =
    orderData.noWo
      ?.trim()
      .toUpperCase()


  if (!noWo) {
    throw new Error(
      'No WO tidak boleh kosong.'
    )
  }


  /*
    ==========================================
    REFERENSI FIRESTORE
    ==========================================
  */

  const registryRef =
    doc(
      db,
      'woRegistry',
      noWo
    )


  const orderRef =
    doc(
      collection(
        db,
        'orders'
      )
    )


  const createdParts = []


  /*
    ==========================================
    TRANSACTION
    ==========================================
  */

  await runTransaction(
    db,
    async transaction => {

      /*
        --------------------------------------
        1. CEK NO WO
        --------------------------------------
      */

      const registrySnapshot =
        await transaction.get(
          registryRef
        )


      if (registrySnapshot.exists()) {

        throw new Error(
          `No WO ${noWo} sudah digunakan.`
        )

      }


      /*
        --------------------------------------
        2. DATA WO
        --------------------------------------
      */

      const orderPayload = {

        noWo,

        sa:
          orderData.sa
            ?.trim()
            .toUpperCase() || '',

        customer:
          orderData.customer
            ?.trim()
            .toUpperCase() || '',

        noPolisi:
          orderData.noPolisi
            ?.trim()
            .toUpperCase() || '',

        model:
          orderData.model
            ?.trim()
            .toUpperCase() || '',

        tanggalBooking:
          orderData.tanggalBooking || '',

        note:
          orderData.note
            ?.trim()
            .toUpperCase() || '',

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp()

      }


      /*
        --------------------------------------
        3. SIMPAN WO
        --------------------------------------
      */

      transaction.set(
        orderRef,
        orderPayload
      )


      /*
        --------------------------------------
        4. SIMPAN PARTS
        --------------------------------------
      */

      const parts =
        Array.isArray(
          orderData.parts
        )
          ? orderData.parts
          : []


      parts.forEach(
        part => {

          const partRef =
            doc(
              collection(
                orderRef,
                'parts'
              )
            )


          const partPayload = {

            pno:
              part.pno
                ?.trim()
                .toUpperCase() || '',

            namaPart:
              part.namaPart
                ?.trim()
                .toUpperCase() || '',

            noOrder:
              part.noOrder
                ?.trim()
                .toUpperCase() || '',

            tglOrder:
              part.tglOrder || '',

            qtyOrder:
              Number(
                part.qtyOrder
              ),

            eta:
              part.eta || ''

          }


          transaction.set(
            partRef,
            partPayload
          )


          createdParts.push({
            id: partRef.id,
            ...partPayload
          })

        }
      )


      /*
        --------------------------------------
        5. SIMPAN REGISTRY
        --------------------------------------
      */

      transaction.set(
        registryRef,
        {

          noWo,

          orderId:
            orderRef.id,

          createdAt:
            serverTimestamp()

        }
      )

    }
  )


  /*
    ==========================================
    RETURN
    ==========================================
  */

  return {

    orderId:
      orderRef.id,

    noWo,

    parts:
      createdParts

  }

}