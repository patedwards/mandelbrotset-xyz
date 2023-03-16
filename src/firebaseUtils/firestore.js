import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  query,
  updateDoc,
  connectFirestoreEmulator
} from "firebase/firestore";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";


// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB_0NdmEVYzCSR86bgMsjOGPD_C-tGoK3Y",
  authDomain: "fractal-exploration-a95be.firebaseapp.com",
  projectId: "fractal-exploration-a95be",
  storageBucket: "fractal-exploration-a95be.appspot.com",
  messagingSenderId: "319399789744",
  appId: "1:319399789744:web:68e217b0abb44562a4a775",
  measurementId: "G-ZD48GYV5RJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const db = getFirestore();
connectFirestoreEmulator(db, 'localhost', 8080);


export const getDocRef = (path) => {
  return doc(db, path)
}

// TODO: consider using Firebase Realtime database for unstructured JSON
export const processFeatureFromDocSnapshot = docSnapshot => {
  const f = docSnapshot.data();
  if (f === undefined) { return null}
  return {
    ...f,
    properties:  { ...f.properties, __fid: docSnapshot.id },
    geometry: JSON.parse(f.geometry)
  };
};

export const getFeatureDocument = async (path, field) => {
  const docRef = doc(db, path);
  const docSnap = await getDoc(docRef);
  if (field) {
    return docSnap.get(field)
  }
  return processFeatureFromDocSnapshot(docSnap);
};



export const streamCollectionToState = (collectionPath, setter, docMap) => {
  const itemsColRef = collection(db, collectionPath);
  const itemsQuery = query(itemsColRef);
  const unsubscribe = onSnapshot(
    itemsQuery,
    querySnapshot => {
      console.log("querySnapshot", querySnapshot.docChanges())
      const results = docMap
        ? querySnapshot.docs.map(docMap)
        : querySnapshot.docs.map(docSnapshot => docSnapshot.data());
      setter(results);
    },
    error => console.log(`stream-collection-${collectionPath}-fail`, error)
  );
  return unsubscribe;
};

export const streamDocumentFieldToState = (documentPath, setter, field) => {
  const itemsDocRef = doc(db, documentPath);
  const itemsQuery = query(itemsDocRef);
  console.log("documentPath", documentPath)
  const unsubscribe = onSnapshot(
    itemsQuery,
    querySnapshot => {
      console.log("setter", documentPath, setter, field)
      setter(querySnapshot.get(field));
    },
    error =>
      console.log(`stream-document-${documentPath}-field-${field}-fail`, error)
  );
  return unsubscribe;
};

export const updateDocument = (fullPath, update) => {
  const [path, field] = fullPath.split(".");
  const docRef = doc(db, path);
  if (field) {
    updateDoc(docRef, update);
  } else {
    updateDoc(docRef, update);
  }
};

export const createDocument = async (path, data) => {
  const docRef = collection(db, path);
  const response = await addDoc(docRef, data);
  return response.id;
};


export const getDocumentField = async (path, field) => {
  const docRef = doc(db, path);
  const docSnap = await getDoc(docRef);
  return field ? docSnap.get(field) : docSnap.data();
};

export const deleteDocuments = (collectionPath, documentIds) => {
  console.log("Deleting", collectionPath, documentIds)
  documentIds.forEach(async docId => {
    const r = await deleteDoc(doc(db, collectionPath, docId));
    console.log(r)
  })
}