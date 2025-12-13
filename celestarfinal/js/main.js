// ---- �ӫ~��� ----
const products = [
    { id: 1, name: "BLUE OCEAN HOUR STICKER", price: "$20", category: "sticker", img: "images/stk1.jpg" },
    { id: 2, name: "SUNDAY BLUSH STICKER", price: "$20", category: "sticker", img: "images/stk2.jpg" },
    { id: 3, name: "LUCKY GREEN STICKER", price: "$20", category: "sticker", img: "images/stk3.jpg" },
    { id: 4, name: "LEMON MOOD STICKER", price: "$20", category: "sticker", img: "images/stk4.jpg" },
    { id: 5, name: "STRAWBERRY VIBES STICKER", price: "$20", category: "sticker", img: "images/stk5.jpg" },
    { id: 6, name: "MONOTONE DIARY STICKER", price: "$20", category: "sticker", img: "images/stk6.jpg" },
    { id: 7, name: "APPLE FLAVOR HAIRPIN", price: "$120", category: "accessory", img: "images/acc1.png" },
    { id: 8, name: "STARFISH RING", price: "$200", category: "accessory", img: "images/acc2.png" }
];

const perPage = 8;
let currentPage = 1;
let currentCategory = "all";

function renderProducts() {
    const grid = document.querySelector(".products");
    grid.innerHTML = "";

    const filtered =
        currentCategory === "all"
            ? products
            : products.filter((p) => p.category === currentCategory);

    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    const pageItems = filtered.slice(start, end);

    // �p�G�S���ӫ~�A��� no products
    if (pageItems.length === 0) {
        const noDiv = document.createElement("div");
        noDiv.className = "no-products";
        noDiv.textContent = "No products found.";
        grid.appendChild(noDiv);
        return;
    }

    // ��V�ӫ~
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

    // �ɺ��Ѿl��l���Ǧ���
    const fillCount = perPage - pageItems.length;
    for (let i = 0; i < fillCount; i++) {
        const card = document.createElement("div");
        card.className = "product-card";
        card.innerHTML = `
          <div class="product-img" style="background-color:#f0f0f0;"></div>
          <div class="product-name">PRODUCT NAME</div>
          <div class="product-price">$0</div>
        `;
        grid.appendChild(card);
    }
}

const slides = document.querySelectorAll('.banner-imgs img');
const dots = document.querySelectorAll('.banner-dots span');
let current = 0;
let timer;

function showSlide(index) {
    slides.forEach((img, i) => {
        img.classList.toggle('active', i === index);
        dots[i].classList.toggle('active', i === index);
    });
    current = index;
}

function nextSlide() {
    let next = (current + 1) % slides.length;
    showSlide(next);
}

dots.forEach(dot => {
    dot.addEventListener('click', () => {
        clearInterval(timer);
        showSlide(Number(dot.dataset.index));
        startAutoSlide();
    });
});

function startAutoSlide() {
    timer = setInterval(nextSlide, 3000); // �C 3 ������
}

const backToTopBtn = document.getElementById("backToTopBtn");

window.onscroll = function () { scrollFunction() };

function scrollFunction() {
    if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
        backToTopBtn.style.display = "block";
    } else {
        backToTopBtn.style.display = "none";
    }
}

backToTopBtn.addEventListener("click", backToTop);

function backToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });

}

startAutoSlide();
renderProducts();

/*rwd*/
// 獲取漢堡圖標和導航列
const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');

// 定義一個類別，用於控制導航列的顯示/隱藏
const ACTIVE_CLASS = 'nav-open';

if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', function () {
        // 點擊時，切換導航列的顯示狀態
        mainNav.classList.toggle(ACTIVE_CLASS);

        // 可選：切換圖標，讓 "menu" 變成 "close"
        if (mainNav.classList.contains(ACTIVE_CLASS)) {
            menuToggle.textContent = 'close';
        } else {
            menuToggle.textContent = 'menu';
        }
    });
}

// ===========================================
// 商品輪播分頁邏輯 (修正為輔助滾動)
// ===========================================

const productScroller = document.querySelector('.products-scroller'); // 確保選取到滾動容器
const productArrows = document.querySelectorAll('.carousel-arrow');

// 每頁的寬度 = 滾動容器的寬度
let pageWidth = productScroller ? productScroller.clientWidth : 0;

function updateProductCarousel(direction) {
    if (window.innerWidth > 600 || !productScroller) {
        return;
    }
    
    // 關鍵：計算滾動目標位置
    const scrollAmount = direction * pageWidth;
    
    productScroller.scrollBy({
        left: scrollAmount,
        behavior: 'smooth' // 平滑滾動
    });
}

// 監聽箭頭點擊事件
productArrows.forEach(arrow => {
    arrow.addEventListener('click', () => {
        const direction = parseInt(arrow.dataset.direction); // -1 或 1
        updateProductCarousel(direction);
    });
});

// 監聽視窗大小變化，更新 pageWidth
window.addEventListener('resize', () => {
    if (productScroller) {
        pageWidth = productScroller.clientWidth;
    }
    // 確保 PC 模式下重置滾動位置
    if (window.innerWidth > 600) {
        productScroller.scrollTo({ left: 0, behavior: 'instant' });
    }
});

// 確保初始頁面正確 (在載入完成後計算寬度)
window.addEventListener('load', () => {
    if (productScroller) {
        pageWidth = productScroller.clientWidth;
    }
});
