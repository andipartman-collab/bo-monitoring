import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  query,
  orderBy,
  limit,
  startAfter
} from 'firebase/firestore'

import {
  db
} from './firebase.js'


/*
  ==================================================
  CREATE NEW ORDER
  ==================================================
*/

export async function createNewOrder(
  orderData
) {

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


  await runTransaction(
    db,
    async transaction => {

      /*
        ========================================
        1. CEK NO WO
        ========================================
      */

      const registrySnapshot =
        await transaction.get(
          registryRef
        )


      if (
        registrySnapshot.exists()
      ) {

        throw new Error(
          `No WO ${noWo} sudah digunakan.`
        )

      }


      /*
        ========================================
        2. DATA WO
        ========================================
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
        ========================================
        3. SIMPAN WO
        ========================================
      */

      transaction.set(
        orderRef,
        orderPayload
      )


      /*
        ========================================
        4. SIMPAN PARTS
        ========================================
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

            id:
              partRef.id,

            ...partPayload

          })

        }
      )


      /*
        ========================================
        5. SIMPAN REGISTRY
        ========================================
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


  return {

    orderId:
      orderRef.id,

    noWo,

    parts:
      createdParts

  }

}


/*
  ==================================================
  GET ORDERS
  ==================================================

  Mengambil daftar WO dengan pagination.
*/

export async function getOrders(
  cursor = null,
  pageSize = 20
) {

  const ordersRef =
    collection(
      db,
      'orders'
    )


  const baseQuery =
    query(
      ordersRef,

      orderBy(
        'createdAt',
        'desc'
      ),

      limit(
        pageSize
      )
    )


  let snapshot


  if (cursor) {

    const nextQuery =
      query(
        ordersRef,

        orderBy(
          'createdAt',
          'desc'
        ),

        startAfter(
          cursor
        ),

        limit(
          pageSize
        )
      )


    snapshot =
      await getDocs(
        nextQuery
      )

  }
  else {

    snapshot =
      await getDocs(
        baseQuery
      )

  }


  const orders =
    snapshot.docs.map(
      document => ({

        id:
          document.id,

        ...document.data()

      })
    )


  const lastDoc =
    snapshot.docs.length > 0
      ? snapshot.docs[
          snapshot.docs.length - 1
        ]
      : null


  return {

    orders,

    lastDoc,

    hasNextPage:
      snapshot.size === pageSize

  }

}


/*
  ==================================================
  GET ORDER DETAIL
  ==================================================

  Mengambil:
  - Data WO
  - Semua Parts

  orderId adalah document ID Firestore.
*/

export async function getOrderDetail(
  orderId
) {

  if (!orderId) {

    throw new Error(
      'Order ID tidak tersedia.'
    )

  }


  /*
    ==========================================
    1. AMBIL DATA WO
    ==========================================
  */

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


  if (
    !orderSnapshot.exists()
  ) {

    throw new Error(
      'Data Work Order tidak ditemukan.'
    )

  }


  const order = {

    id:
      orderSnapshot.id,

    ...orderSnapshot.data()

  }


  /*
    ==========================================
    2. AMBIL PARTS
    ==========================================
  */

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


  const parts =
    partsSnapshot.docs.map(
      document => ({

        id:
          document.id,

        ...document.data()

      })
    )


  /*
    ==========================================
    3. RETURN
    ==========================================
  */

  return {

    order,

    parts

  }

}