// js/firebase.js

// 改用網址引入 (CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBp1JpKRDAi0aJ-0-jlwyqP9uPQbbxzdOA",
    authDomain: "f2efinal-9e6f5.firebaseapp.com",
    projectId: "f2efinal-9e6f5",
    storageBucket: "f2efinal-9e6f5.firebasestorage.app",
    messagingSenderId: "188709687038",
    appId: "1:188709687038:web:175b00ef902418a33e5faf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 重要：一定要 export db，這樣 main.js 才拿得到

export { db };


