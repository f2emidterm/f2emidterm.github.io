// js/firebase.js

// 1. 注意：這裡網址後面多了 "-compat"，這是救命關鍵！
import firebase from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js";
import "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js";
import "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js";

// 2. 你的設定
const firebaseConfig = {
    apiKey: "AIzaSyBp1JpKRDAi0aJ-0-jlwyqP9uPQbbxzdOA",
    authDomain: "f2efinal-9e6f5.firebaseapp.com",
    projectId: "f2efinal-9e6f5",
    storageBucket: "f2efinal-9e6f5.firebasestorage.app",
    messagingSenderId: "188709687038",
    appId: "1:188709687038:web:175b00ef902418a33e5faf"
};

// 3. 初始化 (如果還沒初始化過才執行，防止報錯)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// 4. 建立變數 (這種舊版寫法，main.js 最喜歡)
const auth = firebase.auth();
const db = firebase.firestore();

// 5. 匯出給 login.js 用，同時 window.firebase 也能給全域用
export { auth, db };
