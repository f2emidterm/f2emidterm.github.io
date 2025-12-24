/* ========================================= */
/* 2. Main Logic (DOM 載入後執行)             */
/* ========================================= */
document.addEventListener("DOMContentLoaded", () => {

    // --- 變數宣告 ---
    const stickers = document.querySelectorAll(".sticker");
    const journal = document.getElementById("journal");
    const downloadBtn = document.getElementById("downloadBtn");

    // ==========================================
    // 功能 A: 點擊空白處取消選取
    // ==========================================
    document.addEventListener("click", (e) => {
        // 如果點擊的目標不是 "placed-sticker" 或是它的子元素 (按鈕)
        if (!e.target.closest(".placed-sticker")) {
            document.querySelectorAll(".placed-sticker.active").forEach(el => {
                el.classList.remove("active");
            });
        }
    });
    // 手機版也需要監聽 touchstart 來取消選取
    document.addEventListener("touchstart", (e) => {
        if (!e.target.closest(".placed-sticker")) {
            document.querySelectorAll(".placed-sticker.active").forEach(el => {
                el.classList.remove("active");
            });
        }
    });

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
    if (journal && stickers.length > 0) {

        // 1. 點擊素材庫貼紙 -> 生成到手帳上
        stickers.forEach(sticker => {
            sticker.addEventListener("click", () => {
                createSticker(sticker);
            });
        });
    }

    function createSticker(originalSticker) {
        const imgClone = originalSticker.cloneNode(true);

        // 建立一個 wrapper (容器)
        const wrapper = document.createElement("div");
        wrapper.classList.add("placed-sticker");

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

        // 綁定互動事件
        initStickerInteraction(wrapper);

        activateSticker(wrapper);
    }

    // --- 輔助函式: 初始化單個貼紙的互動 ---
    function initStickerInteraction(el) {
        const deleteBtn = el.querySelector(".btn-delete");
        const transformBtn = el.querySelector(".btn-transform");

        // A. 點擊本體 (選取 + 移動) - 支援滑鼠與觸控
        const startMoveHandler = (e) => {
            if (e.target.closest(".sticker-control")) return;
            // 如果是觸控，阻止預設行為 (防止畫面捲動)
            if (e.type === 'touchstart') {
                e.preventDefault();
            }
            e.stopPropagation();
            activateSticker(el);
            startDrag(e, el);
        };
        el.addEventListener("mousedown", startMoveHandler);
        el.addEventListener("touchstart", startMoveHandler, { passive: false });

        // B. 點擊刪除按鈕
        const deleteHandler = (e) => {
            e.stopPropagation();
            e.preventDefault(); // 防止觸發其他事件
            el.remove();
        };
        deleteBtn.addEventListener("mousedown", deleteHandler);
        deleteBtn.addEventListener("touchstart", deleteHandler, { passive: false });

        // C. 點擊變形按鈕 (旋轉 + 縮放)
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

        // 取得初始座標 (統一處理滑鼠/觸控)
        const pos = getClientPos(e);
        const startX = pos.x;
        const startY = pos.y;

        const initialLeft = parseFloat(el.style.left || 0);
        const initialTop = parseFloat(el.style.top || 0);

        const onMove = (eMove) => {
            // 手機拖曳時防止畫面捲動
            if (eMove.type === 'touchmove') eMove.preventDefault();

            const movePos = getClientPos(eMove);
            const dx = movePos.x - startX;
            const dy = movePos.y - startY;

            let newLeft = initialLeft + dx;
            let newTop = initialTop + dy;

            el.dataset.x = newLeft / rect.width;
            el.dataset.y = newTop / rect.height;

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
        // 新增觸控監聽 (passive: false 允許 preventDefault)
        document.addEventListener("touchmove", onMove, { passive: false });
        document.addEventListener("touchend", onEnd);
    }

    // --- 輔助函式: 處理變形 (Transform) ---
    function startTransform(e, el) {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const pos = getClientPos(e);

        // 計算初始角度與距離
        const startAngle = Math.atan2(pos.y - centerY, pos.x - centerX);
        const startDist = Math.hypot(pos.x - centerX, pos.y - centerY);

        const initialRotation = parseFloat(el.dataset.rotation || 0);
        const initialScale = parseFloat(el.dataset.scale || 1);

        const onMove = (eMove) => {
            if (eMove.type === 'touchmove') eMove.preventDefault();

            const movePos = getClientPos(eMove);

            // 1. 計算旋轉
            const currentAngle = Math.atan2(movePos.y - centerY, movePos.x - centerX);
            const rotationChange = currentAngle - startAngle;
            const rotationDeg = rotationChange * (180 / Math.PI);

            // 2. 計算縮放
            const currentDist = Math.hypot(movePos.x - centerX, movePos.y - centerY);
            const scaleChange = currentDist / startDist;

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

    // --- 輔助函式: 更新畫面 (Render) ---
    function updateStickerVisuals(el) {
        if (!journal) return;
        const journalRect = journal.getBoundingClientRect();

        const x = parseFloat(el.dataset.x) * journalRect.width;
        const y = parseFloat(el.dataset.y) * journalRect.height;
        const rot = parseFloat(el.dataset.rotation || 0);
        const scale = parseFloat(el.dataset.scale || 1);

        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.transform = `translate(-50%, -50%) rotate(${rot}deg) scale(${scale})`;
    }

    function activateSticker(el) {
        document.querySelectorAll(".placed-sticker.active").forEach(s => s.classList.remove("active"));
        el.classList.add("active");
    }

    // RWD 修正位置
    window.addEventListener("resize", () => {
        document.querySelectorAll(".placed-sticker").forEach(el => {
            updateStickerVisuals(el);
        });
    });

    // ==========================================
    // 功能 C: 下載圖片 & 顯示使用商品 (Update)
    // ==========================================

    // 1. 定義商品資料庫 (必須跟 shop/main.js 的資料一致，才能正確連結)
    // 如果圖片檔名跟這裡不一樣，請記得修改這裡的 img 路徑
    const productDatabase = [
        { id: 1, name: "BLUE OCEAN HOUR STICKER", price: "$20", img: "images/d1.png" },
        { id: 2, name: "SUNDAY BLUSH STICKER", price: "$20", img: "images/d2.png" },
        { id: 3, name: "LUCKY GREEN STICKER", price: "$20", img: "images/d3.png" },
        { id: 4, name: "LEMON MOOD STICKER", price: "$20", img: "images/d4.png" },
        { id: 5, name: "STRAWBERRY VIBES STICKER", price: "$20", img: "images/d5.png" },
        { id: 6, name: "MONOTONE DIARY STICKER", price: "$20", img: "images/d6.png" },
        { id: 7, name: "APPLE FLAVOR HAIRPIN", price: "$120", img: "images/d7.png" },
        { id: 8, name: "STARFISH RING", price: "$200", img: "images/d8.png" },
    ];

    if (downloadBtn && journal) {
        downloadBtn.addEventListener("click", () => {
            // 1. 取消選取框 (避免截圖到框框)
            document.querySelectorAll(".placed-sticker.active").forEach(s => s.classList.remove("active"));

            // 2. 執行截圖下載
            if (typeof html2canvas !== 'undefined') {
                html2canvas(journal, {
                    scale: 2,
                    backgroundColor: null
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
                alert("下載功能載入中，請稍後再試。");
            }
           
        });
    }

    // --- 顯示使用商品清單 (下拉選單版) ---
    function showUsedProducts() {
        console.log("開啟商品清單...");

        const popup = document.getElementById("usedProductsPopup");
        const listContainer = document.getElementById("usedProductList");
        const closeBtn = document.getElementById("closeProductPopupBtn");

        if (!popup || !listContainer) return;

        const placedImages = document.querySelectorAll(".placed-sticker img");
        const usedItems = new Set();
        placedImages.forEach(img => {
            const src = img.src;
            const product = productDatabase.find(p => src.includes(p.img));
            if (product) usedItems.add(product);
        });

        listContainer.innerHTML = "";
        if (usedItems.size === 0) {
            listContainer.innerHTML = '<p style="text-align:center; padding:15px; color:#999; font-size:12px;">尚未使用素材</p>';
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

        // 顯示下拉選單
        popup.classList.add("active");

        // 綁定關閉
        if (closeBtn) {
            closeBtn.onclick = (e) => {
                e.stopPropagation(); // 防止點擊關閉時觸發其他事件
                popup.classList.remove("active");
            };
        }

        // 延遲一點點再綁定，避免按下載按鈕的瞬間就觸發關閉
        setTimeout(() => {
            document.addEventListener('click', closeDropdown);
        }, 100);
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
    const closeBtn = document.getElementById("skipTutorial");

    let currentStepIndex = 0;

    if (overlay) {
        const hasSeenTutorial = sessionStorage.getItem("hasSeenDakkuTutorial");
        if (!hasSeenTutorial) {
            setTimeout(() => {
                overlay.classList.add("active");
                renderStep(0);
            }, 500);
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

        closeBtn.addEventListener("click", closeTutorial);
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
        localStorage.setItem("hasSeenDakkuTutorial", "true");
    }
});
document.addEventListener('DOMContentLoaded', function() {
    
    // 1. 抓取元素
    const tutorialOverlay = document.querySelector('.tutorial-overlay');
    const helpBtn = document.getElementById('helpBtn');
    const closeTutorialBtn = document.querySelector('.close-tutorial-btn'); 
    
    // 2. 點擊 "?" 按鈕 -> 顯示彈窗
    if(helpBtn && tutorialOverlay) {
        helpBtn.addEventListener('click', function() {
            tutorialOverlay.classList.add('active'); // 加回 active class
        });
    }
});
// ==========================================
// 功能 E: 按鈕填色動畫 (Ripple Effect)
// ==========================================
const btn = document.querySelector('.ripple-btn');
if (btn) {
    btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        // 計算滑鼠相對於按鈕左上角的座標
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // 設定 CSS 變數，讓 ::before 圓圈移到滑鼠位置
        btn.style.setProperty('--x', x + 'px');
        btn.style.setProperty('--y', y + 'px');
    });
}


