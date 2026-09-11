import {
  collection,
  collectionGroup,
  doc,
  getDocs,
  query,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore'

import {
  db
} from './firebase.js'


/*
  ==================================================
  UPDATE ATA SERVICE
  ==================================================

  Sumber Excel Logistic:
  - Cust. Order No.
  - Part No.
  - Shipped Qty

  Aturan:
  - Match berdasarkan No Order + PNO.
  - Jika kombinasi yang sama muncul beberapa kali,
    Shipped Qty dijumlahkan terlebih dahulu.
  - Shipping Date tidak digunakan sebagai ATA.
  - ATA dibuat otomatis saat supply disimpan oleh web.
*/

const BATCH_SIZE = 150


function normalizeKey(value) {
  return String(value ?? '')
    .trim()
    .toUpperCase()
}


function getRowValue(row, ...headerNames) {
  const normalizedHeaders = headerNames.map(normalizeKey)

  const entry = Object.entries(row || {}).find(
    ([key]) => normalizedHeaders.includes(normalizeKey(key))
  )

  return entry ? entry[1] : ''
}


function toPositiveInteger(value) {
  const number = Number(String(value ?? '').replaceAll(',', '').trim())

  return Number.isInteger(number) && number > 0
    ? number
    : 0
}


function validateHeaders(rows) {
  const firstRow = rows?.[0]

  if (!firstRow || typeof firstRow !== 'object') {
    throw new Error('Data Excel tidak ditemukan.')
  }

  const headers = Object.keys(firstRow).map(normalizeKey)

  const requiredHeaders = [
    'CUST. ORDER NO.',
    'PART NO.',
    'SHIPPED QTY'
  ]

  const missing = requiredHeaders.filter(
    header => !headers.includes(header)
  )

  if (missing.length) {
    throw new Error(
      `Format Excel tidak sesuai. Kolom wajib: Cust. Order No., Part No., Shipped Qty. Kolom tidak ditemukan: ${missing.join(', ')}`
    )
  }
}


export async function previewATAUpdate(rows) {
  const inputRows = Array.isArray(rows) ? rows : []

  if (!inputRows.length) {
    throw new Error('Excel tidak memiliki data.')
  }

  validateHeaders(inputRows)

  const groupedMap = new Map()
  let invalidRows = 0

  inputRows.forEach((row, index) => {
    const noOrder = normalizeKey(
      getRowValue(row, 'Cust. Order No.')
    )

    const pno = normalizeKey(
      getRowValue(row, 'Part No.')
    )

    const shippedQty = toPositiveInteger(
      getRowValue(row, 'Shipped Qty')
    )

    if (!noOrder || !pno || shippedQty <= 0) {
      invalidRows += 1
      return
    }

    const key = `${noOrder}|${pno}`
    const existing = groupedMap.get(key) || {
      noOrder,
      pno,
      qtySupply: 0,
      sourceRows: []
    }

    existing.qtySupply += shippedQty
    existing.sourceRows.push(index + 2)

    groupedMap.set(key, existing)
  })

  const partsSnapshot = await getDocs(
    query(collectionGroup(db, 'parts'))
  )

  const partsMap = new Map()

  partsSnapshot.forEach(partDocument => {
    const data = partDocument.data()
    const noOrder = normalizeKey(data.noOrder)
    const pno = normalizeKey(data.pno)

    if (!noOrder || !pno) return

    const key = `${noOrder}|${pno}`

    if (!partsMap.has(key)) {
      partsMap.set(key, [])
    }

    partsMap.get(key).push({
      ref: partDocument.ref,
      namaPart: data.namaPart || '',
      qtyOrder: Number(data.qtyOrder || 0)
    })
  })

  const preview = []

  let total = 0
  let matched = 0
  let notFound = 0
  let ambiguous = 0
  let overSupply = 0

  for (const item of groupedMap.values()) {
    total += 1

    const matches = partsMap.get(
      `${item.noOrder}|${item.pno}`
    ) || []

    if (!matches.length) {
      notFound += 1

      preview.push({
        ...item,
        currentSupply: 0,
        sisa: 0,
        status: 'NOT_FOUND'
      })

      continue
    }

    if (matches.length > 1) {
      ambiguous += 1

      preview.push({
        ...item,
        currentSupply: 0,
        sisa: 0,
        status: 'AMBIGUOUS'
      })

      continue
    }

    const match = matches[0]

    const suppliesSnapshot = await getDocs(
      collection(match.ref, 'supplies')
    )

    const currentSupply = suppliesSnapshot.docs.reduce(
      (totalSupply, supplyDocument) => {
        return totalSupply + Number(
          supplyDocument.data().qtySupply || 0
        )
      },
      0
    )

    const sisa = Math.max(
      match.qtyOrder - currentSupply,
      0
    )

    if (item.qtySupply > sisa) {
      overSupply += 1

      preview.push({
        ...item,
        partId: match.ref.id,
        partRefPath: match.ref.path,
        namaPart: match.namaPart,
        qtyOrder: match.qtyOrder,
        currentSupply,
        sisa,
        status: 'OVER_SUPPLY'
      })

      continue
    }

    matched += 1

    preview.push({
      ...item,
      partId: match.ref.id,
      partRefPath: match.ref.path,
      namaPart: match.namaPart,
      qtyOrder: match.qtyOrder,
      currentSupply,
      sisa,
      status: 'MATCH'
    })
  }

  return {
    summary: {
      rows: inputRows.length,
      total,
      matched,
      notFound,
      invalid: invalidRows,
      ambiguous,
      overSupply
    },
    preview
  }
}


export async function applyATAUpdate(previewRows) {
  const changes = (Array.isArray(previewRows) ? previewRows : [])
    .filter(row => {
      return (
        row.status === 'MATCH' &&
        row.partRefPath &&
        row.qtySupply > 0
      )
    })

  let updated = 0

  for (
    let start = 0;
    start < changes.length;
    start += BATCH_SIZE
  ) {
    const chunk = changes.slice(
      start,
      start + BATCH_SIZE
    )

    const batch = writeBatch(db)
    const orderRefs = new Map()

    for (const row of chunk) {
      const partRef = doc(db, row.partRefPath)
      const supplyRef = doc(collection(partRef, 'supplies'))

      batch.set(
        supplyRef,
        {
          qtySupply: Number(row.qtySupply),
          ata: new Date().toISOString().slice(0, 10),
          createdAt: serverTimestamp()
        }
      )

      const orderRef = partRef.parent.parent

      if (orderRef) {
        orderRefs.set(orderRef.path, orderRef)
      }
    }

    orderRefs.forEach(orderRef => {
      batch.update(
        orderRef,
        {
          updatedAt: serverTimestamp()
        }
      )
    })

    await batch.commit()
    updated += chunk.length
  }

  return {
    updated
  }
}
