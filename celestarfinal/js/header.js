// 引入 Firebase (依照你原本的路徑)
import { db } from './firebase.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
    // ===========================
    // 原有的 Header 邏輯 (漢堡選單 & 搜尋)
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
            // 打開搜尋時，關閉購物車
            document.querySelector(".cart-dropdown")?.classList.remove("active");
        });
        searchBar.addEventListener("click", (e) => e.stopPropagation());
    }

    // ===========================
    // 🔥 新增：購物車邏輯
    // ===========================
    const cartIcon = document.getElementById("cartIcon");
    const cartDropdown = document.querySelector(".cart-dropdown");
    const cartItemsContainer = document.querySelector(".cart-items");
    const cartTotalEl = document.querySelector(".cart-total");
    const checkoutBtn = document.getElementById("checkoutBtn");
    const cartCountBadge = document.getElementById("cartCount");

    // 1. 切換購物車顯示/隱藏
    if (cartIcon && cartDropdown) {
        cartIcon.addEventListener("click", (e) => {
            e.stopPropagation(); // 阻止冒泡
            cartDropdown.classList.toggle("active");
            
            // 打開購物車時，關閉搜尋列
            if(searchBar) searchBar.classList.remove("active");
            
            renderCart(); // 打開時重新渲染，確保資料最新
        });

        // 點擊購物車內部不關閉
        cartDropdown.addEventListener("click", (e) => {
            e.stopPropagation();
        });
    }

    // 2. 點擊網頁其他地方，關閉所有下拉視窗
    document.addEventListener("click", () => {
        if(searchBar) searchBar.classList.remove("active");
        if(cartDropdown) cartDropdown.classList.remove("active");
    });

    // 3. 渲染購物車畫面 (核心功能)
    function renderCart() {
        // 從 LocalStorage 讀取資料
        const cart = JSON.parse(localStorage.getItem("shopCart")) || [];
        
        // 更新小紅點數量 (可選)
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

        // 綁定加減按鈕事件
        document.querySelectorAll(".qty-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const idx = e.target.dataset.index;
                const isPlus = e.target.classList.contains("plus");
                updateCartItem(idx, isPlus);
            });
        });
    }

    // 4. 更新商品數量
    function updateCartItem(index, isPlus) {
        let cart = JSON.parse(localStorage.getItem("shopCart")) || [];
        
        if (isPlus) {
            cart[index].qty++;
        } else {
            cart[index].qty--;
        }

        // 如果數量歸零，移除該商品
        if (cart[index].qty <= 0) {
            // 使用 confirm 讓使用者確認是否刪除 (可選)
            // if(confirm("Remove this item?")) {
                cart.splice(index, 1);
            // } else {
            //    cart[index].qty = 1; // 反悔的話設回1
            // }
        }

        localStorage.setItem("shopCart", JSON.stringify(cart));
        renderCart(); // 重新渲染
    }

    // 5. 監聽 "cartUpdated" 事件 (由 product.js 觸發)
    // 這樣在商品頁按加入購物車時，Header 會知道要更新
    window.addEventListener("cartUpdated", () => {
        renderCart();
    });

    // 6. 結帳功能 (寫入 Firebase)
    if (checkoutBtn) {
        checkoutBtn.addEventListener("click", async () => {
            const cart = JSON.parse(localStorage.getItem("shopCart")) || [];
            
            if (cart.length === 0) {
                alert("Cart is empty!");
                return;
            }

            const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
            
            // 製作訂單摘要字串
            let orderSummary = "Order Summary:\n";
            cart.forEach(i => {
                orderSummary += `- ${i.name} x${i.qty} ($${i.price * i.qty})\n`;
            });
            orderSummary += `\nTotal: $${total}`;

            // 彈出視窗
            alert(orderSummary);

            // 寫入 Firebase
            try {
                checkoutBtn.textContent = "Processing...";
                checkoutBtn.disabled = true;

                await addDoc(collection(db, "orders"), {
                    items: cart,
                    totalAmount: total,
                    createdAt: serverTimestamp(),
                    status: "new"
                });

                alert("Order placed successfully! (Saved to Firebase)");
                
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
    
    // 初始化時渲染一次 (避免重新整理後小紅點消失)
    renderCart();
});
