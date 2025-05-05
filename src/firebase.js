/** @format */

// File: firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
	apiKey: 'AIzaSyAMEpszU8B9XDKEZgFixaRFjq2ZVh4cCkQ',
	authDomain: 'wifi-bill-datas.firebaseapp.com',
	projectId: 'wifi-bill-datas',
	storageBucket: 'wifi-bill-datas.firebasestorage.app',
	messagingSenderId: '802991730728',
	appId: '1:802991730728:web:2519b374c815dd852c451d',
	measurementId: 'G-2K2HLPP6ML',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
