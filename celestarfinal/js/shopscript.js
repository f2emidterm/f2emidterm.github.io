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
// 4. 渲染邏輯 (核心功能)
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
        return; // 這裡 return 後，就不會執行下面的卡片生成，但還是要更新頁碼狀態嗎？通常沒商品時不用管頁碼
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
    
    // 6. 🔥更新分頁按鈕的「樣式」 (只做視覺更新，不跑邏輯)
    updatePaginationVisuals();
}

// ===========================================
// 5. 更新分頁樣式 (純視覺)
// ===========================================
function updatePaginationVisuals() {
    // 移除所有 active
    const p1 = document.getElementById("page1");
    const p2 = document.getElementById("page2");
    
    if (p1) p1.classList.remove("active");
    if (p2) p2.classList.remove("active");

    // 加上當前的 active
    const currentBtn = document.getElementById(`page${currentPage}`);
    if (currentBtn) {
        currentBtn.classList.add("active");
    }
}

// ===========================================
// 6. 事件監聽 (全域只執行一次！)
// ===========================================

// --- 分類按鈕 ---
document.querySelectorAll(".filters button").forEach((btn) => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".filters button").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        currentCategory = btn.dataset.category;
        currentPage = 1;
        renderProducts();
    });
});

// --- 分頁按鈕 (必須寫在 renderProducts 外面) ---
const btnPage1 = document.getElementById("page1");
const btnPage2 = document.getElementById("page2");
const btnPrev = document.getElementById("prev");
const btnNext = document.getElementById("next");

if (btnPage1) {
    btnPage1.addEventListener("click", () => {
        if (currentPage !== 1) {
            currentPage = 1;
            renderProducts();
        }
    });
}

if (btnPage2) {
    btnPage2.addEventListener("click", () => {
        if (currentPage !== 2) {
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

// --- 視窗縮放 ---
window.addEventListener("resize", () => {
    // 為了避免頻繁觸發，這裡通常會建議只重置邏輯
    renderProducts();
});


// ===========================================
// 7. 啟動程式
// ===========================================
document.addEventListener("DOMContentLoaded", () => {
    fetchProducts();
});

// 自動回到頂部
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
window.onbeforeunload = function () {
    window.scrollTo(0, 0);
};

