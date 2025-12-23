// js/main.js

// 1. 引入 Firebase 功能
import { db } from './firebase.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 2. 全域變數
let products = [];
const perPage = 8;
let currentPage = 1;
let currentCategory = "all";

// 3. 從 Firebase 抓資料
async function fetchProducts() {
    const grid = document.querySelector(".products");
    if (grid) grid.innerHTML = '<div style="width:100%;text-align:center;padding:20px;">Loading products...</div>';

    try {
        // 抓取資料
        const querySnapshot = await getDocs(collection(db, "products"));
        products = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // 確保資料有 ID，如果資料庫沒存 ID 欄位，就用 doc.id
            products.push({
                ...data,
                id: doc.id
            });
        });

        // 排序 (依據 id)
        products.sort((a, b) => a.id - b.id);
        console.log("商品載入成功:", products);

        // 資料抓到了，開始渲染
        renderProducts();


    } catch (error) {
        console.error("讀取商品失敗:", error);
        if (grid) grid.innerHTML = '<div style="color:red;text-align:center;">Failed to load products. Check Console (F12).</div>';
    }
}

function renderProducts() {
    const grid = document.querySelector(".products");
    if (!grid) return; // 防止在沒有商品列表的頁面報錯

    grid.innerHTML = "";

    const filtered =
        currentCategory === "all"
            ? products
            : products.filter((p) => p.category === currentCategory);

    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    const pageItems = filtered.slice(start, end);

    // 如果沒有商品
    if (pageItems.length === 0) {
        const noDiv = document.createElement("div");
        noDiv.className = "no-products";
        noDiv.textContent = "No products found.";
        grid.appendChild(noDiv);
        return;
    }

    // 渲染商品卡片
    pageItems.forEach((p) => {
        const card = document.createElement("div");
        card.className = "product-card";
        const imgSrc = p.img ? p.img : "https://via.placeholder.com/200/cccccc/808080?text=No+Image";
        card.innerHTML = `
          <a href="product.html?id=${p.id}">
            <div class="product-img">
              <img src="${imgSrc}" alt="${p.name}">
            </div>
            <div class="product-name">${p.name}</div>
            <div class="product-price">${p.price}</div>
          </a>
        `;
        grid.appendChild(card);
    });
}

// ===========================================
// Banner 輪播邏輯
// ===========================================
const slides = document.querySelectorAll('.banner-imgs img');
const dots = document.querySelectorAll('.banner-dots span');
let current = 0;
let timer;

function showSlide(index) {
    if (slides.length === 0) return;
    slides.forEach((img, i) => {
        img.classList.toggle('active', i === index);
        if (dots[i]) dots[i].classList.toggle('active', i === index);
    });
    current = index;
}

function nextSlide() {
    let next = (current + 1) % slides.length;
    showSlide(next);
}

if (dots.length > 0) {
    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            clearInterval(timer);
            showSlide(Number(dot.dataset.index));
            startAutoSlide();
        });
    });
}

function startAutoSlide() {
    if (slides.length > 0) timer = setInterval(nextSlide, 3000);
}


// ===========================================
// Back To Top 邏輯
// ===========================================
const backToTopBtn = document.getElementById("backToTopBtn");
if (backToTopBtn) {
    window.onscroll = function () {
        if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
            backToTopBtn.style.display = "block";
        } else {
            backToTopBtn.style.display = "none";
        }
    };
    backToTopBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}


// ===========================================
// 手機版商品輪播邏輯 (封裝成函式)
// ===========================================
function initCarouselLogic() {
    const productsContainer = document.querySelector(".products");
    const leftArrow = document.querySelector(".left-arrow");
    const rightArrow = document.querySelector(".right-arrow");

    if (!productsContainer) return;

    let isMobileCarouselActive = false;
    let carouselPage = 0; // 改名以免跟上面的全域 currentPage 衝突
    let totalCarouselPages = 0;

    function updateSlide() {
        if (!isMobileCarouselActive) return;
        const wrapper = document.querySelector(".product-carousel-wrapper");
        if (!wrapper) return;
        const pageWidth = wrapper.clientWidth;

        productsContainer.style.transition = "transform 0.4s ease";
        productsContainer.style.transform = `translateX(-${carouselPage * pageWidth}px)`;
    }

    function initMobileCarousel() {
        if (isMobileCarouselActive) return;

        // 這裡要抓取 product-card，但要小心不要抓到補位用的空白卡片(如果有區分的話)
        // 簡單起見，先抓全部 children
        const originalCards = Array.from(productsContainer.children);
        if (originalCards.length <= 4) return;

        const pages = [];
        for (let i = 0; i < originalCards.length; i += 4) {
            const page = document.createElement("div");
            page.className = "product-page";
            // 建議在 CSS 加上 .product-page { min-width: 100%; display: grid; grid-template-columns: 1fr 1fr; ... }
            originalCards.slice(i, i + 4).forEach(card => page.appendChild(card));
            pages.push(page);
        }

        productsContainer.innerHTML = "";
        pages.forEach(page => productsContainer.appendChild(page));

        isMobileCarouselActive = true;
        totalCarouselPages = pages.length;
        carouselPage = 0;
        updateSlide();
    }

    function destroyMobileCarousel() {
        if (!isMobileCarouselActive) return;
        const pages = productsContainer.querySelectorAll(".product-page");
        const fragment = document.createDocumentFragment();
        pages.forEach(page => {
            Array.from(page.children).forEach(card => fragment.appendChild(card));
        });
        productsContainer.innerHTML = "";
        productsContainer.appendChild(fragment);
        productsContainer.style.transform = "";

        isMobileCarouselActive = false;
        carouselPage = 0;
    }

    function checkMode() {
        if (window.matchMedia("(max-width: 600px)").matches) {
            initMobileCarousel();
        } else {
            destroyMobileCarousel();
        }
    }

    // 移除舊的 event listener 以免重複綁定 (雖然這裡是初始化，但保險起見)
    // 這裡簡單處理，直接綁定
    if (rightArrow) {
        // 用 cloneNode 清除舊事件，或確保只綁定一次。這裡簡化直接綁定，但要注意不要多次呼叫 initCarouselLogic
        rightArrow.onclick = () => {
            if (!isMobileCarouselActive) return;
            carouselPage = (carouselPage + 1) % totalCarouselPages;
            updateSlide();
        };
    }
    if (leftArrow) {
        leftArrow.onclick = () => {
            if (!isMobileCarouselActive) return;
            carouselPage = (carouselPage - 1 + totalCarouselPages) % totalCarouselPages;
            updateSlide();
        };
    }

    checkMode();
    window.addEventListener("resize", checkMode);
}

// ===========================================
// 啟動程式
// ===========================================
startAutoSlide();
fetchProducts(); // 這會觸發 renderProducts -> initCarouselLogic

// ===========================================
//  初始化執行
// ===========================================
startAutoSlide();
renderProducts();


// ===========================================
//  刷新頁面自動回到頂部 (強制重置捲動位置)
// ===========================================
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual'; // 防止瀏覽器記住捲動位置
}

window.onbeforeunload = function () {
    window.scrollTo(0, 0);
};

// 雙重保險：DOM 載入後也滾一次
document.addEventListener("DOMContentLoaded", () => {
    window.scrollTo(0, 0);
});


// =========================================
//  首頁彈出視窗邏輯 (Popup Modal)
// =========================================
document.addEventListener("DOMContentLoaded", () => {
    const popup = document.getElementById("promoPopup");
    const closeBtn = document.getElementById("closePopupBtn");
    const checkbox = document.getElementById("dontShowCheckbox");

    // 確保這個頁面有彈出視窗元素才執行
    if (popup && closeBtn && checkbox) {

        // 檢查 LocalStorage 是否有紀錄 "不再顯示"
        const hidePopup = localStorage.getItem("ce-hide-popup");

        // 如果沒有紀錄，延遲 0.5 秒後跳出
        if (!hidePopup) {
            setTimeout(() => {
                popup.classList.add("active");
            }, 500);
        }

        // 關閉按鈕點擊事件
        closeBtn.addEventListener("click", () => {
            if (checkbox.checked) {
                localStorage.setItem("ce-hide-popup", "true");
            }
            popup.classList.remove("active");
        });

        // 點擊遮罩背景也可以關閉
        popup.addEventListener("click", (e) => {
            if (e.target === popup) {
                if (checkbox.checked) {
                    localStorage.setItem("ce-hide-popup", "true");
                }
                popup.classList.remove("active");
            }
        });
    }
});
