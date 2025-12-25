// ============================================
//  1. 引入你現有的 firebase.js (只有 db)
// ============================================
import { db } from './firebase.js';

// ============================================
//  2. 引入 Auth 和 Firestore 的功能
//  (版本配合你 main.js 用的 10.7.1)
// ============================================
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { 
    doc, 
    setDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ============================================
//  ★ 關鍵：就地建立 auth 物件
//  原理：既然 db 已經連上 App 了，我們就問 db 它的 App 是誰
// ============================================
const app = db.app; 
const auth = getAuth(app); // 這樣就有 auth 可以用了！

// ============================================
//  以下是登入/註冊/登出邏輯 (標準流程)
// ============================================

const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const errorMsg = document.getElementById('error-msg');
const loginSection = document.getElementById('login-section');
const profileSection = document.getElementById('profile-section');
const userEmailDisplay = document.getElementById('userEmailDisplay');
const logoutBtn = document.getElementById('logoutBtn');
const submitBtn = loginForm ? loginForm.querySelector('button') : null;

// --- 1. 監聽登入狀態 ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        showProfile(user.email);
    } else {
        showLogin();
    }
});

// --- 2. 表單提交 (登入或自動註冊) ---
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            errorMsg.innerText = "請輸入帳號密碼";
            return;
        }

        const originalBtnText = submitBtn.innerText;
        submitBtn.innerText = "處理中...";
        submitBtn.disabled = true;
        errorMsg.innerText = "";

        try {
            // A. 先嘗試直接登入
            await signInWithEmailAndPassword(auth, email, password);
            alert("登入成功！");
            resetButton(originalBtnText);
            
        } catch (error) {
            // B. 如果錯誤是「帳號不存在」，則轉為自動註冊
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                console.log("帳號不存在，自動註冊...");
                
                try {
                    // 註冊帳號
                    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                    
                    // 寫入使用者資料到 Firestore (使用匯入的 db)
                    await setDoc(doc(db, "users", userCredential.user.uid), {
                        email: email,
                        createdAt: serverTimestamp(),
                        role: "member"
                    });

                    alert("註冊成功並已登入！");
                    resetButton(originalBtnText);

                } catch (regError) {
                    console.error("註冊失敗", regError);
                    errorMsg.innerText = "註冊失敗: " + regError.message;
                    resetButton(originalBtnText);
                }

            } else if (error.code === 'auth/wrong-password') {
                errorMsg.innerText = "密碼錯誤！";
                resetButton(originalBtnText);
            } else {
                console.error("登入錯誤", error);
                errorMsg.innerText = error.message;
                resetButton(originalBtnText);
            }
        }
    });
}

// --- 3. 登出功能 ---
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => alert("已登出"));
    });
}

// --- 4. 畫面切換 ---
function showProfile(email) {
    if(loginSection) loginSection.style.display = 'none';
    if(profileSection) profileSection.style.display = 'block';
    if(userEmailDisplay) userEmailDisplay.innerText = email;
}

function showLogin() {
    if(loginSection) loginSection.style.display = 'block';
    if(profileSection) profileSection.style.display = 'none';
    if(emailInput) emailInput.value = '';
    if(passwordInput) passwordInput.value = '';
}

function resetButton(text) {
    if (submitBtn) {
        submitBtn.innerText = text;
        submitBtn.disabled = false;
    }
}
