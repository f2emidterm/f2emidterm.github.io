// =========================================
// 1. 引入 Firebase 與所需模組
// =========================================
import { db } from './firebase.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 用來儲存「商品 ID -> 商品詳細資料」的對照表
let productsMap = {}; 

/* ========================================= */
/* 2. Main Logic (DOM 載入後執行)             */
/* ========================================= */
document.addEventListener("DOMContentLoaded", async () => {

    // --- 變數宣告 ---
    const journal = document.getElementById("journal");
    const downloadBtn = document.getElementById("downloadBtn");
    const palette = document.getElementById("stickerPalette"); // 貼紙庫容器

    // ==========================================
    // 功能 NEW: 從 Firebase 讀取資料 (雙集合)
    // ==========================================
    async function initData() {
        try {
            console.log("開始讀取 Firebase 資料...");
            
            // 1. 同時並行讀取 products 和 stickers (速度較快)
            const [productsSnapshot, stickersSnapshot] = await Promise.all([
                getDocs(collection(db, "products")),
                getDocs(collection(db, "stickers"))
            ]);

            // 2. 處理商品資料 -> 建立對照表 (Map)
            productsMap = {};
            productsSnapshot.forEach((doc) => {
                const data = doc.data();
                // 使用 doc.id 作為 Key，方便之後用 ID 快速查找商品資訊
                productsMap[doc.id] = {
                    id: doc.id,
                    name: data.name,
                    price: data.price,
                    img: data.img // 商品封面圖
                };
            });
            console.log("商品載入完成，共:", Object.keys(productsMap).length, "個");

            // 3. 處理貼紙資料 -> 生成 UI
            palette.innerHTML = ""; // 清空 Loading

            if (stickersSnapshot.empty) {
                palette.innerHTML = "<p>目前沒有貼紙可使用。</p>";
                return;
            }

            stickersSnapshot.forEach((doc) => {
                const data = doc.data();
                
                // 建立圖片
                const img = document.createElement("img");
                img.src = data.img; // 假設 sticker 集合裡的圖片欄位也是 'img'
                img.className = "sticker";
                img.alt = "sticker";
                img.crossOrigin = "anonymous"; // 避免截圖跨域問題

                // ★★★ 關鍵：連結貼紙與商品 ★★★
                // 假設你在 stickers 集合的文件裡，有一個欄位叫 'productId' 儲存對應的商品 ID
                if (data.productId) {
                    img.dataset.productId = data.productId;
                } else {
                    console.warn("這張貼紙沒有設定 productId:", doc.id);
                }

                // 綁定點擊事件
                img.addEventListener("click", () => {
                    createSticker(img);
                });

                palette.appendChild(img);
            });

        } catch (error) {
            console.error("Firebase 讀取失敗:", error);
            palette.innerHTML = "<p style='color:red; padding:10px;'>資料載入失敗，請檢查網路或 Console。</p>";
        }
    }

    // 執行初始化
    await initData();


    // ==========================================
    // 功能 A: 點擊空白處取消選取
    // ==========================================
    const deselectHandler = (e) => {
        if (!e.target.closest(".placed-sticker")) {
            document.querySelectorAll(".placed-sticker.active").forEach(el => {
                el.classList.remove("active");
            });
        }
    };
    document.addEventListener("click", deselectHandler);
    document.addEventListener("touchstart", deselectHandler);

    // ==========================================
    // 統一取得座標 (滑鼠/觸控) 
    // ==========================================
    function getClientPos(e) {
        if (e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    }

    // ==========================================
    // 功能 B: 貼紙生成與互動系統 (核心功能)
    // ==========================================
    function createSticker(originalSticker) {
        const imgClone = originalSticker.cloneNode(true);
        const wrapper = document.createElement("div");
        wrapper.classList.add("placed-sticker");

        // ★★★ 傳遞 Product ID 到畫布上的元素 ★★★
        if (originalSticker.dataset.productId) {
            wrapper.dataset.productId = originalSticker.dataset.productId;
        }

        // 初始化數據
        wrapper.dataset.x = 0.4;
        wrapper.dataset.y = 0.4;
        wrapper.dataset.rotation = 0;
        wrapper.dataset.scale = 1;

        // 設定 wrapper 樣式
        wrapper.style.position = "absolute";
        wrapper.style.width = "fit-content";
        wrapper.style.height = "fit-content";
        wrapper.style.transformOrigin = "center center";

        // 設定圖片樣式
        imgClone.classList.remove("sticker");
        imgClone.style.width = "100px";
        imgClone.style.height = "auto";
        imgClone.style.display = "block";
        imgClone.style.pointerEvents = "none";
        imgClone.draggable = false;

        // 控制按鈕 HTML
        const controlsHTML = `
            <div class="sticker-control btn-delete" title="刪除">
                <span class="material-symbols-outlined">close</span>
            </div>
            <div class="sticker-control btn-transform" title="旋轉/縮放">
                <span class="material-symbols-outlined">sync_alt</span>
            </div>
        `;

        wrapper.appendChild(imgClone);
        wrapper.innerHTML += controlsHTML;

        journal.appendChild(wrapper);
        updateStickerVisuals(wrapper);

        initStickerInteraction(wrapper);
        activateSticker(wrapper);
    }

    // --- 輔助函式: 初始化單個貼紙的互動 ---
    function initStickerInteraction(el) {
        const deleteBtn = el.querySelector(".btn-delete");
        const transformBtn = el.querySelector(".btn-transform");

        // A. 移動
        const startMoveHandler = (e) => {
            if (e.target.closest(".sticker-control")) return;
            if (e.type === 'touchstart') e.preventDefault();
            e.stopPropagation();
            activateSticker(el);
            startDrag(e, el);
        };
        el.addEventListener("mousedown", startMoveHandler);
        el.addEventListener("touchstart", startMoveHandler, { passive: false });

        // B. 刪除
        const deleteHandler = (e) => {
            e.stopPropagation();
            e.preventDefault();
            el.remove();
        };
        deleteBtn.addEventListener("mousedown", deleteHandler);
        deleteBtn.addEventListener("touchstart", deleteHandler, { passive: false });

        // C. 變形
        const transformHandler = (e) => {
            e.stopPropagation();
            e.preventDefault();
            startTransform(e, el);
        };
        transformBtn.addEventListener("mousedown", transformHandler);
        transformBtn.addEventListener("touchstart", transformHandler, { passive: false });
    }

    // --- 輔助函式: 處理拖曳 (Move) ---
    function startDrag(e, el) {
        const rect = journal.getBoundingClientRect();
        const pos = getClientPos(e);
        const startX = pos.x;
        const startY = pos.y;
        const initialLeft = parseFloat(el.style.left || 0);
        const initialTop = parseFloat(el.style.top || 0);

        const onMove = (eMove) => {
            if (eMove.type === 'touchmove') eMove.preventDefault();
            const movePos = getClientPos(eMove);
            const dx = movePos.x - startX;
            const dy = movePos.y - startY;
            
            el.dataset.x = (initialLeft + dx) / rect.width;
            el.dataset.y = (initialTop + dy) / rect.height;
            updateStickerVisuals(el);
        };

        const onEnd = () => {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onEnd);
            document.removeEventListener("touchmove", onMove);
            document.removeEventListener("touchend", onEnd);
        };

        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onEnd);
        document.addEventListener("touchmove", onMove, { passive: false });
        document.addEventListener("touchend", onEnd);
    }

    // --- 輔助函式: 處理變形 (Transform) ---
    function startTransform(e, el) {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const pos = getClientPos(e);

        const startAngle = Math.atan2(pos.y - centerY, pos.x - centerX);
        const startDist = Math.hypot(pos.x - centerX, pos.y - centerY);
        const initialRotation = parseFloat(el.dataset.rotation || 0);
        const initialScale = parseFloat(el.dataset.scale || 1);

        const onMove = (eMove) => {
            if (eMove.type === 'touchmove') eMove.preventDefault();
            const movePos = getClientPos(eMove);
            const currentAngle = Math.atan2(movePos.y - centerY, movePos.x - centerX);
            const rotationDeg = (currentAngle - startAngle) * (180 / Math.PI);
            const scaleChange = Math.hypot(movePos.x - centerX, movePos.y - centerY) / startDist;

            el.dataset.rotation = initialRotation + rotationDeg;
            el.dataset.scale = Math.max(0.3, initialScale * scaleChange);
            updateStickerVisuals(el);
        };

        const onEnd = () => {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onEnd);
            document.removeEventListener("touchmove", onMove);
            document.removeEventListener("touchend", onEnd);
        };

        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onEnd);
        document.addEventListener("touchmove", onMove, { passive: false });
        document.addEventListener("touchend", onEnd);
    }

    function updateStickerVisuals(el) {
        if (!journal) return;
        const rect = journal.getBoundingClientRect();
        const x = parseFloat(el.dataset.x) * rect.width;
        const y = parseFloat(el.dataset.y) * rect.height;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.transform = `translate(-50%, -50%) rotate(${el.dataset.rotation}deg) scale(${el.dataset.scale})`;
    }

    function activateSticker(el) {
        document.querySelectorAll(".placed-sticker.active").forEach(s => s.classList.remove("active"));
        el.classList.add("active");
    }

    window.addEventListener("resize", () => {
        document.querySelectorAll(".placed-sticker").forEach(updateStickerVisuals);
    });

    // ==========================================
    // 功能 C: 下載圖片 & 顯示使用商品 (Update)
    // ==========================================

    if (downloadBtn && journal) {
        downloadBtn.addEventListener("click", () => {
            // 1. 取消選取
            document.querySelectorAll(".placed-sticker.active").forEach(s => s.classList.remove("active"));

            // 2. 截圖
            if (typeof html2canvas !== 'undefined') {
                html2canvas(journal, {
                    scale: 2,
                    backgroundColor: null,
                    useCORS: true 
                }).then(canvas => {
                    const link = document.createElement("a");
                    link.download = "my-dakku.png";
                    link.href = canvas.toDataURL("image/png");
                    link.click();

                    showUsedProducts();

                }).catch(err => {
                    console.error("下載失敗:", err);
                    alert("下載發生錯誤，請稍後再試。");
                });
            } else {
                alert("下載功能載入中...");
            }
        });
    }

    // --- 顯示使用商品清單 (Update: 查詢 productsMap) ---
    function showUsedProducts() {
        const popup = document.getElementById("usedProductsPopup");
        const listContainer = document.getElementById("usedProductList");
        
        // 抓取手帳上的貼紙
        const placedWrappers = document.querySelectorAll(".placed-sticker");
        
        const usedItems = new Set(); // 用 Set 避免重複商品

        placedWrappers.forEach(wrapper => {
            const pid = wrapper.dataset.productId;
            
            // 使用 ID 從我們一開始建立的 productsMap 中查找資料
            if (pid && productsMap[pid]) {
                usedItems.add(productsMap[pid]);
            }
        });

        listContainer.innerHTML = "";
        
        if (usedItems.size === 0) {
            listContainer.innerHTML = '<p style="text-align:center; padding:15px; color:#999; font-size:12px;">尚未使用素材或無法辨識商品</p>';
        } else {
            usedItems.forEach(p => {
                const itemHTML = `
                    <a href="product.html?id=${p.id}" class="used-product-item" target="_blank">
                        <img src="${p.img}" class="used-product-thumb" alt="${p.name}">
                        <div class="used-product-info">
                            <div class="used-product-name">${p.name}</div>
                        </div>
                    </a>
                `;
                listContainer.innerHTML += itemHTML;
            });
        }

        popup.classList.add("active");
        
        setTimeout(() => {
            const closeDropdown = (e) => {
                 if (!popup.contains(e.target) && !downloadBtn.contains(e.target)) {
                    popup.classList.remove("active");
                    document.removeEventListener('click', closeDropdown);
                 }
            };
            document.addEventListener('click', closeDropdown);
        }, 100);
    }
    
    const closeBtn = document.getElementById("closeProductPopupBtn");
    if (closeBtn) {
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            document.getElementById("usedProductsPopup").classList.remove("active");
        };
    }

    // ==========================================
    // 功能 D: 新手教學
    // ==========================================
    const tutorialSteps = [
        {
            title: "什麼是 DAKKU (다꾸)?",
            desc: "DAKKU 源自韓語「裝飾日記」。這是一種透過貼紙、紙膠帶和照片來表達自我風格的療癒文化。",
            img: "images/tutorial_1.png"
        },
        {
            title: "打造你的專屬電子手帳",
            desc: "在這裡，您可以用電子的方式體驗 DAKKU！左側/下方是您的貼紙庫，中間是您的筆記本。",
            img: "images/tutorial_2.png"
        },
        {
            title: "自由拼貼與調整",
            desc: "點擊貼紙庫即可貼上。點擊手帳上的貼紙可「選取」，拖曳右下角按鈕可「旋轉與縮放」。",
            img: "images/tutorial_3.png"
        },
        {
            title: "開始您的創作之旅！",
            desc: "準備好了嗎？完成後可以點擊「下載成圖片」保存您的作品喔！",
            img: "images/tutorial_4.png"
        }
    ];

    const overlay = document.getElementById("tutorialOverlay");
    const stepImage = document.getElementById("stepImage");
    const stepTitle = document.getElementById("stepTitle");
    const stepDesc = document.getElementById("stepDesc");
    const stepDotsContainer = document.getElementById("stepDots");
    const prevBtn = document.getElementById("prevStepBtn");
    const nextBtn = document.getElementById("nextStepBtn");
    const closeTutorialBtn = document.getElementById("skipTutorial");
    const helpBtn = document.getElementById("helpBtn");

    let currentStepIndex = 0;

    if (overlay) {
        const hasSeenTutorial = sessionStorage.getItem("hasSeenDakkuTutorial");
        if (!hasSeenTutorial) {
            setTimeout(() => {
                overlay.classList.add("active");
                renderStep(0);
            }, 500);
        }

        if(helpBtn) {
            helpBtn.addEventListener('click', function() {
                currentStepIndex = 0;
                renderStep(0);
                overlay.classList.add('active');
            });
        }

        nextBtn.addEventListener("click", () => {
            if (currentStepIndex < tutorialSteps.length - 1) {
                currentStepIndex++;
                renderStep(currentStepIndex);
            } else {
                closeTutorial();
            }
        });

        prevBtn.addEventListener("click", () => {
            if (currentStepIndex > 0) {
                currentStepIndex--;
                renderStep(currentStepIndex);
            }
        });

        closeTutorialBtn.addEventListener("click", closeTutorial);
    }

    function renderStep(index) {
        const step = tutorialSteps[index];
        stepTitle.textContent = step.title;
        stepDesc.textContent = step.desc;
        stepImage.src = step.img;
        stepImage.onerror = function () {
            this.src = 'https://via.placeholder.com/400x250/EFEEF2/3f4046?text=Step+' + (index + 1);
        };
        updateDots(index);

        if (index === 0) {
            prevBtn.style.display = "none";
            nextBtn.textContent = "下一步";
        } else if (index === tutorialSteps.length - 1) {
            prevBtn.style.display = "block";
            nextBtn.textContent = "開始體驗 GO!";
        } else {
            prevBtn.style.display = "block";
            nextBtn.textContent = "下一步";
        }
    }

    function updateDots(index) {
        stepDotsContainer.innerHTML = "";
        tutorialSteps.forEach((_, i) => {
            const dot = document.createElement("span");
            dot.className = i === index ? "dot active" : "dot";
            stepDotsContainer.appendChild(dot);
        });
    }

    function closeTutorial() {
        overlay.classList.remove("active");
        sessionStorage.setItem("hasSeenDakkuTutorial", "true");
    }

    // ==========================================
    // 功能 E: 按鈕填色動畫 (Ripple Effect)
    // ==========================================
    const rippleBtn = document.querySelector('.ripple-btn');
    if (rippleBtn) {
        rippleBtn.addEventListener('mousemove', (e) => {
            const rect = rippleBtn.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            rippleBtn.style.setProperty('--x', x + 'px');
            rippleBtn.style.setProperty('--y', y + 'px');
        });
    }
});
