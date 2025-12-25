// ===========================================
// js/header.js (除錯版)
// ===========================================

// 1. 嘗試引入 Firebase
// 如果你的 firebase.js 路徑錯了，或者 API Key 有問題，瀏覽器會直接在這裡報錯停止
import { db } from './firebase.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

console.log("✅ header.js 已載入，正在等待 DOM...");

document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ DOM 載入完成，開始綁定按鈕...");

    // ===========================
    // 1. Header 選單邏輯
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

    // ===========================
    // 2. 搜尋框邏輯
    // ===========================
    const searchBtn = document.getElementById("searchBtn");
    const searchBar = document.querySelector(".search-bar");

    // ★ 除錯點 1：檢查搜尋元素是否存在
    if (!searchBtn) console.error("❌ 找不到 ID 為 'searchBtn' 的按鈕 (放大鏡)");
    if (!searchBar) console.error("❌ 找不到 Class 為 '.search-bar' 的元素");

    if (searchBtn && searchBar) {
        console.log("✅ 搜尋功能綁定成功！");
        
        // (1) 點擊放大鏡
        searchBtn.addEventListener("click", (e) => {
            console.log("🖱️ 點擊了放大鏡");
            e.stopPropagation();
            searchBar.classList.toggle("active"); // 切換 active class
            
            // 檢查 CSS 是否生效
            if (searchBar.classList.contains("active")) {
                console.log("🔎 搜尋框已開啟 (Class Added)");
                const input = searchBar.querySelector("input");
                if(input) input.focus();
            } else {
                console.log("🙈 搜尋框已關閉");
            }
            
            document.querySelector(".cart-dropdown")?.classList.remove("active");
        });

        searchBar.addEventListener("click", (e) => e.stopPropagation());

        // (2) 搜尋執行邏輯
        const searchInput = searchBar.querySelector("input");
        const searchSubmitBtn = searchBar.querySelector("button");

        const performSearch = () => {
            const query = searchInput.value.trim();
            console.log("🚀 準備搜尋:", query);
            if (query) {
                window.location.href = `search.html?q=${encodeURIComponent(query)}`;
            } else {
                console.warn("⚠️ 請輸入關鍵字再搜尋");
            }
        };

        if (searchSubmitBtn && searchInput) {
            searchSubmitBtn.addEventListener("click", (e) => {
                e.preventDefault();
                performSearch();
            });

            searchInput.addEventListener("keypress", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    performSearch();
                }
            });
        }
    }

    // ===========================
    // 3. 購物車邏輯
    // ===========================
    const cartIcon = document.getElementById("cartIcon");
    const cartDropdown = document.querySelector(".cart-dropdown");
    const cartItemsContainer = document.querySelector(".cart-items");
    const cartTotalEl = document.querySelector(".cart-total");
    const checkoutBtn = document.getElementById("checkoutBtn");
    const cartCountBadge = document.getElementById("cartCount");

    // ★ 除錯點 2：檢查購物車元素
    if (!cartIcon) console.error("❌ 找不到 ID 為 'cartIcon' 的購物車圖示");
    if (!cartDropdown) console.error("❌ 找不到 Class 為 '.cart-dropdown' 的元素");

    if (cartIcon && cartDropdown) {
        console.log("✅ 購物車功能綁定成功！");
        
        cartIcon.addEventListener("click", (e) => {
            console.log("🛒 點擊了購物車");
            e.stopPropagation();
            cartDropdown.classList.toggle("active");
            if(searchBar) searchBar.classList.remove("active");
            renderCart();
        });
        
        cartDropdown.addEventListener("click", (e) => e.stopPropagation());
    }

    // 點擊外部關閉
    document.addEventListener("click", (e) => {
        // console.log("點擊了頁面其他地方"); // 這行太吵可以註解掉
        if(searchBar) searchBar.classList.remove("active");
        if(cartDropdown) cartDropdown.classList.remove("active");
    });

    // 渲染購物車
    function renderCart() {
        const cart = JSON.parse(localStorage.getItem("shopCart")) || [];
        
        if(cartCountBadge) {
            const totalCount = cart.reduce((acc, item) => acc + item.qty, 0);
            cartCountBadge.textContent = totalCount;
            cartCountBadge.style.display = totalCount > 0 ? "inline-block" : "none";
        }

        if(!cartItemsContainer) return; // 防呆

        cartItemsContainer.innerHTML = "";
        let totalPrice = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<div class="cart-empty">Cart is empty.</div>';
            if(cartTotalEl) cartTotalEl.textContent = "Total: $0";
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

        if(cartTotalEl) cartTotalEl.textContent = `Total: $${totalPrice}`;

        document.querySelectorAll(".qty-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const idx = e.target.dataset.index;
                const isPlus = e.target.classList.contains("plus");
                updateCartItem(idx, isPlus);
            });
        });
    }

    // 更新數量
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
    // 4. 結帳功能
    // ===========================
    if (checkoutBtn) {
        checkoutBtn.addEventListener("click", async () => {
            console.log("💳 點擊結帳按鈕");

            // 1. 檢查登入
            const currentUser = localStorage.getItem("currentUser");
            if (!currentUser) {
                alert("請先登入會員才能進行購買！\n(將跳轉至登入頁面)");
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
            
            // 資料清洗
            const finalOrderItems = cart.map(item => {
                return {
                    name: item.name,
                    price: Number(item.price),
                    qty: Number(item.qty),
                    img: item.img || "" 
                };
            });

            // 4. 確認清單
            let orderSummary = `您好! ${currentUser}\n準備購買:\n`;
            finalOrderItems.forEach(i => {
                orderSummary += `- ${i.name} x${i.qty} ($${i.price * i.qty})\n`;
            });
            orderSummary += `\n總金額： $${total}\n\n是否確認下單？`;

            // 5. 使用者確認
            if(!confirm(orderSummary)) return; 

            // 6. 寫入 Firebase
            try {
                checkoutBtn.textContent = "Processing...";
                checkoutBtn.disabled = true;

                await addDoc(collection(db, "orders"), {
                    items: finalOrderItems,
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
