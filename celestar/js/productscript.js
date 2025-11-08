document.addEventListener("DOMContentLoaded", () => {
    const minusBtn = document.getElementById('minus');
    const plusBtn = document.getElementById('plus');
    const qtySpan = document.getElementById('qty');
    const buyBtn = document.getElementById('buy');
    const cartBtn = document.getElementById('cart');

    let quantity = 1;

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

    buyBtn.addEventListener('click', () => {
        alert('前往結帳頁面');
    });

    cartBtn.addEventListener('click', () => {
        alert('已加入購物車');
    });

    // ==== 下拉選單互動 ====
    const selectSelected = document.querySelector(".select-selected");
    const selectItems = document.querySelector(".select-items");

    selectSelected.addEventListener("click", () => {
        selectSelected.classList.toggle("active");
        selectItems.classList.toggle("show");
    });

    window.addEventListener("click", (e) => {
        if (!e.target.closest(".custom-select")) {
            selectSelected.classList.remove("active");
            selectItems.classList.remove("show");
        }
    });

    // 取得網址參數
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    // 模擬商品資料庫
    const products = {
        1: { name: "BLUE OCEAN HOUR STICKER", price: 20, img: "images/stk1.jpg", thumbs: ["images/stk1.jpg", "images/stk1-1.jpg", "images/stk1-2.jpg"], desc: "blue sticker" },
        2: { name: "SUNDAY BLUSH STICKER", price: 20, img: "images/stk2.jpg", thumbs: [], desc: "sticker" },
        3: { name: "LUCKY GREEN STICKER", price: 20, img: "images/stk3.jpg", thumbs: [], desc: "sticker" },
        4: { name: "LEMON MOOD STICKER", price: 20, img: "images/stk4.jpg", thumbs: [], desc: "sticker" },
        5: { name: "STRAWBERRY VIBES STICKER", price: 20, img: "images/stk5.jpg", thumbs: [], desc: "sticker" },
        6: { name: "MONOTONE DIARY STICKER", price: 20, img: "images/stk6.jpg", thumbs: [], desc: "sticker" },
        7: { name: "APPLE FLAVOR HAIRPIN", price: 120, img: "images/acc1.png", thumbs: ["images/acc1.png", "images/acc1-1.png"], desc: "apple accessory" },
        8: { name: "STARFISH RING", price: 200, img: "images/acc2.png", thumbs: [], desc: "accessory" }
    };

    // 根據 ID 取得商品資料
    const product = products[productId];

    // 顯示資料
    if (product) {
        document.querySelector(".product-info h2").textContent = product.name;
        document.querySelector(".product-info p").textContent = `$${product.price}`;
        document.querySelector(".main-img img").src = product.img;
        const mainImg = document.querySelector(".main-img img");

        // 縮圖切換
        const thumbsContainer = document.querySelector(".thumbs");
        thumbsContainer.innerHTML = "";
        if (product.thumbs && product.thumbs.length > 0) {
            product.thumbs.forEach(src => {
                const img = document.createElement("img");
                img.src = src;
                img.alt = "預覽圖";
                thumbsContainer.appendChild(img);
                img.addEventListener("click", () => {
                    mainImg.src = img.src;
                });
            });
        } else {
            const emptyDiv = document.createElement("div");
            emptyDiv.style.width = "80px";
            emptyDiv.style.height = "80px";
            emptyDiv.style.backgroundColor = "#eee";
            emptyDiv.style.border = "1px solid #ccc";
            thumbsContainer.appendChild(emptyDiv);
        }

        // 商品描述
        const descSection = document.querySelector(".description");
        descSection.innerHTML = `
            <p>商品描述</p>
            <p>${product.desc}</p>
          `;

        // 數量與總額顯示控制
        const quantitySection = document.querySelector(".quantity-section");
        const totalInfo = document.querySelector(".total-info");
        const totalQty = document.getElementById('totalQty');
        const totalPrice = document.getElementById('totalPrice');
        let unitPrice = product.price;

        quantitySection.style.display = "none";
        totalInfo.style.display = "none";

        // 選項行為（自訂select）
        selectItems.querySelectorAll("div").forEach(option => {
            option.addEventListener("click", () => {
                const value = option.getAttribute("data-value");
                selectSelected.textContent = value;
                selectSelected.classList.remove("active");
                selectItems.classList.remove("show");

                if (value !== "請選擇款式") {
                    quantitySection.style.display = "flex";
                    updateTotal();
                } else {
                    quantitySection.style.display = "none";
                    totalInfo.style.display = "none";
                }
            });
        });

        // 更新總額
        function updateTotal() {
            totalQty.textContent = quantity;
            totalPrice.textContent = unitPrice * quantity;
            totalInfo.style.display = "block";
        }

    } else {
        document.querySelector("main").innerHTML = "<p>找不到此商品</p>";
    }

});
