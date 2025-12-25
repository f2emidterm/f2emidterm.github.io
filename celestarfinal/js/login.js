document.addEventListener('DOMContentLoaded', function() {

    // 1. 抓取 HTML 元素
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

    // ============================================
    //  初始化檢查：模擬「記住登入狀態」
    // ============================================
    const savedUser = localStorage.getItem('celestar_user');
    if (savedUser) {
        // 如果 localStorage 裡面有名字，直接顯示會員頁
        showProfile(savedUser);
    } else {
        // 否則顯示登入頁
        showLogin();
    }

    // ============================================
    //  功能 1：處理登入 (Fake Login)
    // ============================================
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault(); // 防止表單真的送出

            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();

            // 簡單驗證：只要格式對 (HTML5 type="email" 會幫忙擋)，且密碼不為空
            if (email && password) {
                
                // 模擬讀取中的延遲感 (0.5秒)
                const originalBtnText = loginForm.querySelector('button').innerText;
                loginForm.querySelector('button').innerText = "Logging in...";
                
                setTimeout(() => {
                    // 1. 儲存假資料到瀏覽器
                    localStorage.setItem('celestar_user', email);
                    
                    // 2. 切換畫面
                    alert("登入成功！(測試模式)");
                    showProfile(email);
                    
                    // 3. 還原按鈕文字 & 清空密碼
                    loginForm.querySelector('button').innerText = originalBtnText;
                    passwordInput.value = ''; 
                    errorMsg.innerText = '';
                    
                }, 500);

            } else {
                errorMsg.innerText = "請輸入有效的帳號與密碼";
            }
        });
    }

    // ============================================
    //  功能 2：處理登出
    // ============================================
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            // 1. 清除 localStorage
            localStorage.removeItem('celestar_user');
            
            // 2. 跳出提示
            alert("已登出");
            
            // 3. 切換回登入頁
            showLogin();
        });
    }

    // ============================================
    //  輔助函式：切換畫面用
    // ============================================
    function showProfile(email) {
        loginSection.style.display = 'none';
        profileSection.style.display = 'block';
        userEmailDisplay.innerText = email;
    }

    function showLogin() {
        loginSection.style.display = 'block';
        profileSection.style.display = 'none';
    }

});
