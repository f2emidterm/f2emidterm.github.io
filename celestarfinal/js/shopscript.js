// js/main.js

// ===========================================
// 1. 引入 Firebase
// ===========================================
import { db } from './firebase.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ===========================================
// 2. 全域變數 & 設定
// ===========================================
let products = []; // 變成空陣列，等待 Firebase 填入
let currentPage = 1;
let currentCategory = "all";

// 判斷每頁顯示數量 (手機 10 筆，電腦 16 筆)
function getPerPage() {
    return window.innerWidth <= 600 ? 10 : 16;
}

// ===========================================
// 3. 從 Firebase 抓資料
// ===========================================
async function fetchProducts() {
    const grid = document.querySelector(".products");
    if (!grid) return;

    // 顯示 Loading 效果
    grid.innerHTML = '<div style="width:100%;text-align:center;padding:20px;">Loading...</div>';

    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        products = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            products.push({
                ...data,
                id: doc.id
            });
        });

        // 排序 (依據 id)
        products.sort((a, b) => a.id - b.id);
        console.log("Firebase 商品載入成功:", products);

        // 資料抓完後，執行渲染
        renderProducts();

    } catch (error) {
        console.error("讀取失敗:", error);
        grid.innerHTML = '<div style="color:red;text-align:center;">Failed to load products.</div>';
    }
}

// ===========================================
// 4. 渲染邏輯 (保留你的分頁與補位功能)
// ===========================================
function renderProducts() {
    const grid = document.querySelector(".products");
    if (!grid) return;

    grid.innerHTML = "";

    // 1. 篩選
    const filtered =
        currentCategory === "all"
            ? products
            : products.filter((p) => p.category === currentCategory);

    // 2. 切分頁面
    const perPage = getPerPage();
    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    const pageItems = filtered.slice(start, end);

    // 3. 如果沒商品
    if (pageItems.length === 0) {
        const noDiv = document.createElement("div");
        noDiv.className = "no-products";
        noDiv.textContent = "No products found.";
        grid.appendChild(noDiv);
        return;
    }

    // 4. 產生商品卡片
    pageItems.forEach((p) => {
        const card = document.createElement("div");
        card.className = "product-card";
        const imgSrc = p.img ? p.img : "https://via.placeholder.com/200/cccccc/808080?text=No+Image";
        
        // 處理價格 (加上 $ 符號)
        let displayPrice = p.price;
        if (!String(displayPrice).includes("$")) {
            displayPrice = `$${displayPrice}`;
        }

        card.innerHTML = `
          <a href="product.html?id=${p.id}">
            <div class="product-img">
              <img src="${imgSrc}" alt="${p.name}">
            </div>
            <div class="product-name">${p.name}</div>
            <div class="product-price">${displayPrice}</div>
          </a>
        `;
        grid.appendChild(card);
    });

    // 5. 補位機制 (Fillers - 保留你的功能)
    const fillCount = perPage - pageItems.length;
    // 只要有缺口就補
    if (fillCount > 0) { 
        for (let i = 0; i < fillCount; i++) {
            const card = document.createElement("div");
            card.className = "product-card";
            // 這裡設定為裝飾用的空白卡片
            card.innerHTML = `
              <div class="product-img" style="background-color:#f0f0f0;"></div>
              <div class="product-name" style="color:#ddd;">PRODUCT NAME</div>
              <div class="product-price" style="color:#ddd;">$0</div>
            `;
            grid.appendChild(card);
        }
    }
    
    // 更新分頁按鈕顯示狀態 (例如 highlight 當前頁碼)
    updatePaginationUI();
}

// 更新分頁按鈕的 active 樣式
// 更新分頁按鈕的 active 樣式
// js/main.js 的 updatePaginationUI 函式

function updatePaginationUI() {
    console.log("正在更新分頁 UI，目前頁碼:", currentPage);

    // 1. 抓取分頁容器 (確保你的 HTML 外層有 class="pagination")
    const container = document.querySelector(".pagination");
    if (!container) {
        console.error("找不到 .pagination 區塊，請檢查 HTML class");
        return;
    }

    // 2. 抓取容器內「所有的」子元素 (不管是 span, a, div, button 都可以)
    const allBtns = container.children;

    // 3. 跑迴圈檢查每一個按鈕
    for (let btn of allBtns) {
        // A. 無論如何，先把 active 移除 (重置狀態)
        btn.classList.remove("active");

        // B. 比對 ID (這是最精準的方法)
        // 邏輯：如果這個按鈕的 ID 等於 "page" + "當前頁碼" (例如 page1, page2)
        if (btn.id === ("page" + currentPage)) {
            console.log("找到當前頁面按鈕，加上 active:", btn);
            btn.classList.add("active");
        }
    }
}

// ===========================================
// 5. 事件監聽 (Filters & Pagination)
// ===========================================

// 分類按鈕
document.querySelectorAll(".filters button").forEach((btn) => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".filters button").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        currentCategory = btn.dataset.category;
        currentPage = 1;
        renderProducts(); // 資料已經在本地了，直接 render 即可
    });
});

// 分頁按鈕 - 這裡沿用你的 ID 邏輯
const btnPage1 = document.getElementById("page1");
const btnPage2 = document.getElementById("page2");
const btnPrev = document.getElementById("prev");
const btnNext = document.getElementById("next");

if (btnPage1) {
    btnPage1.addEventListener("click", () => {
        currentPage = 1;
        renderProducts();
    });
}
if (btnPage2) {
    btnPage2.addEventListener("click", () => {
        currentPage = 2;
        renderProducts();
    });
}
if (btnPrev) {
    btnPrev.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            renderProducts();
        }
    });
}
if (btnNext) {
    btnNext.addEventListener("click", () => {
        if (currentPage < 2) { // 注意：如果你的商品超過 2 頁，這裡可能要改成動態判斷
            currentPage++;
            renderProducts();
        }
    });
}

// 視窗縮放重新計算 (因為 perPage 會變)
window.addEventListener("resize", () => {
    currentPage = 1;
    renderProducts();
});


// ===========================================
// 6. 啟動程式
// ===========================================
document.addEventListener("DOMContentLoaded", () => {
    // 這裡改呼叫 fetchProducts 來啟動 Firebase
    fetchProducts();
});

// 自動回到頂部 (保留)
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
window.onbeforeunload = function () {
    window.scrollTo(0, 0);
};


