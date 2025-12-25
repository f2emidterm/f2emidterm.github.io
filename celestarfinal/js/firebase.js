// ============================================
//  1. 引入 Firebase 功能 (使用統一版本)
// ============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ============================================
//  2. 你的設定 (這裡只能出現一次)
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
//  3. 初始化與匯出
// ============================================

// 啟動 Firebase
const app = initializeApp(firebaseConfig);

// 建立功能變數
const auth = getAuth(app);
const db = getFirestore(app);

// 將變數交出去給其他檔案使用
export { auth, db };
