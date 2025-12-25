// js/login.js

// ============================================
//  1. 引入 Firebase 設定
// ============================================
import { db } from './firebase.js';

// ============================================
//  2. 引入 Firestore 功能
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
const passwordInput = document.getElementById('passwordInput');
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

// ★ 頭像相關元素
const avatarContainer = document.getElementById('avatarContainer');
const userAvatar = document.getElementById('userAvatar');
const defaultIcon = document.getElementById('defaultIcon');
// 上傳相關
const uploadInput = document.getElementById('uploadInput');
const uploadLoading = document.getElementById('uploadLoading');
const editAvatarBtn = document.getElementById('editAvatarBtn'); // 新增：編輯按鈕
// 放大檢視相關
const imageZoomModal = document.getElementById('imageZoomModal'); // 新增：放大視窗
const zoomedImage = document.getElementById('zoomedImage');     // 新增：放大後的圖片
const closeZoom = document.querySelector('.close-zoom');        // 新增：關閉放大

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
            errorMsg.innerText = "請輸入email";
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
//  ★ 頭像功能 (修改重點)
// ============================================

// --- 功能 A: 編輯/上傳頭像 ---
if (editAvatarBtn && uploadInput) {
    // 1. 點擊「小鉛筆按鈕」 -> 觸發選檔
    editAvatarBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // 防止鉛筆本身的點擊傳出去
        uploadInput.click(); // 程式觸發 input 點擊
    });

    // ★★★ 關鍵修正：這裡加這一段！ ★★★
    // 當程式點擊 input 時，阻止這個點擊事件往上傳給 avatarContainer
    uploadInput.addEventListener('click', (e) => {
        e.stopPropagation(); 
    });

    // 2. 選檔後處理 (Base64 上傳)
    uploadInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 800 * 1024) {
            alert("圖片太大了！請選一張小於 800KB 的圖片><");
            return;
        }

        const currentUser = localStorage.getItem("currentUser");
        if (!currentUser) return;

        if(uploadLoading) uploadLoading.style.display = "flex";

        const reader = new FileReader();
        reader.onload = async function(event) {
            const base64String = event.target.result;
            try {
                const userDocRef = doc(db, "users", currentUser);
                await updateDoc(userDocRef, {
                    photoURL: base64String
                });
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
        reader.readAsDataURL(file);
    });
}

// --- 功能 B: 點擊頭像放大檢視 (★ 這裡有重要修改) ---
if (avatarContainer && imageZoomModal && zoomedImage) {
    // 注意這裡多加了 (e) 參數，用來檢查點擊事件
    avatarContainer.addEventListener('click', (e) => {
        
        // ★ 關鍵修改：檢查點擊的目標是否來自於「編輯按鈕」
        // e.target.closest('#editAvatarBtn') 會檢查點到的元素 (或其祖先) 是不是編輯按鈕
        if (e.target.closest('#editAvatarBtn')) {
            // 如果是點到鉛筆，就什麼都不做，直接結束這個函式
            return;
        }

        // 只有在「有顯示圖片」的時候才觸發放大
        if (userAvatar.style.display !== 'none' && userAvatar.src) {
            zoomedImage.src = userAvatar.src; // 把大圖的來源設為目前的頭像
            imageZoomModal.classList.add('active'); // 顯示視窗
        }
    });
}

// --- 功能 C: 關閉放大視窗 ---
if (closeZoom) {
    closeZoom.addEventListener('click', () => {
        imageZoomModal.classList.remove('active');
    });
}
if (imageZoomModal) {
    imageZoomModal.addEventListener('click', (e) => {
        // 點擊背景或圖片本身都可以關閉
        if (e.target === imageZoomModal || e.target === zoomedImage) {
            imageZoomModal.classList.remove('active');
        }
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

// 關閉訂單視窗
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

function showLogin() {
    if(loginSection) loginSection.style.display = 'block';
    if(profileSection) profileSection.style.display = 'none';
    if(emailInput) emailInput.value = '';
    if(passwordInput) passwordInput.value = '';
    
    updateAvatarView(null);
}

function updateAvatarView(src) {
    if (src) {
        if(userAvatar) {
            userAvatar.src = src;
            userAvatar.style.display = "block";
        }
        if(defaultIcon) defaultIcon.style.display = "none";
        // 有圖片時，容器游標變放大鏡
        if(avatarContainer) avatarContainer.style.cursor = "zoom-in";
    } else {
        if(userAvatar) {
            userAvatar.src = "";
            userAvatar.style.display = "none";
        }
        if(defaultIcon) defaultIcon.style.display = "block";
        // 沒圖片時，容器游標變回預設
        if(avatarContainer) avatarContainer.style.cursor = "default";
    }
}

function resetButton(text) {
    if (submitBtn) {
        submitBtn.innerText = text;
        submitBtn.disabled = false;
    }
}


