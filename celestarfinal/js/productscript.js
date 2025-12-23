// product.js (或你的檔案名稱)

// 1. 引入 Firebase 功能
import { db } from './firebase.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 2. 初始化頁面
document.addEventListener("DOMContentLoaded", async () => {
    
    // --- (A) 取得網址上的 ID ---
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        document.querySelector("main").innerHTML = "<p>無效的商品 ID</p>";
        return;
    }

    // --- (B) DOM 元素抓取 ---
    const minusBtn = document.getElementById('minus');
    const plusBtn = document.getElementById('plus');
    const qtySpan = document.getElementById('qty');
    const buyBtn = document.getElementById('buy');
    const cartBtn = document.getElementById('cart');
    
    // 下拉選單相關
    const selectSelected = document.querySelector(".select-selected");
    const selectItems = document.querySelector(".select-items");
    
    // 價格與數量顯示區
    const quantitySection = document.querySelector(".quantity-section");
    const totalInfo = document.querySelector(".total-info");
    const totalQty = document.getElementById('totalQty');
    const totalPrice = document.getElementById('totalPrice');

    let quantity = 1;
    let unitPrice = 0; // 之後會從資料庫更新

    // --- (C) 從 Firebase 抓取商品資料 ---
    try {
        const docRef = doc(db, "products", productId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const product = docSnap.data();
            console.log("商品資料:", product);

            // 更新單價
            unitPrice = Number(product.price);

            // 渲染畫面
            renderProduct(product);
        } else {
            document.querySelector("main").innerHTML = "<p>找不到此商品 (ID 不存在)</p>";
        }
    } catch (error) {
        console.error("讀取錯誤:", error);
        document.querySelector("main").innerHTML = `<p>載入失敗: ${error.message}</p>`;
    }

    // --- (D) 渲染函式 (把資料填入 HTML) ---
    function renderProduct(product) {
        document.querySelector(".product-info h2").textContent = product.name;
        document.querySelector(".product-info p").textContent = `$${product.price}`;
        
        // 處理主圖 (如果有 img 欄位就用，沒有就用預設圖)
        const imgSrc = product.img ? product.img : "https://via.placeholder.com/400?text=No+Image";
        const mainImg = document.querySelector(".main-img img");
        mainImg.src = imgSrc;

        // --- 處理縮圖 (Thumbs) ---
        // 注意：如果你在 Firebase 沒建立 thumbs 陣列，這裡會用空陣列 [] 避免報錯
        const thumbsContainer = document.querySelector(".thumbs");
        thumbsContainer.innerHTML = "";
        
        const thumbsList = product.thumbs || []; // 如果資料庫沒有 thumbs 欄位，就用空陣列

        // 如果有縮圖才顯示，沒有就顯示一個空的方塊
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
            // 如果這商品沒有縮圖，也可以選擇什麼都不做，或顯示預設方塊
            const emptyDiv = document.createElement("div");
            Object.assign(emptyDiv.style, {
                width: "80px",
                height: "80px",
                backgroundColor: "#eee",
                border: "1px solid #ccc"
            });
            thumbsContainer.appendChild(emptyDiv);
        }

        // --- 商品描述 ---
        const descSection = document.querySelector(".description");
        // 確保有 desc 欄位，沒有就顯示預設文字
        const description = product.desc || "暫無商品描述"; 
        descSection.innerHTML = `
            <br><p>商品描述</p><br>
            <p>${description}</p><br>
        `;

        // 預設隱藏數量與總價 (等你選規格)
        if (quantitySection) quantitySection.style.display = "none";
        if (totalInfo) totalInfo.style.display = "none";
    }

    // --- (E) 按鈕互動邏輯 (保持原本邏輯) ---
    
    // 更新總金額函式
    function updateTotal() {
        if(totalQty) totalQty.textContent = quantity;
        if(totalPrice) totalPrice.textContent = unitPrice * quantity;
        if(totalInfo) totalInfo.style.display = "block";
    }

    // 數量加減
    if (minusBtn) {
        minusBtn.addEventListener('click', () => {
            if (quantity > 1) quantity--;
            qtySpan.textContent = quantity;
            updateTotal();
        });
    }

    if (plusBtn) {
        plusBtn.addEventListener('click', () => {
            quantity++;
            qtySpan.textContent = quantity;
            updateTotal();
        });
    }

    // 購買與購物車
    if (buyBtn) {
        buyBtn.addEventListener('click', () => {
            alert(`準備購買 ID: ${productId}, 數量: ${quantity}, 總價: ${unitPrice * quantity}`);
        });
    }

    if (cartBtn) {
        cartBtn.addEventListener('click', () => {
            alert('已加入購物車');
        });
    }

    // --- (F) 下拉選單邏輯 ---
    if (selectSelected && selectItems) {
        selectSelected.addEventListener("click", (e) => {
            e.stopPropagation(); // 防止冒泡
            selectSelected.classList.toggle("active");
            selectItems.classList.toggle("show");
        });

        window.addEventListener("click", () => {
            selectSelected.classList.remove("active");
            selectItems.classList.remove("show");
        });

        // 選項點擊
        selectItems.querySelectorAll("div").forEach(option => {
            option.addEventListener("click", () => {
                const value = option.getAttribute("data-value");
                selectSelected.textContent = value;
                selectSelected.classList.remove("active");
                selectItems.classList.remove("show");

                if (value !== "請選擇款式") {
                    if(quantitySection) quantitySection.style.display = "flex";
                    updateTotal();
                } else {
                    if(quantitySection) quantitySection.style.display = "none";
                    if(totalInfo) totalInfo.style.display = "none";
                }
            });
        });
    }
});
