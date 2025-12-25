// ============================================
//  1. 改成「純載入」寫法 (Side-effect import)
//  注意：前面沒有 'import firebase from'，只有 'import'
// ============================================
import "https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js";
import "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js";
import "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js";

// ============================================
//  2. 你的設定
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyBp1JpKRDAi0aJ-0-jlwyqP9uPQbbxzdOA",
    authDomain: "f2efinal-9e6f5.firebaseapp.com",
    projectId: "f2efinal-9e6f5",
    storageBucket: "f2efinal-9e6f5.firebasestorage.app",
    messagingSenderId: "188709687038",
    appId: "1:188709687038:web:175b00ef902418a33e5faf"
};

// ============================================
//  3. 初始化
//  因為改用 compat 版，firebase 會自動變成一個全域變數
// ============================================

// 防止重複初始化的保護機制
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// ============================================
//  4. 建立變數並匯出 (關鍵步驟)
// ============================================
const auth = firebase.auth();
const db = firebase.firestore();

// 把這兩個交出去，這樣 login.js 和 main.js 都能拿到舊版功能的變數
export { auth, db };
