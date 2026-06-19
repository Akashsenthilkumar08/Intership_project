// ================= FIREBASE IMPORTS =================
import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ================= FIREBASE CONFIG =================
const firebaseConfig = {
  apiKey: "AIzaSyAJwbgx79GDFIQgWK5NRgel2PiPcLhoyjw",
  authDomain: "akash-1c06d.firebaseapp.com",
  projectId: "akash-1c06d",
  storageBucket: "akash-1c06d.firebasestorage.app",
  messagingSenderId: "661817702117",
  appId: "1:661817702117:web:4c2aa4ca9feac8d54a060c",
  measurementId: "G-Z2RG6Q6DZB"
};


// ================= INITIALIZE =================
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

const provider = new GoogleAuthProvider();


// ================= REGISTER =================
window.registerUser = async () => {

  const email =
    document.getElementById("email").value.trim();

  const password =
    document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Please enter Email and Password");
    return;
  }

  try {

    await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    alert("Registration Successful");

    window.location.href = "dashboard.html";

  }
  catch (error) {

    alert(error.message);
    console.log(error);

  }

};


// ================= LOGIN =================
window.loginUser = async () => {

  const email =
    document.getElementById("email").value.trim();

  const password =
    document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Please enter Email and Password");
    return;
  }

  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    alert("Login Successful");

    window.location.href = "dashboard.html";

  }
  catch (error) {

    alert(error.message);
    console.log(error);

  }

};
window.registerUser = function () {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {

            alert("Account created successfully!");

            // 👉 DIRECT REDIRECT TO INDEX.HTML
            window.location.href = "index.html";

        })
        .catch((error) => {
            alert(error.message);
        });
};

// ================= GOOGLE LOGIN =================
window.googleLogin = async () => {

  try {

    const result =
      await signInWithPopup(auth, provider);

    alert(
      "Welcome " + result.user.displayName
    );

    window.location.href = "dashboard.html";

  }
  catch (error) {

    alert(error.message);
    console.log(error);

  }

};


// ================= LOGOUT =================
window.logoutUser = async () => {

  try {

    await signOut(auth);

    window.location.href = "index.html";

  }
  catch (error) {

    alert(error.message);

  }

};


// ================= AUTH STATE =================
onAuthStateChanged(auth, (user) => {

  if (user) {

    console.log("Logged In :", user.email);

  }
  else {

    console.log("User not logged in");

  }

});


// ================= EXPORT =================
export {
  db,
  auth,
  provider,

  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc,

  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
};