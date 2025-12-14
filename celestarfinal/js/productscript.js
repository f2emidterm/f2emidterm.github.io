document.addEventListener("DOMContentLoaded", () => {
    const minusBtn = document.getElementById('minus');
    const plusBtn = document.getElementById('plus');
    const qtySpan = document.getElementById('qty');
    const buyBtn = document.getElementById('buy');
    const cartBtn = document.getElementById('cart');

    // 取得新的結構元素
    const quantitySection = document.querySelector(".quantity-section");
    const totalInfo = document.querySelector(".total-info");
    const totalQty = document.getElementById('totalQty');
    const totalPrice = document.getElementById('totalPrice');
    
    const selectSelected = document.querySelector(".select-selected");
    const selectItems = document.querySelector(".select-items");

    let quantity = 1;
    let unitPrice = 0; // 初始為 0，載入商品後更新

    // ==== 數量增減 ====
    if (minusBtn && plusBtn && qtySpan) {
        minusBtn.addEventListener('click', () => {
            if (quantity > 1) quantity--;
            qtySpan.textContent = quantity;
            updateTotal();
        });

        plusBtn.addEventListener('click', () => {
            quantity++;
            qtySpan.textContent = quantity;
            updateTotal();
        });
    }

    // ==== 更新總額函式 ====
    function updateTotal() {
        if(totalQty) totalQty.textContent = quantity;
        if(totalPrice) totalPrice.textContent = unitPrice * quantity;
    }

    // ==== 按鈕事件 ====
    if(buyBtn) buyBtn.addEventListener('click', () => alert('前往結帳頁面'));
    if(cartBtn) cartBtn.addEventListener('click', () => alert('已加入購物車'));

    // ==== 下拉選單互動 ====
    if (selectSelected && selectItems) {
        selectSelected.addEventListener("click", (e) => {
            e.stopPropagation();
            selectSelected.classList.toggle("active");
            selectItems.classList.toggle("show");
        });

        // 點擊選項
        selectItems.querySelectorAll("div").forEach(option => {
            option.addEventListener("click", () => {
                const value = option.getAttribute("data-value");
                selectSelected.textContent = value;
                selectSelected.classList.remove("active");
                selectItems.classList.remove("show");

                // 根據選項顯示或隱藏數量/總額
                if (value !== "預設" && value !== "請選擇款式") {
                    if(quantitySection) quantitySection.style.display = "flex"; 
                    if(totalInfo) totalInfo.style.display = "block";
                    updateTotal();
                } else {
                    if(quantitySection) quantitySection.style.display = "none";
                    if(totalInfo) totalInfo.style.display = "none";
                }
            });
        });

        // 點擊外部關閉選單
        window.addEventListener("click", (e) => {
            if (!e.target.closest(".custom-select")) {
                selectSelected.classList.remove("active");
                selectItems.classList.remove("show");
            }
        });
    }

    // ==== 商品資料載入 ====
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    const products = {
        1: { name: "BLUE OCEAN HOUR STICKER", price: 20, img: "images/stk1.jpg", thumbs: ["images/stk1.jpg", "images/stk1-1.jpg", "images/stk1-2.jpg"], desc: "blue sticker" },
        // ... (其他商品資料保持不變) ...
        8: { name: "STARFISH RING", price: 200, img: "images/acc2.png", thumbs: [], desc: "accessory" }
    };

    const product = products[productId] || products[1]; // 預設顯示 ID 1 方便測試

    if (product) {
        unitPrice = product.price; 

        document.querySelector(".info-header h2").textContent = product.name;
        document.querySelector(".info-header .price").textContent = `$${product.price}`;
        
        const mainImg = document.querySelector(".main-img img");
        if(mainImg) mainImg.src = product.img;

        // 縮圖
        const thumbsContainer = document.querySelector(".thumbs");
        if(thumbsContainer) {
            thumbsContainer.innerHTML = "";
            if (product.thumbs && product.thumbs.length > 0) {
                product.thumbs.forEach(src => {
                    const img = document.createElement("img");
                    img.src = src;
                    thumbsContainer.appendChild(img);
                    img.addEventListener("click", () => {
                        mainImg.src = img.src;
                    });
                });
            }
        }
        
        // 描述
        const descSection = document.querySelector(".description");
        if(descSection) {
            descSection.innerHTML = `<p>商品描述</p><p>${product.desc}</p>`;
        }
    }
});
