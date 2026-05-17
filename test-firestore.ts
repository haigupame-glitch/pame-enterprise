import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const fbConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(fbConfig);
const db = getFirestore(app, fbConfig.firestoreDatabaseId);

async function run() {
  try {
    await setDoc(doc(db, 'appData', 'global'), { test: true });
    console.log('Success');
    process.exit(0);
  } catch (e: any) {
    console.error('Failure:', e.message);
    process.exit(0);
  }
}
run();
