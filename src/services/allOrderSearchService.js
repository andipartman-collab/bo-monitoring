import {
  collection,
  getDocs,
  orderBy,
  query
} from 'firebase/firestore'

import { db } from './firebase.js'


export async function searchAllOrders(searchTerm = '') {
  const term = String(searchTerm || '').trim().toUpperCase()

  const ordersSnapshot = await getDocs(
    query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc')
    )
  )

  const orders = ordersSnapshot.docs.map(document => ({
    id: document.id,
    ...document.data()
  }))

  if (!term) {
    return orders
  }

  return orders.filter(order => {
    return [
      order.noWo,
      order.sa,
      order.customer,
      order.noPolisi
    ].some(value => {
      return String(value || '')
        .toUpperCase()
        .includes(term)
    })
  })
}
