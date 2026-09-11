import {
  collection,
  getDocs
} from 'firebase/firestore'

import {
  db
} from './firebase.js'


const NO_SHOW_DAYS = 30


export function getPartStatus(
  qtyOrder,
  totalSupply
) {
  const order = Number(qtyOrder || 0)
  const supply = Number(totalSupply || 0)

  if (supply <= 0) {
    return 'ON ORDER'
  }

  if (supply < order) {
    return 'PARTIAL'
  }

  return 'ARRIVAL'
}


function getDateOnly(value) {
  if (!value) return null

  const date = new Date(`${value}T00:00:00`)

  return Number.isNaN(date.getTime())
    ? null
    : date
}


function addDays(date, days) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}


function getLatestArrivalDate(
  qtyOrder,
  supplies
) {
  const order = Number(qtyOrder || 0)
  const sortedSupplies = [...supplies]
    .filter(supply => supply.ata)
    .sort((a, b) => {
      return String(a.ata).localeCompare(String(b.ata))
    })

  let accumulated = 0

  for (const supply of sortedSupplies) {
    accumulated += Number(supply.qtySupply || 0)

    if (accumulated >= order) {
      return getDateOnly(supply.ata)
    }
  }

  return null
}


export async function getOrderStatus(
  orderId,
  orderData,
  parts
) {
  if (!orderId) {
    throw new Error('Order ID tidak tersedia.')
  }

  if (!orderData) {
    throw new Error('Data Work Order tidak tersedia.')
  }

  if (!Array.isArray(parts) || parts.length === 0) {
    return {
      status: 'ON ORDER',
      fullArrivalDate: null,
      noShowDate: null,
      isCompleted: Boolean(orderData.completedAt)
    }
  }

  if (orderData.completedAt) {
    return {
      status: 'COMPLETED',
      fullArrivalDate: null,
      noShowDate: null,
      isCompleted: true
    }
  }

  const partDetails = await Promise.all(
    parts.map(async part => {
      const suppliesRef = collection(
        db,
        'orders',
        orderId,
        'parts',
        part.id,
        'supplies'
      )

      const snapshot = await getDocs(suppliesRef)

      const supplies = snapshot.docs.map(document => ({
        id: document.id,
        ...document.data()
      }))

      const qtyOrder = Number(part.qtyOrder || 0)
      const totalSupply = supplies.reduce((total, supply) => {
        return total + Number(supply.qtySupply || 0)
      }, 0)

      return {
        qtyOrder,
        totalSupply,
        status: getPartStatus(qtyOrder, totalSupply),
        arrivalDate: getLatestArrivalDate(qtyOrder, supplies)
      }
    })
  )

  const allPartsArrived = partDetails.every(
    part => part.totalSupply >= part.qtyOrder
  )

  if (!allPartsArrived) {
    return {
      status: 'ON ORDER',
      fullArrivalDate: null,
      noShowDate: null,
      isCompleted: false,
      parts: partDetails
    }
  }

  const fullArrivalDate = partDetails.reduce(
    (latest, part) => {
      if (!part.arrivalDate) return latest

      if (!latest || part.arrivalDate > latest) {
        return part.arrivalDate
      }

      return latest
    },
    null
  )

  if (orderData.tanggalBooking) {
    return {
      status: 'BOOKING',
      fullArrivalDate,
      noShowDate: null,
      isCompleted: false,
      parts: partDetails
    }
  }

  const noShowDate = fullArrivalDate
    ? addDays(fullArrivalDate, NO_SHOW_DAYS)
    : null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (noShowDate && today >= noShowDate) {
    return {
      status: 'NO SHOW',
      fullArrivalDate,
      noShowDate,
      isCompleted: false,
      parts: partDetails
    }
  }

  return {
    status: 'PART ARRIVAL',
    fullArrivalDate,
    noShowDate,
    isCompleted: false,
    parts: partDetails
  }
}
