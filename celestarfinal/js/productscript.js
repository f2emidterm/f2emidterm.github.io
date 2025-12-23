// js/product.js

// 1. 引入 Firebase 功能
import { db } from './firebase.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {

    // --- (A) 取得網址上的 ID ---
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    // --- (B) 抓取 DOM 元素 ---
    const main = document.querySelector("main");
    const minusBtn = document.getElementById('minus');
    const plusBtn = document.getElementById('plus');
    const qtySpan = document.getElementById('qty');
    const buyBtn = document.getElementById('buy');
    const cartBtn = document.getElementById('cart');

    // 下拉選單
    const selectSelected = document.querySelector(".select-selected");
    const selectItems = document.querySelector(".select-items");

    // 價格區域
    const quantitySection = document.querySelector(".quantity-section");
    const totalInfo = document.querySelector(".total-info");
    const totalQty = document.getElementById('totalQty');
    const totalPrice = document.getElementById('totalPrice');

    // --- (C) 全域變數 (用來存商品狀態) ---
    let quantity = 1;
    let unitPrice = 0;        // 存單價 (解決 NaN 問題)
    let currentProductName = ""; // 存商品名稱 (解決 Alert 顯示問題)

    // 如果網址沒有 ID
    if (!productId) {
        main.innerHTML = "<p>無效的商品 ID</p>";
        return;
    }

    // --- (D) 從 Firebase 讀取資料 ---
    try {
        const docRef = doc(db, "products", productId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const product = docSnap.data();
            console.log("從 Firebase 讀到的資料:", product);

            // 1. 處理商品名稱
            currentProductName = product.name;

            // 2. 處理價格 (解決 NaN 問題)
            // 先轉成字串，把 "$" 符號拿掉，再轉成數字
            let cleanPrice = String(product.price).replace(/[^0-9.]/g, ''); 
            unitPrice = Number(cleanPrice);

            // 3. 渲染畫面
            renderProduct(product);
        } else {
            main.innerHTML = "<p>找不到此商品 (ID 不存在)</p>";
        }
    } catch (error) {
        console.error("讀取錯誤:", error);
        main.innerHTML = `<p>載入失敗: ${error.message}</p>`;
    }

    // --- (E) 渲染畫面函式 ---
    function renderProduct(product) {
        // 填入文字
        document.querySelector(".product-info h2").textContent = product.name;
        document.querySelector(".product-info p").textContent = `$${unitPrice}`; // 顯示處理過的價格

        // 主圖
        const imgSrc = product.img ? product.img : "https://via.placeholder.com/400?text=No+Image";
        const mainImg = document.querySelector(".main-img img");
        mainImg.src = imgSrc;

        // 縮圖 (Thumbs)
        const thumbsContainer = document.querySelector(".thumbs");
        thumbsContainer.innerHTML = "";
        const thumbsList = product.thumbs || []; // 防止沒有 thumbs 欄位報錯

        if (thumbsList.length > 0) {
            thumbsList.forEach(src => {
                const img = document.createElement("img");
                img.src = src;
                img.alt = "預覽圖";
                thumbsContainer.appendChild(img);
                img.addEventListener("click", () => {
                    mainImg.src = img.src;
                });
            });
        } else {
            // 沒有縮圖時顯示預設方塊
            const emptyDiv = document.createElement("div");
            emptyDiv.style.width = "80px";
            emptyDiv.style.height = "80px";
            emptyDiv.style.backgroundColor = "#eee";
            thumbsContainer.appendChild(emptyDiv);
        }

        // 商品描述
        const descSection = document.querySelector(".description");
        const description = product.desc || "暫無商品描述";
        descSection.innerHTML = `
            <br><p>商品描述</p><br>
            <p>${description}</p><br>
        `;

        // 初始化隱藏總價區塊
        if (quantitySection) quantitySection.style.display = "none";
        if (totalInfo) totalInfo.style.display = "none";
    }

    // --- (F) 互動邏輯 (按鈕 & 計算) ---

    function updateTotal() {
        if (totalQty) totalQty.textContent = quantity;
        
        // 這裡做計算，因為 unitPrice 已經轉成數字了，所以不會 NaN
        if (totalPrice) totalPrice.textContent = unitPrice * quantity;
        
        if (totalInfo) totalInfo.style.display = "block";
    }

    // 數量 -
    if (minusBtn) {
        minusBtn.addEventListener('click', () => {
            if (quantity > 1) quantity--;
            qtySpan.textContent = quantity;
            updateTotal();
        });
    }

    // 數量 +
    if (plusBtn) {
        plusBtn.addEventListener('click', () => {
            quantity++;
            qtySpan.textContent = quantity;
            updateTotal();
        });
    }

    // 購買按鈕 (已修正：顯示商品名稱)
    if (buyBtn) {
        buyBtn.addEventListener('click', () => {
            alert(`準備購買: ${currentProductName}\n數量: ${quantity}\n總價: $${unitPrice * quantity}`);
        });
    }

    // 加入購物車
    if (cartBtn) {
        cartBtn.addEventListener('click', () => {
            alert('已加入購物車');
        });
    }

    // 下拉選單邏輯 (完全保留你原本的功能)
    if (selectSelected && selectItems) {
        selectSelected.addEventListener("click", (e) => {
            e.stopPropagation();
            selectSelected.classList.toggle("active");
            selectItems.classList.toggle("show");
        });

        window.addEventListener("click", () => {
            selectSelected.classList.remove("active");
            selectItems.classList.remove("show");
        });

        selectItems.querySelectorAll("div").forEach(option => {
            option.addEventListener("click", () => {
                const value = option.getAttribute("data-value");
                selectSelected.textContent = value;
                selectSelected.classList.remove("active");
                selectItems.classList.remove("show");

                if (value !== "請選擇款式") {
                    if (quantitySection) quantitySection.style.display = "flex";
                    updateTotal();
                } else {
                    if (quantitySection) quantitySection.style.display = "none";
                    if (totalInfo) totalInfo.style.display = "none";
                }
            });
        });
    }
});
