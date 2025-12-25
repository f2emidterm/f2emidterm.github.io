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

// 1. 引入必要的功能
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
// ★ 缺漏點 1：你必須引入 getAuth 和 getFirestore 才能建立變數
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// 2. 你的設定
const firebaseConfig = {
    apiKey: "AIzaSyBp1JpKRDAi0aJ-0-jlwyqP9uPQbbxzdOA",
    authDomain: "f2efinal-9e6f5.firebaseapp.com",
    projectId: "f2efinal-9e6f5",
    storageBucket: "f2efinal-9e6f5.firebasestorage.app",
    messagingSenderId: "188709687038",
    appId: "1:188709687038:web:175b00ef902418a33e5faf"
};


// 3. 初始化 App
const app = initializeApp(firebaseConfig);

// ==========================================
//  ★ 缺漏點 2：這裡就是報錯的原因！
//  你必須先定義好 const auth = ...
//  才能在最後面 export 它
// ==========================================
const auth = getAuth(app);      // 建立驗證物件
const db = getFirestore(app);   // 建立資料庫物件

// 4. 匯出 (現在 auth 和 db 都有定義了，這行就不會報錯了)
export { auth, db };
    messagingSenderId: "188709687038",
    appId: "1:188709687038:web:175b00ef902418a33e5faf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 重要：一定要 export db，這樣 main.js 才拿得到

export { auth,db };


