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
    
    // 如果連 grid 都找不到，表示 DOM 還沒準備好，直接結束
    if (!grid) return; 

    grid.innerHTML = '<div style="width:100%;text-align:center;padding:20px;">Loading products...</div>';

    try {
        // 抓取資料
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
    if (!grid) return; 

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
        // 處理圖片
        const imgSrc = p.img ? p.img : "https://via.placeholder.com/200/cccccc/808080?text=No+Image";
        
        // 處理價格 (轉成數字比較安全)
        let displayPrice = p.price;
        // 如果資料庫已經存 "$20"，就不用再加 $，如果是 "20"，就加 $
        if(!String(displayPrice).includes("$")) {
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

    // 渲染完畢後，檢查是否需要啟動手機版輪播
    // initCarouselLogic(); // 視情況決定是否要放在這裡呼叫，或者利用 CSS media query 處理
    // 根據你之前的代碼，這裡會自動觸發 resize 事件來檢查
    const event = new Event('resize');
    window.dispatchEvent(event);
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
// 手機版商品輪播邏輯
// ===========================================
function initCarouselLogic() {
    const productsContainer = document.querySelector(".products");
    const leftArrow = document.querySelector(".left-arrow");
    const rightArrow = document.querySelector(".right-arrow");

    if (!productsContainer) return;

    let isMobileCarouselActive = false;
    let carouselPage = 0;
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

        const originalCards = Array.from(productsContainer.children);
        // 如果沒有卡片(還沒fetch到)，或者卡片太少，就不啟動
        if (originalCards.length === 0) return; 

        // 避免重複包裝，先檢查是否已經有 product-page
        if(originalCards[0].classList.contains('product-page')) return;

        const pages = [];
        for (let i = 0; i < originalCards.length; i += 4) {
            const page = document.createElement("div");
            page.className = "product-page";
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

    // 綁定箭頭事件
    if (rightArrow) {
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
    // 這裡我們把 checkMode 暴露給 window resize 事件，並確保它能讀取到最新的 DOM
    window.addEventListener("resize", checkMode);
}

// 啟動手機輪播邏輯的監聽
initCarouselLogic();


// ===========================================
// 🚀 核心啟動區 (這裡是最關鍵的地方)
// ===========================================
document.addEventListener("DOMContentLoaded", () => {
    // 1. 啟動 Banner
    startAutoSlide();

    // 2. 啟動 Firebase 抓資料
    // (這會等 HTML 都載入後才執行，避免 products 找不到元素)
    fetchProducts(); 
});


// ===========================================
//  其他輔助功能
// ===========================================

if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

window.onbeforeunload = function () {
    window.scrollTo(0, 0);
};

// 首頁彈出視窗
document.addEventListener("DOMContentLoaded", () => {
    const popup = document.getElementById("promoPopup");
    const closeBtn = document.getElementById("closePopupBtn");
    const checkbox = document.getElementById("dontShowCheckbox");

    if (popup && closeBtn && checkbox) {
        const hidePopup = localStorage.getItem("ce-hide-popup");
        if (!hidePopup) {
            setTimeout(() => {
                popup.classList.add("active");
            }, 500);
        }
        closeBtn.addEventListener("click", () => {
            if (checkbox.checked) {
                localStorage.setItem("ce-hide-popup", "true");
            }
            popup.classList.remove("active");
        });
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
