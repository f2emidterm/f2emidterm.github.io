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
    if (checkoutBtn) {
        checkoutBtn.addEventListener("click", async () => {
            
            // ★ 第一步：檢查是否登入
            // 我們去 localStorage 抓剛剛 login.js 存進去的 "currentUser"
            const currentUser = localStorage.getItem("currentUser");

            if (!currentUser) {
                // 如果沒抓到人 -> 彈窗警告 -> 跳轉登入頁
                alert("請先登入會員才能結帳！");
                window.location.href = "login.html"; 
                return; // 程式到這裡停止，不執行下面的結帳
            }

            // --- 以下是登入後的結帳流程 ---

            const cart = JSON.parse(localStorage.getItem("shopCart")) || [];
            
            if (cart.length === 0) {
                alert("Cart is empty!");
                return;
            }

            const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
            
            // 摘要彈窗 (可選)
            let orderSummary = `Hi ${currentUser}, confirm your order:\n\n`;
            cart.forEach(i => {
                orderSummary += `- ${i.name} x${i.qty} ($${i.price * i.qty})\n`;
            });
            orderSummary += `\nTotal: $${total}`;

            if(!confirm(orderSummary)) return; // 讓使用者按確定才送出

            // 寫入 Firebase
            try {
                checkoutBtn.textContent = "Processing...";
                checkoutBtn.disabled = true;

                await addDoc(collection(db, "orders"), {
                    items: cart,
                    totalAmount: total,
                    orderBy: currentUser, // ★ 關鍵：把「是誰買的」寫進資料庫
                    createdAt: serverTimestamp(),
                    status: "new"
                });

                alert("Order placed successfully!");
                
                // 結帳成功才清空購物車
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

