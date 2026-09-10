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


  return {

    order,

    parts

  }

}


/*
  ==================================================
  UPDATE ORDER
  ==================================================

  Mengubah informasi utama WO.

  No WO sengaja tidak disediakan di sini
  karena No WO adalah identitas yang terkunci.
*/

export async function updateOrder(
  orderId,
  orderData
) {

  if (!orderId) {

    throw new Error(
      'Order ID tidak tersedia.'
    )

  }


  if (!orderData) {

    throw new Error(
      'Data perubahan WO tidak tersedia.'
    )

  }


  const sa =
    orderData.sa
      ?.trim()
      .toUpperCase() || ''

  const customer =
    orderData.customer
      ?.trim()
      .toUpperCase() || ''

  const noPolisi =
    orderData.noPolisi
      ?.trim()
      .toUpperCase() || ''

  const model =
    orderData.model
      ?.trim()
      .toUpperCase() || ''

  const tanggalBooking =
    orderData.tanggalBooking || ''

  const note =
    orderData.note
      ?.trim()
      .toUpperCase() || ''


  if (!sa) {

    throw new Error(
      'SA wajib diisi.'
    )

  }


  if (!customer) {

    throw new Error(
      'Customer wajib diisi.'
    )

  }


  if (!noPolisi) {

    throw new Error(
      'No Polisi wajib diisi.'
    )

  }


  if (!model) {

    throw new Error(
      'Model wajib diisi.'
    )

  }


  const orderRef =
    doc(
      db,
      'orders',
      orderId
    )


  await runTransaction(
    db,
    async transaction => {

      const orderSnapshot =
        await transaction.get(
          orderRef
        )


      if (!orderSnapshot.exists()) {

        throw new Error(
          'Data Work Order tidak ditemukan.'
        )

      }


      transaction.update(
        orderRef,
        {

          sa,
          customer,
          noPolisi,
          model,
          tanggalBooking,
          note,
          updatedAt:
            serverTimestamp()

        }
      )

    }
  )


  return {

    orderId,

    sa,
    customer,
    noPolisi,
    model,
    tanggalBooking,
    note

  }

}


/*
  ==================================================
  GET PARTS WITH SUPPLY
  ==================================================

  Mengambil semua part dari sebuah WO
  beserta seluruh data supply masing-masing part.
*/

export async function getPartsWithSupply(
  orderId
) {

  if (!orderId) {

    throw new Error(
      'Order ID tidak tersedia.'
    )

  }


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
    await Promise.all(

      partsSnapshot.docs.map(
        async partDocument => {

          const partData =
            partDocument.data()


          const suppliesRef =
            collection(
              db,
              'orders',
              orderId,
              'parts',
              partDocument.id,
              'supplies'
            )


          const suppliesSnapshot =
            await getDocs(
              suppliesRef
            )


          const supplies =
            suppliesSnapshot.docs.map(
              supplyDocument => ({

                id:
                  supplyDocument.id,

                ...supplyDocument.data()

              })
            )


          const totalSupply =
            supplies.reduce(
              (
                total,
                supply
              ) => {

                return (
                  total +
                  Number(
                    supply.qtySupply || 0
                  )
                )

              },
              0
            )


          const qtyOrder =
            Number(
              partData.qtyOrder || 0
            )


          const sisa =
            Math.max(
              qtyOrder -
              totalSupply,
              0
            )


          return {

            id:
              partDocument.id,

            ...partData,

            supplies,

            totalSupply,

            sisa

          }

        }
      )

    )


  return parts

}


/*
  ==================================================
  ADD SUPPLY
  ==================================================
*/

export async function addSupply(
  orderId,
  partId,
  qtySupply,
  ata
) {

  if (!orderId) {
    throw new Error('Order ID tidak tersedia.')
  }

  if (!partId) {
    throw new Error('Part ID tidak tersedia.')
  }

  const quantity =
    Number(qtySupply)

  if (
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {
    throw new Error(
      'Qty Supply harus berupa angka bulat lebih dari 0.'
    )
  }

  if (!ata) {
    throw new Error('ATA wajib diisi.')
  }

  const partRef =
    doc(
      db,
      'orders',
      orderId,
      'parts',
      partId
    )

  const orderRef =
    doc(
      db,
      'orders',
      orderId
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

  const partSnapshot =
    await getDoc(
      partRef
    )

  if (!partSnapshot.exists()) {
    throw new Error(
      'Data part tidak ditemukan.'
    )
  }

  const partData =
    partSnapshot.data()

  const qtyOrder =
    Number(
      partData.qtyOrder || 0
    )

  const sisa =
    Math.max(
      qtyOrder -
      totalSupply,
      0
    )

  if (quantity > sisa) {
    throw new Error(
      `Qty Supply tidak boleh lebih dari sisa ${sisa}.`
    )
  }

  const supplyRef =
    doc(
      suppliesRef
    )

  await runTransaction(
    db,
    async transaction => {

      const latestPartSnapshot =
        await transaction.get(
          partRef
        )

      if (!latestPartSnapshot.exists()) {
        throw new Error(
          'Data part tidak ditemukan.'
        )
      }

      transaction.set(
        supplyRef,
        {
          qtySupply:
            quantity,
          ata:
            ata,
          createdAt:
            serverTimestamp()
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
    supplyId:
      supplyRef.id,
    qtySupply:
      quantity,
    ata
  }

}


/*
  ==================================================
  GET SUPPLY HISTORY
  ==================================================
*/

export async function getSupplyHistory(
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

  const suppliesRef =
    collection(
      db,
      'orders',
      orderId,
      'parts',
      partId,
      'supplies'
    )

  const suppliesQuery =
    query(
      suppliesRef,
      orderBy(
        'createdAt',
        'desc'
      )
    )

  const snapshot =
    await getDocs(
      suppliesQuery
    )

  return snapshot.docs.map(
    document => ({
      id:
        document.id,
      ...document.data()
    })
  )

}


export async function getETAHistory(
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

  const historyRef =
    collection(
      db,
      'orders',
      orderId,
      'parts',
      partId,
      'etaHistory'
    )

  const historyQuery =
    query(
      historyRef,
      orderBy(
        'updatedAt',
        'desc'
      )
    )

  const snapshot =
    await getDocs(
      historyQuery
    )

  return snapshot.docs.map(
    document => ({
      id:
        document.id,
      ...document.data()
    })
  )

}
