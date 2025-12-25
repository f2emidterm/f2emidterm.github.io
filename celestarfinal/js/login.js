// js/login.js

// 1. ★ 從你的設定檔匯入 auth 和 db
// 注意：路徑 './firebase-config.js' 很重要，同層資料夾要加 ./
import { auth, db } from './firebase-config.js';

// 2. 引入需要的 Firebase 功能函數 (不用 initializeApp 了)
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { 
    doc, 
    setDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ============================================
//  3. 以下邏輯完全不用動，直接複製即可
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

// --- 監聽登入狀態 ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        showProfile(user.email);
    } else {
        showLogin();
    }
});

// --- 登入/註冊邏輯 ---
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
            // 嘗試登入
            await signInWithEmailAndPassword(auth, email, password);
            alert("登入成功！");
            resetButton(originalBtnText);
            
        } catch (error) {
            // 沒帳號 -> 自動註冊
            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                console.log("帳號不存在，自動註冊...");
                
                try {
                    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                    // 寫入資料庫
                    await setDoc(doc(db, "users", userCredential.user.uid), {
                        email: email,
                        createdAt: serverTimestamp(),
                        role: "member"
                    });
                    alert("註冊成功並已登入！");
                    resetButton(originalBtnText);

                } catch (regError) {
                    errorMsg.innerText = "註冊失敗: " + regError.message;
                    resetButton(originalBtnText);
                }

            } else if (error.code === 'auth/wrong-password') {
                errorMsg.innerText = "密碼錯誤！";
                resetButton(originalBtnText);
            } else {
                errorMsg.innerText = error.message;
                resetButton(originalBtnText);
            }
        }
    });
}

// --- 登出 ---
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => alert("已登出"));
    });
}

// --- 輔助函式 ---
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
