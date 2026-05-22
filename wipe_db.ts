import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function wipe() {
  await setDoc(doc(db, 'appStore', 'globalState_967c2d0c'), {
    groups: [],
    members: [],
    collections: [],
    transactions: [],
    loans: [],
    loanRepayments: [],
    resolutions: [],
    notices: [],
    activities: [],
    feedbacks: [],
    updatedAt: new Date().toISOString()
  });
  console.log('Database wiped!');
}

wipe();
