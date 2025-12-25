// ============================================
//  1. 引入你現有的 firebase.js (只有 db)
// ============================================
import { db } from './firebase.js';

// ============================================
//  2. 只引入 Firestore 功能 (完全不用 Auth)
// ============================================
import { 
    doc, 
    getDoc, 
    setDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ============================================
//  UI 元素
// ============================================
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('emailInput'); 
// 這裡雖然叫 emailInput，但在 HTML 裡你可以當作 "Username" 輸入框
// 建議去 HTML 把 type="email" 改成 type="text" 方便輸入

const errorMsg = document.getElementById('error-msg');
const loginSection = document.getElementById('login-section');
const profileSection = document.getElementById('profile-section');
const userEmailDisplay = document.getElementById('userEmailDisplay');
const logoutBtn = document.getElementById('logoutBtn');
const submitBtn = loginForm ? loginForm.querySelector('button') : null;

// ============================================
//  ★ 初始化：檢查 LocalStorage (記住登入狀態)
// ============================================
document.addEventListener("DOMContentLoaded", () => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
        showProfile(savedUser);
    } else {
        showLogin();
    }
});

// ============================================
//  ★ 核心邏輯：查詢或建立使用者
// ============================================
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = emailInput.value.trim();

        if (!username) {
            errorMsg.innerText = "請輸入名字";
            return;
        }

        // UI 鎖定
        const originalBtnText = submitBtn.innerText;
        submitBtn.innerText = "查詢中...";
        submitBtn.disabled = true;
        errorMsg.innerText = "";

        try {
            // 1. 設定文件參照：把「使用者名字」直接當作 ID
            // collection: "users", documentId: username
            const userDocRef = doc(db, "users", username);
            
            // 2. 去資料庫讀讀看
            const docSnap = await getDoc(userDocRef);

            if (docSnap.exists()) {
                // --- A. 舊用戶 (資料存在) ---
                console.log("歡迎回來:", docSnap.data());
                alert(`歡迎回來，${username}！`);
            } else {
                // --- B. 新用戶 (資料不存在 -> 寫入) ---
                console.log("新用戶，建立資料...");
                await setDoc(userDocRef, {
                    username: username,
                    createdAt: serverTimestamp(),
                    role: "member",
                    loginCount: 1
                });
                alert(`註冊成功！你好，${username}！`);
            }

            // 3. 登入成功處理
            // 把名字存在瀏覽器裡，這樣重新整理才不會登出
            localStorage.setItem("currentUser", username);
            
            showProfile(username);
            resetButton(originalBtnText);

        } catch (error) {
            console.error("資料庫錯誤:", error);
            errorMsg.innerText = "連線錯誤，請稍後再試";
            resetButton(originalBtnText);
        }
    });
}

// ============================================
//  登出功能
// ============================================
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        // 清除 LocalStorage
        localStorage.removeItem("currentUser");
        alert("已登出");
        showLogin();
    });
}

// ============================================
//  畫面切換函式
// ============================================
function showProfile(name) {
    if(loginSection) loginSection.style.display = 'none';
    if(profileSection) profileSection.style.display = 'block';
    if(userEmailDisplay) userEmailDisplay.innerText = "Hi, " + name;
}

function showLogin() {
    if(loginSection) loginSection.style.display = 'block';
    if(profileSection) profileSection.style.display = 'none';
    if(emailInput) emailInput.value = '';
}

function resetButton(text) {
    if (submitBtn) {
        submitBtn.innerText = text;
        submitBtn.disabled = false;
    }
}
