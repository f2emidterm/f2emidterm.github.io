// js/product.js

// 1. 引入 Firebase 功能
import { db } from './firebase.js';
import { doc, getDoc, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
    let unitPrice = 0;        
    let currentProductName = ""; 

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

            currentProductName = product.name;
            let cleanPrice = String(product.price).replace(/[^0-9.]/g, '');
            unitPrice = Number(cleanPrice);

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
        document.querySelector(".product-info h2").textContent = product.name;
        document.querySelector(".product-info p").textContent = `$${product.price}`;

        const imgSrc = product.img ? product.img : "https://via.placeholder.com/400?text=No+Image";
        const mainImg = document.querySelector(".main-img img");
        mainImg.src = imgSrc;

        const thumbsContainer = document.querySelector(".thumbs");
        thumbsContainer.innerHTML = "";
        const thumbsList = product.thumbs || [];

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
            const emptyDiv = document.createElement("div");
            emptyDiv.style.width = "80px";
            emptyDiv.style.height = "80px";
            emptyDiv.style.backgroundColor = "#eee";
            thumbsContainer.appendChild(emptyDiv);
        }

        const descSection = document.querySelector(".description");
        const description = product.desc || "暫無商品描述";
        descSection.innerHTML = `
            <br><p>商品描述</p><br>
            <p>${description}</p><br>
        `;

        if (quantitySection) quantitySection.style.display = "none";
        if (totalInfo) totalInfo.style.display = "none";
    }

    // --- (F) 互動邏輯 (按鈕 & 計算) ---

    function updateTotal() {
        if (totalQty) totalQty.textContent = quantity;
        if (totalPrice) totalPrice.textContent = unitPrice * quantity;
        if (totalInfo) totalInfo.style.display = "block";
    }

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

    // ============================================
    // 🔥 修改重點：直接購買 (Buy Now) 邏輯
    // ============================================
    if (buyBtn) {
        buyBtn.addEventListener('click', async () => { // 注意這裡變成 async
            const currentSelection = document.querySelector('.select-selected').textContent.trim();

            // 1. 檢查規格選了沒
            if (currentSelection === '請選擇款式') {
                alert('請先選取款式！');
                return;
            }

            // 2. 🔥 檢查是否登入
            const currentUser = localStorage.getItem("currentUser");
            if (!currentUser) {
                // 如果沒登入，跳出提醒並導向登入頁
                alert("請先登入會員才能進行購買！\n(將跳轉至登入頁面)");
                window.location.href = "login.html"; 
                return;
            }

            // 3. 準備訂單資料
            const total = unitPrice * quantity;
            const orderItem = {
                name: currentProductName,
                price: unitPrice,
                qty: quantity,
                // 因為是直接購買單一商品，我們也把它包成陣列格式，這樣資料庫格式才統一
                img: document.querySelector(".main-img img").src || "",
                spec: currentSelection // 把選的規格也記下來
            };

            // 4. 確認購買
            const confirmMsg = `您好! ${currentUser}\n準備購買:\n- ${orderItem.name} (${currentSelection}) x${quantity}\n\n總金額: $${total}\n\n是否確認下單？`;
            
            if(!confirm(confirmMsg)) return;

            // 5. 🔥 寫入 Firebase
            try {
                buyBtn.textContent = "Processing...";
                buyBtn.disabled = true;

                // 注意：這裡的 items 是一個陣列，即使只有一項，也用陣列包起來
                // 這樣跟購物車結帳的資料結構才會長一樣 ([{...}, {...}])
                await addDoc(collection(db, "orders"), {
                    items: [orderItem], 
                    totalAmount: total,
                    orderBy: currentUser,
                    createdAt: serverTimestamp(),
                    status: "new"
                });

                alert("您已訂購成功!\n訂單紀錄可於會員中心查詢･ﾟ✧*:･ﾟ");
                
                // 購買成功後通常不轉頁，或者可以轉去會員中心
                // window.location.href = "member.html"; 

            } catch (error) {
                console.error("Error adding order: ", error);
                alert("Order failed. Please try again.");
            } finally {
                buyBtn.textContent = "BUY NOW";
                buyBtn.disabled = false;
            }
        });
    }

    // ============================================
    // 加入購物車 (保持原樣，因為邏輯是對的)
    // ============================================
    if (cartBtn) {
        cartBtn.addEventListener('click', () => {
            const currentSelection = document.querySelector('.select-selected').textContent.trim();
            
            if (currentSelection === '請選擇款式') {
                alert('請先選取款式！');
                return;
            }

            const item = {
                id: productId,
                name: currentProductName,
                price: unitPrice,
                img: document.querySelector(".main-img img").src,
                qty: quantity,
                spec: currentSelection // 把規格也存進去
            };

            let cart = JSON.parse(localStorage.getItem("shopCart")) || [];
            
            // 判斷重複時，要連同「規格」一起判斷才準確 (例如同商品但不同尺寸視為不同項)
            // 這裡簡單處理，先只判斷 ID
            const existingItem = cart.find(i => i.id === item.id);

            if (existingItem) {
                existingItem.qty += item.qty;
            } else {
                cart.push(item);
            }

            localStorage.setItem("shopCart", JSON.stringify(cart));
            window.dispatchEvent(new Event("cartUpdated"));;

            alert('已加入購物車!');
        });
    }

    // 下拉選單邏輯
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
