// 引入 Firebase (依照你原本的路徑)
import { db } from './firebase.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
    // ===========================
    // Header 邏輯 (維持原樣)
    // ===========================
    const menuBtn = document.querySelector(".menu-btn");
    const mobileMenu = document.querySelector(".mobile-menu");
    const overlay = document.querySelector(".menu-overlay");

    if (menuBtn && mobileMenu && overlay) {
        menuBtn.addEventListener("click", () => {
            mobileMenu.classList.toggle("active");
            overlay.classList.toggle("active");
            menuBtn.textContent = mobileMenu.classList.contains("active") ? "close" : "menu";
        });
        
        overlay.addEventListener("click", () => {
            mobileMenu.classList.remove("active");
            overlay.classList.remove("active");
            menuBtn.textContent = "menu";
        });

        mobileMenu.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                mobileMenu.classList.remove("active");
                overlay.classList.remove("active");
            });
        });
    }

    const searchBtn = document.getElementById("searchBtn");
    const searchBar = document.querySelector(".search-bar");

    if (searchBtn && searchBar) {
        searchBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            searchBar.classList.toggle("active");
            document.querySelector(".cart-dropdown")?.classList.remove("active");
        });
        searchBar.addEventListener("click", (e) => e.stopPropagation());
    }

    // ===========================
    // 購物車邏輯
    // ===========================
    const cartIcon = document.getElementById("cartIcon");
    const cartDropdown = document.querySelector(".cart-dropdown");
    const cartItemsContainer = document.querySelector(".cart-items");
    const cartTotalEl = document.querySelector(".cart-total");
    const checkoutBtn = document.getElementById("checkoutBtn");
    const cartCountBadge = document.getElementById("cartCount");

    // 1. 切換顯示
    if (cartIcon && cartDropdown) {
        cartIcon.addEventListener("click", (e) => {
            e.stopPropagation();
            cartDropdown.classList.toggle("active");
            if(searchBar) searchBar.classList.remove("active");
            renderCart();
        });
        cartDropdown.addEventListener("click", (e) => e.stopPropagation());
    }

    // 2. 點擊外部關閉
    document.addEventListener("click", () => {
        if(searchBar) searchBar.classList.remove("active");
        if(cartDropdown) cartDropdown.classList.remove("active");
    });

    // 3. 渲染購物車
    function renderCart() {
        const cart = JSON.parse(localStorage.getItem("shopCart")) || [];
        
        if(cartCountBadge) {
            const totalCount = cart.reduce((acc, item) => acc + item.qty, 0);
            cartCountBadge.textContent = totalCount;
            cartCountBadge.style.display = totalCount > 0 ? "inline-block" : "none";
        }

        cartItemsContainer.innerHTML = "";
        let totalPrice = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<div class="cart-empty">Cart is empty.</div>';
            cartTotalEl.textContent = "Total: $0";
            return;
        }

        cart.forEach((item, index) => {
            const itemTotal = item.price * item.qty;
            totalPrice += itemTotal;

            const div = document.createElement("div");
            div.className = "cart-item";
            div.innerHTML = `
                <img src="${item.img}" alt="${item.name}">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">$${item.price} x ${item.qty}</div>
                </div>
                <div class="cart-controls">
                    <button class="qty-btn minus" data-index="${index}">-</button>
                    <span>${item.qty}</span>
                    <button class="qty-btn plus" data-index="${index}">+</button>
                </div>
            `;
            cartItemsContainer.appendChild(div);
        });

        cartTotalEl.textContent = `Total: $${totalPrice}`;

        document.querySelectorAll(".qty-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const idx = e.target.dataset.index;
                const isPlus = e.target.classList.contains("plus");
                updateCartItem(idx, isPlus);
            });
        });
    }

    // 4. 更新數量
    function updateCartItem(index, isPlus) {
        let cart = JSON.parse(localStorage.getItem("shopCart")) || [];
        
        if (isPlus) {
            cart[index].qty++;
        } else {
            cart[index].qty--;
        }

        if (cart[index].qty <= 0) {
            cart.splice(index, 1);
        }

        localStorage.setItem("shopCart", JSON.stringify(cart));
        renderCart();
    }

    window.addEventListener("cartUpdated", () => {
        renderCart();
    });

    // ===========================
    // 🔥 6. 結帳功能 (修改重點在這裡)
    // ===========================
    // ===========================
    // 🔥 6. 結帳功能 (修復資料重複問題版)
    // ===========================
    if (checkoutBtn) {
        checkoutBtn.addEventListener("click", async () => {
            
            // 1. 檢查登入
            const currentUser = localStorage.getItem("currentUser");
            if (!currentUser) {
                alert("請先登入會員才能結帳！");
                window.location.href = "login.html"; 
                return;
            }

            // 2. 讀取購物車
            const cart = JSON.parse(localStorage.getItem("shopCart")) || [];
            
            if (cart.length === 0) {
                alert("Cart is empty!");
                return;
            }

            // 3. 計算總價
            const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
            
            // ==========================================
            // ★ 關鍵修正：資料清洗 (Data Sanitization)
            // 不要直接存 cart，我們手動建立一個乾淨的新陣列
            // 這能確保 A 就是 A，B 就是 B，不會有殘留的 bug
            // ==========================================
            const finalOrderItems = cart.map(item => {
                return {
                    name: item.name,
                    // 強制轉成數字，避免 "100" 字串導致計算錯誤
                    price: Number(item.price),
                    qty: Number(item.qty),
                    // 如果有圖片網址就存，沒有就存空字串
                    img: item.img || "" 
                };
            });

            // 4. 製作確認清單文字
            let orderSummary = `您好! ${currentUser}, 請確認以下訂單：\n\n`;
            finalOrderItems.forEach(i => {
                orderSummary += `- ${i.name} x${i.qty} ($${i.price * i.qty})\n`;
            });
            orderSummary += `\n總額： $${total}`;

            // 5. 使用者確認
            if(!confirm(orderSummary)) return; 

            // 6. 寫入 Firebase
            try {
                checkoutBtn.textContent = "Processing...";
                checkoutBtn.disabled = true;

                await addDoc(collection(db, "orders"), {
                    items: finalOrderItems, // ★ 這裡改傳我們清洗過的乾淨資料
                    totalAmount: total,
                    orderBy: currentUser,
                    createdAt: serverTimestamp(),
                    status: "new"
                });

                alert("您已訂購成功!\n訂單紀錄可於會員中心查詢･ﾟ✧*:･ﾟ");
                
                // 清空購物車
                localStorage.removeItem("shopCart");
                renderCart();
                cartDropdown.classList.remove("active");

            } catch (error) {
                console.error("Error adding order: ", error);
                alert("Order failed. Please try again.");
            } finally {
                checkoutBtn.textContent = "CHECKOUT";
                checkoutBtn.disabled = false;
            }
        });
    }
    
    renderCart();
});



