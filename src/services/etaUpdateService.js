import {
  collectionGroup,
  getDocs,
  query,
  where,
  writeBatch,
  serverTimestamp
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


function normalizeETA(value) {
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

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  return ''
}


export async function previewETAUpdate(rows) {
  const inputRows = Array.isArray(rows) ? rows : []

  const partsQuery = query(
    collectionGroup(db, 'parts')
  )

  const partsSnapshot = await getDocs(partsQuery)

  const partsMap = new Map()

  partsSnapshot.forEach(partDocument => {
    const data = partDocument.data()

    const key = `${normalizeKey(data.noOrder)}|${normalizeKey(data.pno)}`

    if (!key.startsWith('|') && !partsMap.has(key)) {
      partsMap.set(key, {
        ref: partDocument.ref,
        ...data
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
    const noOrder = normalizeKey(row.noOrder)
    const pno = normalizeKey(row.pno)
    const eta = normalizeETA(row.eta)

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

    const currentETA = normalizeETA(part.eta)
    const isChanged = currentETA !== eta

    if (isChanged) {
      changed += 1
    } else {
      same += 1
    }

    preview.push({
      rowNumber: index + 2,
      noOrder,
      pno,
      currentETA,
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
    .filter(row => row.status === 'CHANGED' && row.partRef && row.newETA)

  let updated = 0

  for (let start = 0; start < changes.length; start += BATCH_SIZE) {
    const batch = writeBatch(db)

    const chunk = changes.slice(start, start + BATCH_SIZE)

    chunk.forEach(row => {
      batch.update(row.partRef, {
        eta: row.newETA
      })

      batch.set(
        collection(row.partRef, 'etaHistory').withConverter?.
          ? null
          : row.partRef,
        {}
      )
    })

    await batch.commit()
    updated += chunk.length
  }

  return { updated }
}
