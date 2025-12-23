// js/shopscript.js (或是 js/main.js，請確認檔名與 HTML 一致)

// ===========================================
// 1. 引入 Firebase
// ===========================================
import { db } from './firebase.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ===========================================
// 2. 全域變數 & 設定
// ===========================================
let products = []; 
let currentPage = 1;
let currentCategory = "all";

// 判斷每頁顯示數量
function getPerPage() {
    return window.innerWidth <= 600 ? 10 : 16;
}

// ===========================================
// 3. 從 Firebase 抓資料
// ===========================================
async function fetchProducts() {
    const grid = document.querySelector(".products");
    if (!grid) return;

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

        // 排序
        products.sort((a, b) => a.id - b.id);
        console.log("Firebase 商品載入成功:", products);

        renderProducts();

    } catch (error) {
        console.error("讀取失敗:", error);
        grid.innerHTML = '<div style="color:red;text-align:center;">Failed to load products.</div>';
    }
}

// ===========================================
// 4. 渲染邏輯
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

    // 5. 補位機制
    const fillCount = perPage - pageItems.length;
    if (fillCount > 0) { 
        for (let i = 0; i < fillCount; i++) {
            const card = document.createElement("div");
            card.className = "product-card";
            card.innerHTML = `
              <div class="product-img" style="background-color:#f0f0f0;"></div>
              <div class="product-name" style="color:#ddd;">PRODUCT NAME</div>
              <div class="product-price" style="color:#ddd;">$0</div>
            `;
            grid.appendChild(card);
        }
    }
    
    // 🔥 重要修正：渲染完之後，呼叫更新 UI
    updatePaginationUI();
}

// ===========================================
// 🔥 重點修改區域：更新分頁樣式
// ===========================================
function updatePaginationUI() {
    // 1. 暴力清除所有 active
    // 使用 getElementById 確保一定抓得到
    const p1 = document.getElementById("page1");
    const p2 = document.getElementById("page2");

    if (p1) p1.classList.remove("active");
    if (p2) p2.classList.remove("active");

    // 2. 針對當前頁面加上 active
    const currentBtn = document.getElementById(`page${currentPage}`);
    if (currentBtn) {
        currentBtn.classList.add("active");
    }

    // ❌ 絕對不能在這裡呼叫 renderProducts()，否則會無限迴圈！
}

// ===========================================
// 5. 事件監聽
// ===========================================

// 分類按鈕
document.querySelectorAll(".filters button").forEach((btn) => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".filters button").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        currentCategory = btn.dataset.category;
        currentPage = 1;
        renderProducts();
    });
});

// 分頁按鈕事件
const btnPage1 = document.getElementById("page1");
const btnPage2 = document.getElementById("page2");
const btnPrev = document.getElementById("prev");
const btnNext = document.getElementById("next");

if (btnPage1) {
    btnPage1.addEventListener("click", () => {
        if (currentPage !== 1) { // 加個判斷，如果已經是第1頁就不用重跑
            currentPage = 1;
            renderProducts();
        }
    });
}

if (btnPage2) {
    btnPage2.addEventListener("click", () => {
        if (currentPage !== 2) { // 加個判斷
            currentPage = 2;
            renderProducts();
        }
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
        if (currentPage < 2) {
            currentPage++;
            renderProducts();
        }
    });
}

window.addEventListener("resize", () => {
    currentPage = 1;
    renderProducts();
});

// ===========================================
// 6. 啟動程式
// ===========================================
document.addEventListener("DOMContentLoaded", () => {
    fetchProducts();
});

// 捲動相關設定
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
window.onbeforeunload = function () {
    window.scrollTo(0, 0);
};
