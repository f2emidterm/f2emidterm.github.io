document.addEventListener('DOMContentLoaded', function() {

    // ============================================
    //  0. Firebase 設定 (請填入你的)
    // ============================================
    const firebaseConfig = {
        apiKey: "你的_API_KEY",
        authDomain: "你的專案ID.firebaseapp.com",
        projectId: "你的專案ID",
        storageBucket: "你的專案ID.appspot.com",
        messagingSenderId: "...",
        appId: "..."
    };

    // 初始化檢查
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const auth = firebase.auth();
    const db = firebase.firestore();

    // ============================================
    //  1. 抓取元素
    // ============================================
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const errorMsg = document.getElementById('error-msg');
    
    // 區塊與顯示
    const loginSection = document.getElementById('login-section');
    const profileSection = document.getElementById('profile-section');
    const userEmailDisplay = document.getElementById('userEmailDisplay');
    const logoutBtn = document.getElementById('logoutBtn');
    const submitBtn = loginForm ? loginForm.querySelector('button') : null;

    // ============================================
    //  2. 監聽登入狀態 (自動切換畫面)
    // ============================================
    auth.onAuthStateChanged((user) => {
        if (user) {
            // 已登入 -> 顯示會員頁
            console.log("已登入:", user.email);
            showProfile(user.email);
        } else {
            // 未登入 -> 顯示表單
            showLogin();
        }
    });

    // ============================================
    //  3. 「無腦登入」邏輯核心
    // ============================================
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();

            // 基本防呆
            if (!email || !password) {
                errorMsg.innerText = "請輸入帳號密碼";
                return;
            }
            if (password.length < 6) {
                errorMsg.innerText = "Firebase 規定密碼最少要 6 碼喔！";
                return;
            }

            // UI 鎖定
            const originalText = submitBtn.innerText;
            submitBtn.innerText = "處理中...";
            submitBtn.disabled = true;
            errorMsg.innerText = "";

            // ★ 執行無縫登入
            seamlessLogin(email, password, originalText);
        });
    }

    // 這是一個「試圖登入，失敗就自動註冊」的函式
    function seamlessLogin(email, password, btnText) {
        
        // 1. 先試著登入
        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // A. 登入成功 (代表是舊會員)
                console.log("登入成功 (舊會員)");
                resetBtn(btnText);
                // onAuthStateChanged 會自動切換畫面，不用做事
            })
            .catch((error) => {
                // B. 登入失敗 -> 判斷原因
                if (error.code === 'auth/user-not-found') {
                    
                    console.log("帳號不存在，自動執行註冊程序...");
                    // 2. 自動註冊
                    return auth.createUserWithEmailAndPassword(email, password)
                        .then((userCredential) => {
                            // ★ 3. 註冊成功，立刻寫入資料庫
                            const user = userCredential.user;
                            return db.collection('users').doc(user.uid).set({
                                email: email,
                                createdAt: new Date(), // 紀錄建立時間
                                memberLevel: "一般會員" // 預留欄位
                            });
                        })
                        .then(() => {
                            console.log("註冊並寫入資料庫成功");
                            resetBtn(btnText);
                            alert("歡迎新朋友！已自動為您註冊並登入。");
                        });

                } else if (error.code === 'auth/wrong-password') {
                    // C. 帳號存在但密碼錯 (這無法通關，必須擋)
                    resetBtn(btnText);
                    errorMsg.innerText = "這個帳號已經註冊過囉，但密碼不對！";
                } else {
                    // D. 其他錯誤 (格式不對、網路斷線等)
                    resetBtn(btnText);
                    errorMsg.innerText = error.message;
                }
            })
            .catch((regError) => {
                // 這是抓取「自動註冊」過程中的錯誤
                resetBtn(btnText);
                console.error(regError);
                errorMsg.innerText = "註冊發生錯誤: " + regError.message;
            });
    }

    // ============================================
    //  4. 登出
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
    }

    function showLogin() {
        loginSection.style.display = 'block';
        profileSection.style.display = 'none';
        if(emailInput) emailInput.value = '';
        if(passwordInput) passwordInput.value = '';
    }

    function resetBtn(text) {
        if(submitBtn) {
            submitBtn.innerText = text;
            submitBtn.disabled = false;
        }
    }
});
