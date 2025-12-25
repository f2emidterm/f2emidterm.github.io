// ===========================================
// js/searchscript.js (除錯增強版)
// ===========================================
import { db } from './firebase.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 全域變數
let products = []; 
let currentPage = 1;

// 1. 取得網址上的搜尋關鍵字
const params = new URLSearchParams(window.location.search);
// 轉小寫 + 去除前後空白，確保精準度
const searchQuery = params.get("q") ? params.get("q").toLowerCase().trim() : "";

// 更新標題
const resultTitle = document.getElementById("searchQueryDisplay");
if(resultTitle) {
    resultTitle.textContent = searchQuery 
        ? `Results for keyword: "${params.get("q")}"`
        : "Showing all products";
}

function getPerPage() {
    return window.innerWidth <= 600 ? 10 : 16;
}

// ===========================================
// 2. 從 Firebase 抓資料
// ===========================================
async function fetchProducts() {
    const grid = document.querySelector(".products");
    if (!grid) return;

    grid.innerHTML = '<div style="width:100%;text-align:center;padding:20px;">Loading results...</div>';

    try {
        console.log("正在連接 Firebase...");
        const querySnapshot = await getDocs(collection(db, "products"));
        products = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // ★ 除錯點 1：看看這裡印出來的物件，有沒有 'name' 這個屬性？
            // console.log("讀取到商品:", data); 
            
            products.push({
                ...data,
                id: doc.id
            });
        });

        console.log(`總共下載了 ${products.length} 個商品`);
        renderProducts();

    } catch (error) {
        console.error("讀取失敗:", error);
        grid.innerHTML = '<div style="color:red;text-align:center;">Failed to load products.</div>';
    }
}

// ===========================================
// 3. 渲染邏輯 (關鍵修改)
// ===========================================
function renderProducts() {
    updatePaginationVisuals();
    const grid = document.querySelector(".products");
    grid.innerHTML = "";

    console.log("目前搜尋關鍵字:", searchQuery);

    // ★ 關鍵過濾邏輯
    const filtered = products.filter((p) => {
        // 如果沒有輸入關鍵字，就顯示全部
        if (!searchQuery) return true; 

        // 1. 取得名稱 (防呆：如果沒有 name 欄位，就用空字串代替)
        // 請確認這裡的 p.name 是否對應你 Firebase 的欄位！
        const name = p.name ? String(p.name).toLowerCase().trim() : "";
        
        // 2. 也可以順便搜尋分類 (category)
        const category = p.category ? String(p.category).toLowerCase().trim() : "";

        // ★ 除錯點 2：印出比對過程 (如果找不到，請把這行取消註解)
        // if (name.includes(searchQuery)) {
        //     console.log(`找到匹配: ${name} (關鍵字: ${searchQuery})`);
        // }

        // 只要名稱或分類包含關鍵字，就回傳 true
        return name.includes(searchQuery) || category.includes(searchQuery);
    });

    console.log(`過濾後剩下 ${filtered.length} 個商品`);

    // --- 以下為分頁與渲染 (維持原樣) ---
    const perPage = getPerPage();
    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    const pageItems = filtered.slice(start, end);

    if (pageItems.length === 0) {
        grid.innerHTML = `
            <div class="no-products" style="grid-column:1/-1; text-align:center; padding:50px; color:#888;">
                <span class="material-symbols-outlined" style="font-size:48px; margin-bottom:10px;">search_off</span><br>
                No products found for "${params.get("q")}".
            </div>`;
        return;
    }

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
    
    // 補位排版
    const fillCount = perPage - pageItems.length;
    if (fillCount > 0 && pageItems.length > 0) { 
        for (let i = 0; i < fillCount; i++) {
            const card = document.createElement("div");
            card.className = "product-card";
            card.style.visibility = "hidden"; 
            grid.appendChild(card);
        }
    }
}

// 分頁與事件
function updatePaginationVisuals() {
    document.querySelectorAll(".pagination span").forEach(el => el.classList.remove("page-active"));
    const currentBtn = document.getElementById(`page${currentPage}`);
    if (currentBtn) currentBtn.classList.add("page-active");
}

const btnPage1 = document.getElementById("page1");
const btnPage2 = document.getElementById("page2");
const btnPrev = document.getElementById("prev");
const btnNext = document.getElementById("next");

if (btnPage1) btnPage1.addEventListener("click", () => { if (currentPage !== 1) { currentPage = 1; renderProducts(); }});
if (btnPage2) btnPage2.addEventListener("click", () => { if (currentPage !== 2) { currentPage = 2; renderProducts(); }});
if (btnPrev) btnPrev.addEventListener("click", () => { if (currentPage > 1) { currentPage--; renderProducts(); }});
if (btnNext) btnNext.addEventListener("click", () => { if (currentPage < 2) { currentPage++; renderProducts(); }});

window.addEventListener("resize", () => renderProducts());
document.addEventListener("DOMContentLoaded", () => fetchProducts());
