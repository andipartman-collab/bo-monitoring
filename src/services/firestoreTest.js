import {
  collection,
  getDocs
} from 'firebase/firestore'

import {
  db
} from './firebase.js'


export async function testFirestore() {

  try {

    const snapshot =
      await getDocs(
        collection(
          db,
          'orders'
        )
      )

    console.log(
      'FIRESTORE CONNECTED'
    )

    console.log(
      'Jumlah dokumen orders:',
      snapshot.size
    )

    return true

  }
  catch (error) {

    console.error(
      'FIRESTORE ERROR:',
      error
    )

    return false

  }

}