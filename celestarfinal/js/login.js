document.addEventListener('DOMContentLoaded', function() {
    
    // 直接呼叫功能就好，Firebase 會自己抓已經啟動的那個實體
    const auth = firebase.auth();
    const db = firebase.firestore();

    // ============================================
    //  1. 抓取 HTML 元素
    // ============================================
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const errorMsg = document.getElementById('error-msg');
    
    // 區塊
    const loginSection = document.getElementById('login-section');
    const profileSection = document.getElementById('profile-section');
    
    // 資料顯示
    const userEmailDisplay = document.getElementById('userEmailDisplay');
    const logoutBtn = document.getElementById('logoutBtn');
    
    const submitBtn = loginForm ? loginForm.querySelector('button') : null;

    // ============================================
    //  ★ 初始化檢查 (監聽登入狀態)
    // ============================================
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log("偵測到已登入：", user.email);
            showProfile(user.email);
        } else {
            showLogin();
        }
    });

    // ============================================
    //  功能 1：處理登入 / 自動註冊
    // ============================================
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault(); 
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();

            if (email && password) {
                const originalBtnText = submitBtn.innerText;
                submitBtn.innerText = "處理中...";
                submitBtn.disabled = true;
                
                // 開始登入
                auth.signInWithEmailAndPassword(email, password)
                    .then(() => {
                        alert("登入成功！");
                        resetButton(originalBtnText);
                    })
                    .catch((error) => {
                        // 沒帳號 -> 自動註冊
                        if (error.code === 'auth/user-not-found') {
                            console.log("帳號不存在，自動註冊...");
                            
                            auth.createUserWithEmailAndPassword(email, password)
                                .then((cred) => {
                                    // 寫入資料庫
                                    return db.collection('users').doc(cred.user.uid).set({
                                        email: email,
                                        createdAt: new Date(),
                                        role: 'member'
                                    });
                                })
                                .then(() => {
                                    alert("註冊並登入成功！");
                                    resetButton(originalBtnText);
                                })
                                .catch((regError) => {
                                    errorMsg.innerText = "註冊失敗: " + regError.message;
                                    resetButton(originalBtnText);
                                });

                        } else if (error.code === 'auth/wrong-password') {
                            errorMsg.innerText = "密碼錯誤！";
                            resetButton(originalBtnText);
                        } else {
                            errorMsg.innerText = error.message;
                            resetButton(originalBtnText);
                        }
                    });
            } else {
                errorMsg.innerText = "請輸入帳號密碼";
            }
        });
    }

    // ============================================
    //  功能 2：登出
    // ============================================
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            auth.signOut().then(() => alert("已登出"));
        });
    }

    // ============================================
    //  輔助函式
    // ============================================
    function showProfile(email) {
        loginSection.style.display = 'none';
        profileSection.style.display = 'block';
        userEmailDisplay.innerText = email;
        if(errorMsg) errorMsg.innerText = '';
    }

    function showLogin() {
        loginSection.style.display = 'block';
        profileSection.style.display = 'none';
        if(emailInput) emailInput.value = '';
        if(passwordInput) passwordInput.value = '';
    }

    function resetButton(text) {
        if (submitBtn) {
            submitBtn.innerText = text;
            submitBtn.disabled = false;
        }
    }
});
