// 引入 Firebase (依照你原本的路徑)
import { db } from './firebase.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
    // ===========================
    // 1. Header 選單邏輯 (維持原樣)
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
    // 2. 搜尋框邏輯 (UI開關 + 🔥跳轉功能)
    // ===========================
    const searchBtn = document.getElementById("searchBtn"); // 放大鏡 icon
    const searchBar = document.querySelector(".search-bar"); // 整個搜尋列區塊

    if (searchBtn && searchBar) {
        // (1) 點擊放大鏡：開關搜尋框
        searchBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            searchBar.classList.toggle("active");
            // 打開搜尋框時，自動讓游標停在輸入框內
            if(searchBar.classList.contains("active")){
                const input = searchBar.querySelector("input");
                if(input) input.focus();
            }
            document.querySelector(".cart-dropdown")?.classList.remove("active");
        });
        searchBar.addEventListener("click", (e) => e.stopPropagation());

        // 🔥 (2) 執行搜尋功能的邏輯 (寫在這裡！)
        const searchInput = searchBar.querySelector("input");
        const searchSubmitBtn = searchBar.querySelector("button"); // GO 按鈕

        const performSearch = () => {
            const query = searchInput.value.trim();
            if (query) {
                // 跳轉到 search.html 並帶上關鍵字參數
                window.location.href = `search.html?q=${encodeURIComponent(query)}`;
            }
        };

        if (searchSubmitBtn && searchInput) {
            // 點擊 GO 按鈕
            searchSubmitBtn.addEventListener("click", (e) => {
                e.preventDefault(); // 防止表單預設提交
                performSearch();
            });

            // 在輸入框按下 Enter 鍵
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

    // 切換顯示
    if (cartIcon && cartDropdown) {
        cartIcon.addEventListener("click", (e) => {
            e.stopPropagation();
            cartDropdown.classList.toggle("active");
            if(searchBar) searchBar.classList.remove("active");
            renderCart();
        });
        cartDropdown.addEventListener("click", (e) => e.stopPropagation());
    }

    // 點擊外部關閉
    document.addEventListener("click", () => {
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
