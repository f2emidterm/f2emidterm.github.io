// ===========================================
// js/header.js (包含選單、購物車、以及讀取 product1 這種 ID 的功能)
// ===========================================

import { db } from './firebase.js';
// ★★★ 這裡一定要引入 doc 和 getDoc 才能抓特定 ID 的文件 ★★★
import { collection, addDoc, serverTimestamp, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

console.log("✅ header.js 已載入...");

document.addEventListener("DOMContentLoaded", () => {
    
    // ===========================
    // 0. 特殊功能：偵測是否在商品頁，是的話就去抓資料
    // ===========================
    const productDetailContainer = document.getElementById("product-detail-container");
    
    // 如果網頁裡有這個容器，代表現在是 product.html
    if (productDetailContainer) {
        console.log("📦 偵測到詳情頁容器，準備抓取 ID...");
        loadProductDetail(productDetailContainer);
    }

    // ===========================
    // 1. Header 選單邏輯 (保持不變)
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
    // 2. 搜尋框邏輯 (保持不變)
    // ===========================
    const searchBtn = document.getElementById("searchBtn");
    const searchBar = document.querySelector(".search-bar");

    if (searchBtn && searchBar) {
        searchBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            searchBar.classList.toggle("active");
            if (searchBar.classList.contains("active")) {
                const input = searchBar.querySelector("input");
                if(input) input.focus();
            }
            document.querySelector(".cart-dropdown")?.classList.remove("active");
        });

        searchBar.addEventListener("click", (e) => e.stopPropagation());

        const searchInput = searchBar.querySelector("input");
        const searchSubmitBtn = searchBar.querySelector("button");

        const performSearch = () => {
            const query = searchInput.value.trim();
            if (query) {
                window.location.href = `search.html?q=${encodeURIComponent(query)}`;
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
    // 3. 購物車邏輯 (保持不變)
    // ===========================
    const cartIcon = document.getElementById("cartIcon");
    const cartDropdown = document.querySelector(".cart-dropdown");
    const cartItemsContainer = document.querySelector(".cart-items");
    const cartTotalEl = document.querySelector(".cart-total");
    const checkoutBtn = document.getElementById("checkoutBtn");
    const cartCountBadge = document.getElementById("cartCount");

    if (cartIcon && cartDropdown) {
        cartIcon.addEventListener("click", (e) => {
            e.stopPropagation();
            cartDropdown.classList.toggle("active");
            if(searchBar) searchBar.classList.remove("active");
            renderCart();
        });
        cartDropdown.addEventListener("click", (e) => e.stopPropagation());
    }

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

        if(!cartItemsContainer) return;

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

    function updateCartItem(index, isPlus) {
        let cart = JSON.parse(localStorage.getItem("shopCart")) || [];
        if (isPlus) cart[index].qty++;
        else cart[index].qty--;
        
        if (cart[index].qty <= 0) cart.splice(index, 1);
        
        localStorage.setItem("shopCart", JSON.stringify(cart));
        renderCart();
    }
    
    window.addEventListener("cartUpdated", () => {
        renderCart();
    });

    // ===========================
    // 4. 結帳功能 (保持不變)
    // ===========================
    if (checkoutBtn) {
        checkoutBtn.addEventListener("click", async () => {
            const currentUser = localStorage.getItem("currentUser");
            if (!currentUser) {
                alert("請先登入會員才能進行購買！\n(將跳轉至登入頁面)");
                window.location.href = "login.html"; 
                return;
            }

            const cart = JSON.parse(localStorage.getItem("shopCart")) || [];
            if (cart.length === 0) {
                alert("Cart is empty!");
                return;
            }

            const total = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
            
            const finalOrderItems = cart.map(item => {
                return {
                    name: item.name,
                    price: Number(item.price),
                    qty: Number(item.qty),
                    img: item.img || "" 
                };
            });

            let orderSummary = `您好! ${currentUser}\n準備購買:\n`;
            finalOrderItems.forEach(i => {
                orderSummary += `- ${i.name} x${i.qty} ($${i.price * i.qty})\n`;
            });
            orderSummary += `\n總金額： $${total}\n\n是否確認下單？`;

            if(!confirm(orderSummary)) return; 

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

                alert("您已訂購成功!\n訂單紀錄可於會員中心查詢");
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

// =========================================================
// 5. 核心函式：讀取商品詳情 (用 ID 抓 product1 這種文件名)
// =========================================================
async function loadProductDetail(container) {
    // 1. 抓取網址參數
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id"); // 這裡會抓到 "product1"

    if (!productId) {
        container.innerHTML = '<div style="text-align:center; padding:50px;">錯誤：網址沒有 ID 參數</div>';
        return;
    }

    try {
        console.log(`正在資料庫 products 資料夾中尋找文件名為 "${productId}" 的檔案...`);
        
        // ★★★ 關鍵在這裡 ★★★
        // doc(db, "products", productId) 
        // 意思就是：去 db 的 products 集合裡，抓叫做 productId (例如 product1) 的那份文件
        const docRef = doc(db, "products", productId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            console.log("找到商品了！", docSnap.data());
            const data = docSnap.data();
            // 這裡傳入 docSnap.id (就是 product1) 方便之後加購物車
            renderDetailHTML(container, data, docSnap.id);
        } else {
            console.warn("找不到文件:", productId);
            container.innerHTML = `<div style="text-align:center; padding:50px;">
                找不到商品: ${productId}<br>
                (請確認 Firebase 裡的 Document ID 是否真的是這個名字)
            </div>`;
        }

    } catch (error) {
        console.error("讀取商品失敗:", error);
        container.innerHTML = '<div style="text-align:center; padding:50px;">系統發生錯誤，請查看 Console。</div>';
    }
}

// 產生 HTML 畫面
function renderDetailHTML(container, product, id) {
    const imgSrc = product.img ? product.img : (product.image ? product.image : "https://via.placeholder.com/400?text=No+Image");
    let displayPrice = product.price;
    if (!String(displayPrice).includes("$")) displayPrice = `$${displayPrice}`;

    container.innerHTML = `
        <div class="detail-wrapper">
            <div class="detail-img">
                <img src="${imgSrc}" alt="${product.name}">
            </div>
            <div class="detail-info">
                <h1 class="detail-title">${product.name}</h1>
                <div class="detail-price">${displayPrice}</div>
                <p class="detail-desc">${product.description || "此商品暫無詳細描述。"}</p>
                
                <div class="action-area">
                    <div class="qty-selector">
                        <button id="btnMinus">-</button>
                        <input type="number" id="qtyInput" value="1" min="1" readonly>
                        <button id="btnPlus">+</button>
                    </div>
                    <button id="addToCartBtn" class="add-cart-btn">ADD TO CART</button>
                </div>
            </div>
        </div>
    `;

    // 綁定按鈕
    const btnMinus = document.getElementById("btnMinus");
    const btnPlus = document.getElementById("btnPlus");
    const qtyInput = document.getElementById("qtyInput");
    const addToCartBtn = document.getElementById("addToCartBtn");

    if (btnMinus && btnPlus && qtyInput) {
        btnMinus.addEventListener("click", () => {
            let val = parseInt(qtyInput.value);
            if (val > 1) qtyInput.value = val - 1;
        });
        btnPlus.addEventListener("click", () => {
            let val = parseInt(qtyInput.value);
            qtyInput.value = val + 1;
        });
    }

    if (addToCartBtn) {
        addToCartBtn.addEventListener("click", () => {
            let cart = JSON.parse(localStorage.getItem("shopCart")) || [];
            
            // 檢查購物車裡有沒有這個 ID (product1)
            const existingItemIndex = cart.findIndex(c => c.id === id);
            const qty = parseInt(qtyInput.value);

            if (existingItemIndex > -1) {
                cart[existingItemIndex].qty += qty;
            } else {
                cart.push({
                    id: id,
                    name: product.name,
                    price: parseInt(product.price), // 確保是數字
                    img: imgSrc,
                    qty: qty
                });
            }

            localStorage.setItem("shopCart", JSON.stringify(cart));
            alert(`${product.name} 已加入購物車！`);
            window.dispatchEvent(new Event("cartUpdated"));
        });
    }
}

