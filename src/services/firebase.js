import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyBTE0uEFapv42uGpSoY5TIFwMojK0PZuuc',
  authDomain: 'bo-monitoring-b0889.firebaseapp.com',
  projectId: 'bo-monitoring-b0889',
  storageBucket: 'bo-monitoring-b0889.firebasestorage.app',
  messagingSenderId: '912967425628',
  appId: '1:912967425628:web:ebddcac2782473deee5099'
}

const firebaseApp = initializeApp(firebaseConfig)

export const db = getFirestore(firebaseApp)

export default firebaseApp