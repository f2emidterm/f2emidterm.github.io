// ============================================
//  1. 引入 Firebase 設定
// ============================================
import { db } from './firebase.js';

// ============================================
//  2. 引入 Firestore 功能
//  注意：這裡多加了 collection, query, where, getDocs 用來查訂單
// ============================================
import { 
    doc, 
    getDoc, 
    setDoc, 
    serverTimestamp,
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ============================================
//  UI 元素
// ============================================
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('emailInput'); 
const errorMsg = document.getElementById('error-msg');
const loginSection = document.getElementById('login-section');
const profileSection = document.getElementById('profile-section');
const userEmailDisplay = document.getElementById('userEmailDisplay');
const logoutBtn = document.getElementById('logoutBtn');
const submitBtn = loginForm ? loginForm.querySelector('button') : null;

// ★ 新增：歷史訂單相關元素
const historyBtn = document.getElementById('historyBtn');
const historyModal = document.getElementById('historyModal');
const closeModal = document.querySelector('.close-modal');
const historyList = document.getElementById('historyList');

// ============================================
//  初始化：檢查 LocalStorage
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
//  核心邏輯：查詢或建立使用者 (登入)
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
                console.log("歡迎回來:", docSnap.data());
                alert(`歡迎回來，${username}！`);
            } else {
                console.log("新用戶，建立資料...");
                await setDoc(userDocRef, {
                    username: username,
                    createdAt: serverTimestamp(),
                    role: "member",
                    loginCount: 1
                });
                alert(`註冊成功！你好，${username}！`);
            }

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
        localStorage.removeItem("currentUser");
        alert("已登出");
        showLogin();
    });
}

// ============================================
//  ★ 新增：歷史訂單功能
// ============================================

// 1. 打開視窗並載入資料
if (historyBtn) {
    historyBtn.addEventListener('click', async () => {
        const currentUser = localStorage.getItem("currentUser");
        if (!currentUser) return;

        // 顯示彈窗
        historyModal.classList.add('active');
        historyList.innerHTML = '<p style="text-align:center; color:#888;">Loading orders...</p>';

        try {
            // 建立查詢：找 orders 集合裡，orderBy 欄位等於 currentUser 的資料
            const q = query(collection(db, "orders"), where("orderBy", "==", currentUser));
            const querySnapshot = await getDocs(q);

            // 清空載入文字
            historyList.innerHTML = "";

            if (querySnapshot.empty) {
                historyList.innerHTML = '<p style="text-align:center; padding:20px;">No orders found.</p>';
                return;
            }

            // 把資料轉成陣列並用 JS 排序 (最新的在上面)
            // 因為 Firebase 複合查詢需要索引，這樣寫比較簡單不會報錯
            let orders = [];
            querySnapshot.forEach((doc) => {
                orders.push({ id: doc.id, ...doc.data() });
            });
            
            // 根據 createdAt 倒序排列 (最新的先顯示)
            orders.sort((a, b) => b.createdAt - a.createdAt);

            // 渲染畫面
            orders.forEach(order => {
                // 處理時間格式
                let dateStr = "Unknown Date";
                if (order.createdAt && order.createdAt.toDate) {
                    dateStr = order.createdAt.toDate().toLocaleString();
                }

                // 處理商品列表 HTML
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
                    <div class="order-items">
                        ${itemsHtml}
                    </div>
                    <div class="order-total">
                        Total: $${order.totalAmount}
                    </div>
                `;
                historyList.appendChild(card);
            });

        } catch (error) {
            console.error("讀取訂單失敗:", error);
            historyList.innerHTML = '<p style="color:red; text-align:center;">Failed to load history.</p>';
        }
    });
}

// 2. 關閉視窗 (點 X 或點背景)
if (closeModal) {
    closeModal.addEventListener('click', () => {
        historyModal.classList.remove('active');
    });
}

if (historyModal) {
    historyModal.addEventListener('click', (e) => {
        // 如果點到黑色背景 (不是點到內容框)，就關閉
        if (e.target === historyModal) {
            historyModal.classList.remove('active');
        }
    });
}

// ============================================
//  輔助函式
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

