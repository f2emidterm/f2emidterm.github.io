// js/login.js

// ============================================
//  1. 引入 Firebase 設定
// ============================================
import { db } from './firebase.js';

// ============================================
//  2. 引入 Firestore 功能 (使用 Base64 不需要 Storage)
// ============================================
import { 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    serverTimestamp,
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ============================================
//  UI 元素變數
// ============================================
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('emailInput'); 
const errorMsg = document.getElementById('error-msg');
const loginSection = document.getElementById('login-section');
const profileSection = document.getElementById('profile-section');
const userEmailDisplay = document.getElementById('userEmailDisplay');
const logoutBtn = document.getElementById('logoutBtn');
const submitBtn = loginForm ? loginForm.querySelector('button') : null;

// 歷史訂單相關
const historyBtn = document.getElementById('historyBtn');
const historyModal = document.getElementById('historyModal');
const closeModal = document.querySelector('.close-modal');
const historyList = document.getElementById('historyList');

// ★ 頭像上傳相關
const avatarContainer = document.getElementById('avatarContainer');
const uploadInput = document.getElementById('uploadInput');
const userAvatar = document.getElementById('userAvatar');
const defaultIcon = document.getElementById('defaultIcon');
const uploadLoading = document.getElementById('uploadLoading');

// ============================================
//  初始化：檢查登入狀態
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
//  登入功能
// ============================================
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = emailInput.value.trim();
        if (!username) {
            errorMsg.innerText = "請輸入名字";
            return;
        }

        const originalBtnText = submitBtn.innerText;
        submitBtn.innerText = "查詢中...";
        submitBtn.disabled = true;
        errorMsg.innerText = "";

        try {
            const userDocRef = doc(db, "users", username);
            const docSnap = await getDoc(userDocRef);

            if (docSnap.exists()) {
                alert(`歡迎回來，${username}！`);
            } else {
                // 新用戶建立
                await setDoc(userDocRef, {
                    username: username,
                    createdAt: serverTimestamp(),
                    role: "member",
                    loginCount: 1,
                    photoURL: "" 
                });
                alert(`註冊成功！你好，${username}！`);
            }

            localStorage.setItem("currentUser", username);
            showProfile(username);
            resetButton(originalBtnText);

        } catch (error) {
            console.error("Login Error:", error);
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
        localStorage.removeItem("currentUser");
        alert("已登出");
        showLogin();
    });
}

// ============================================
//  ★ 頭像上傳 (Base64 方法)
// ============================================
if (avatarContainer && uploadInput) {
    // 點擊圓圈 -> 觸發選檔
    avatarContainer.addEventListener('click', () => {
        uploadInput.click();
    });

    // 選檔後處理
    uploadInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 限制 800KB (防止 Firestore 爆掉)
        if (file.size > 800 * 1024) {
            alert("圖片太大了！請選一張小於 800KB 的圖片><");
            return;
        }

        const currentUser = localStorage.getItem("currentUser");
        if (!currentUser) return;

        // 顯示 Loading
        if(uploadLoading) uploadLoading.style.display = "flex";

        const reader = new FileReader();
        
        // 當讀取完成時
        reader.onload = async function(event) {
            const base64String = event.target.result;

            try {
                // 存入 Firestore
                const userDocRef = doc(db, "users", currentUser);
                await updateDoc(userDocRef, {
                    photoURL: base64String
                });

                // 更新畫面
                updateAvatarView(base64String);
                console.log("頭像更新成功");

            } catch (error) {
                console.error("Upload Error:", error);
                alert("上傳失敗，請稍後再試");
            } finally {
                if(uploadLoading) uploadLoading.style.display = "none";
                uploadInput.value = ''; 
            }
        };

        // 開始讀取圖片
        reader.readAsDataURL(file);
    });
}

// ============================================
//  歷史訂單 (彈窗功能)
// ============================================
if (historyBtn) {
    historyBtn.addEventListener('click', async () => {
        const currentUser = localStorage.getItem("currentUser");
        if (!currentUser) return;

        historyModal.classList.add('active');
        historyList.innerHTML = '<p style="text-align:center; color:#888;">Loading orders...</p>';

        try {
            const q = query(collection(db, "orders"), where("orderBy", "==", currentUser));
            const querySnapshot = await getDocs(q);

            historyList.innerHTML = "";

            if (querySnapshot.empty) {
                historyList.innerHTML = '<p style="text-align:center; padding:20px;">No orders found.</p>';
                return;
            }

            let orders = [];
            querySnapshot.forEach((doc) => {
                orders.push({ id: doc.id, ...doc.data() });
            });
            
            // 排序：最新的在上面
            orders.sort((a, b) => b.createdAt - a.createdAt);

            orders.forEach(order => {
                let dateStr = "Unknown Date";
                if (order.createdAt && order.createdAt.toDate) {
                    dateStr = order.createdAt.toDate().toLocaleString();
                }

                let itemsHtml = order.items.map(item => 
                    `<div>- ${item.name} x ${item.qty}</div>`
                ).join('');

                const card = document.createElement('div');
                card.className = 'order-card';
                card.innerHTML = `
                    <div class="order-header">
                        <span>${dateStr}</span>
                        <span style="color:${order.status === 'new' ? '#AEAEDE' : '#333'}">
                            ${order.status ? order.status.toUpperCase() : 'COMPLETED'}
                        </span>
                    </div>
                    <div class="order-items">${itemsHtml}</div>
                    <div class="order-total">Total: $${order.totalAmount}</div>
                `;
                historyList.appendChild(card);
            });

        } catch (error) {
            console.error("History Error:", error);
            historyList.innerHTML = '<p style="color:red; text-align:center;">Failed to load history.</p>';
        }
    });
}

// 關閉視窗
if (closeModal) {
    closeModal.addEventListener('click', () => {
        historyModal.classList.remove('active');
    });
}
if (historyModal) {
    historyModal.addEventListener('click', (e) => {
        if (e.target === historyModal) {
            historyModal.classList.remove('active');
        }
    });
}

// ============================================
//  共用函式
// ============================================

// 顯示個人頁面 (含抓取頭像)
async function showProfile(name) {
    if(loginSection) loginSection.style.display = 'none';
    if(profileSection) profileSection.style.display = 'block';
    if(userEmailDisplay) userEmailDisplay.innerText = "Hi, " + name;

    try {
        const userDocRef = doc(db, "users", name);
        const docSnap = await getDoc(userDocRef);
        
        if (docSnap.exists() && docSnap.data().photoURL) {
            updateAvatarView(docSnap.data().photoURL);
        } else {
            updateAvatarView(null);
        }
    } catch (err) {
        console.error("Profile Load Error", err);
    }
}

// 顯示登入頁面
function showLogin() {
    if(loginSection) loginSection.style.display = 'block';
    if(profileSection) profileSection.style.display = 'none';
    if(emailInput) emailInput.value = '';
    
    updateAvatarView(null); // 重置為預設圖示
}

// 切換頭像顯示狀態
function updateAvatarView(src) {
    if (src) {
        // 有圖片：顯示 img，隱藏 icon
        if(userAvatar) {
            userAvatar.src = src;
            userAvatar.style.display = "block";
        }
        if(defaultIcon) defaultIcon.style.display = "none";
    } else {
        // 沒圖片：隱藏 img，顯示 icon
        if(userAvatar) {
            userAvatar.src = "";
            userAvatar.style.display = "none";
        }
        if(defaultIcon) defaultIcon.style.display = "block";
    }
}

function resetButton(text) {
    if (submitBtn) {
        submitBtn.innerText = text;
        submitBtn.disabled = false;
    }
}

