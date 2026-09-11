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
  UPDATE ETA SERVICE
  ==================================================

  Sumber Excel Logistic:
  - Order No
  - Process Pno
  - Latest ETD

  Aturan:
  - Match berdasarkan Order No + Process Pno.
  - ETA baru = Latest ETD + 1 hari.
  - Latest ETD kosong / tidak valid -> tidak update.
  - ETA history hanya dibuat jika ETA benar-benar berubah.
*/

const BATCH_SIZE = 150


function normalizeKey(value) {
  return String(value ?? '')
    .trim()
    .toUpperCase()
}


export function normalizeETA(value) {
  if (!value) return ''

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return toISODate(value)
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30))
    const date = new Date(
      excelEpoch.getTime() + value * 86400000
    )

    if (!Number.isNaN(date.getTime())) {
      return toISODateUTC(date)
    }
  }

  const text = String(value).trim()

  let match = text.match(
    /^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/
  )

  if (match) {
    return buildISODate(
      match[1],
      match[2],
      match[3]
    )
  }

  match = text.match(
    /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/
  )

  if (match) {
    return buildISODate(
      match[3],
      match[2],
      match[1]
    )
  }

  return ''
}


function buildISODate(year, month, day) {
  const y = Number(year)
  const m = Number(month)
  const d = Number(day)

  const date = new Date(
    Date.UTC(y, m - 1, d)
  )

  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() + 1 !== m ||
    date.getUTCDate() !== d
  ) {
    return ''
  }

  return toISODateUTC(date)
}


function toISODate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-')
}


function toISODateUTC(date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0')
  ].join('-')
}


function addOneDay(isoDate) {
  const [year, month, day] = isoDate
    .split('-')
    .map(Number)

  const date = new Date(
    Date.UTC(year, month - 1, day + 1)
  )

  return toISODateUTC(date)
}


function getRowValue(row, headerName) {
  const target = normalizeKey(headerName)

  const entry = Object.entries(row).find(
    ([key]) => normalizeKey(key) === target
  )

  return entry ? entry[1] : ''
}


function validateHeaders(rows) {
  const firstRow = rows?.[0]

  if (!firstRow || typeof firstRow !== 'object') {
    throw new Error('Data Excel tidak ditemukan.')
  }

  const headers = Object.keys(firstRow)
    .map(normalizeKey)

  const requiredHeaders = [
    'ORDER NO',
    'PROCESS PNO',
    'LATEST ETD'
  ]

  const missing = requiredHeaders.filter(
    header => !headers.includes(header)
  )

  if (missing.length) {
    throw new Error(
      `Format Excel tidak sesuai. Kolom wajib: Order No, Process Pno, Latest ETD. Kolom tidak ditemukan: ${missing.join(', ')}`
    )
  }
}


export async function previewETAUpdate(rows) {
  const inputRows = Array.isArray(rows) ? rows : []

  if (!inputRows.length) {
    throw new Error('Excel tidak memiliki data.')
  }

  validateHeaders(inputRows)

  const partsSnapshot = await getDocs(
    query(
      collectionGroup(db, 'parts')
    )
  )

  const partsMap = new Map()

  partsSnapshot.forEach(partDocument => {
    const data = partDocument.data()
    const noOrder = normalizeKey(data.noOrder)
    const pno = normalizeKey(data.pno)

    if (!noOrder || !pno) {
      return
    }

    const key = `${noOrder}|${pno}`
    const existing = partsMap.get(key) || []

    existing.push({
      ref: partDocument.ref,
      currentETA: normalizeETA(data.eta)
    })

    partsMap.set(key, existing)
  })

  const preview = []
  let matched = 0
  let changed = 0
  let same = 0
  let notFound = 0
  let invalid = 0
  let ambiguous = 0

  inputRows.forEach((row, index) => {
    const noOrder = normalizeKey(
      getRowValue(row, 'Order No')
    )

    const pno = normalizeKey(
      getRowValue(row, 'Process Pno')
    )

    const latestETD = normalizeETA(
      getRowValue(row, 'Latest ETD')
    )

    const newETA = latestETD
      ? addOneDay(latestETD)
      : ''

    const rowNumber = index + 2

    if (!noOrder || !pno || !latestETD) {
      invalid += 1

      preview.push({
        rowNumber,
        noOrder,
        pno,
        latestETD,
        currentETA: '',
        newETA,
        status: 'INVALID'
      })

      return
    }

    const key = `${noOrder}|${pno}`
    const matches = partsMap.get(key) || []

    if (!matches.length) {
      notFound += 1

      preview.push({
        rowNumber,
        noOrder,
        pno,
        latestETD,
        currentETA: '',
        newETA,
        status: 'NOT_FOUND'
      })

      return
    }

    if (matches.length > 1) {
      ambiguous += 1

      preview.push({
        rowNumber,
        noOrder,
        pno,
        latestETD,
        currentETA: '',
        newETA,
        status: 'AMBIGUOUS'
      })

      return
    }

    matched += 1

    const part = matches[0]
    const isChanged =
      part.currentETA !== newETA

    if (isChanged) {
      changed += 1
    } else {
      same += 1
    }

    preview.push({
      rowNumber,
      noOrder,
      pno,
      latestETD,
      currentETA: part.currentETA,
      newETA,
      status: isChanged ? 'CHANGED' : 'SAME',
      partRef: part.ref
    })
  })

  return {
    summary: {
      rows: inputRows.length,
      matched,
      changed,
      same,
      notFound,
      invalid,
      ambiguous
    },
    preview
  }
}


export async function applyETAUpdate(previewRows) {
  const changes = (Array.isArray(previewRows) ? previewRows : [])
    .filter(row => {
      return (
        row.status === 'CHANGED' &&
        row.partRef &&
        row.newETA
      )
    })

  let updated = 0

  for (
    let start = 0;
    start < changes.length;
    start += BATCH_SIZE
  ) {
    const batch = writeBatch(db)
    const orderRefs = new Map()
    const chunk = changes.slice(
      start,
      start + BATCH_SIZE
    )

    chunk.forEach(row => {
      batch.update(
        row.partRef,
        {
          eta: row.newETA
        }
      )

      const historyRef = doc(
        collection(
          row.partRef,
          'etaHistory'
        )
      )

      batch.set(
        historyRef,
        {
          eta: row.newETA,
          updatedAt: serverTimestamp()
        }
      )

      const orderRef = row.partRef.parent.parent

      if (orderRef) {
        orderRefs.set(
          orderRef.path,
          orderRef
        )
      }
    })

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
