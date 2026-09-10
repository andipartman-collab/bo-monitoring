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


const BATCH_SIZE = 400


function normalizeKey(value) {
  return String(value ?? '')
    .trim()
    .toUpperCase()
}


export function normalizeETA(value) {
  if (!value) return ''

  if (typeof value === 'string') {
    const text = value.trim()

    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      return text
    }

    const match = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/)

    if (match) {
      const day = match[1].padStart(2, '0')
      const month = match[2].padStart(2, '0')
      return `${match[3]}-${month}-${day}`
    }
  }

  if (typeof value === 'number') {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30))
    const date = new Date(
      excelEpoch.getTime() + value * 86400000
    )

    if (!Number.isNaN(date.getTime())) {
      const year = date.getUTCFullYear()
      const month = String(date.getUTCMonth() + 1).padStart(2, '0')
      const day = String(date.getUTCDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  return ''
}


function getRowValue(row, names) {
  const entries = Object.entries(row)

  for (const name of names) {
    const target = normalizeKey(name)

    const entry = entries.find(([key]) => {
      return normalizeKey(key) === target
    })

    if (entry) {
      return entry[1]
    }
  }

  return ''
}


export async function previewETAUpdate(rows) {
  const inputRows = Array.isArray(rows) ? rows : []

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

    if (!partsMap.has(key)) {
      partsMap.set(key, {
        ref: partDocument.ref,
        currentETA: normalizeETA(data.eta)
      })
    }
  })

  const preview = []
  let matched = 0
  let changed = 0
  let same = 0
  let notFound = 0
  let invalid = 0

  inputRows.forEach((row, index) => {
    const noOrder = normalizeKey(
      getRowValue(row, [
        'No Order',
        'NoOrder',
        'NO ORDER',
        'NOORDER'
      ])
    )

    const pno = normalizeKey(
      getRowValue(row, [
        'PNO',
        'Part No',
        'PART NO',
        'Part Number',
        'PART NUMBER'
      ])
    )

    const eta = normalizeETA(
      getRowValue(row, ['ETA'])
    )

    if (!noOrder || !pno || !eta) {
      invalid += 1

      preview.push({
        rowNumber: index + 2,
        noOrder,
        pno,
        currentETA: '',
        newETA: eta,
        status: 'INVALID'
      })

      return
    }

    const key = `${noOrder}|${pno}`
    const part = partsMap.get(key)

    if (!part) {
      notFound += 1

      preview.push({
        rowNumber: index + 2,
        noOrder,
        pno,
        currentETA: '',
        newETA: eta,
        status: 'NOT_FOUND'
      })

      return
    }

    matched += 1

    const isChanged =
      part.currentETA !== eta

    if (isChanged) {
      changed += 1
    } else {
      same += 1
    }

    preview.push({
      rowNumber: index + 2,
      noOrder,
      pno,
      currentETA: part.currentETA,
      newETA: eta,
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
      invalid
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
    const chunk = changes.slice(start, start + BATCH_SIZE)

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
        orderRefs.set(orderRef.path, orderRef)
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
