const backToTopBtn = document.getElementById("backToTopBtn");

window.onscroll = function () { scrollFunction() };

function scrollFunction() {
    if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
        backToTopBtn.style.display = "block";
    } else {
        backToTopBtn.style.display = "none";
    }
}

backToTopBtn.addEventListener("click", backToTop);

function backToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });

}

document.addEventListener("DOMContentLoaded", () => {
    const stickers = document.querySelectorAll(".sticker");
    const journal = document.getElementById("journal");

    if (!journal || stickers.length === 0) return;

    stickers.forEach(sticker => {
        sticker.addEventListener("click", () => {
            const clone = sticker.cloneNode(true);
            clone.classList.add("placed-sticker");

            clone.dataset.x = 0.5;
            clone.dataset.y = 0.5;
            updateStickerPosition(clone);

            journal.appendChild(clone);
            makeDraggable(clone);
        });
    });

    function makeDraggable(el) {
        let offsetX = 0;
        let offsetY = 0;

        el.addEventListener("mousedown", (e) => {
            e.preventDefault();
            offsetX = e.offsetX;
            offsetY = e.offsetY;

            const onMouseMove = (eMove) => {
                const rect = journal.getBoundingClientRect();

                const x = (eMove.clientX - rect.left - offsetX) / rect.width;
                const y = (eMove.clientY - rect.top - offsetY) / rect.height;

                el.dataset.x = x;
                el.dataset.y = y;

                updateStickerPosition(el);
            };


            const onMouseUp = () => {
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
            };

            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
        });
    }
    function updateStickerPosition(el) {
        const rect = journal.getBoundingClientRect();

        const x = el.dataset.x * rect.width;
        const y = el.dataset.y * rect.height;

        el.style.left = x + "px";
        el.style.top = y + "px";
    }
    window.addEventListener("resize", () => {
        document.querySelectorAll(".placed-sticker").forEach(sticker => {
            updateStickerPosition(sticker);
        });
    });
});

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // 1. 定義教學內容資料 (在這裡修改文字與圖片)
    // ==========================================
    const tutorialSteps = [
        {
            title: "什麼是 DAKKU (다꾸)?",
            desc: "DAKKU 源自韓語「裝飾日記 (Diary Kkumigi)」。這是一種透過貼紙、紙膠帶和照片來表達自我風格的療癒文化。",
            img: "images/tutorial_1.png" 
        },
        {
            title: "打造你的專屬電子手帳",
            desc: "在這裡，您可以用電子的方式體驗韓國流行的DAKKU!頁面的下方是您的貼紙庫，上方是您的筆記本。",
            img: "images/tutorial_2.png" 
        },
        {
            title: "拖放貼紙，自由拼貼",
            desc: "從貼紙庫中選擇喜歡的款式，「拖曳」到手帳頁面上。點擊貼紙還可以調整大小或旋轉！",
            img: "images/tutorial_3.png" 
        },
        {
            title: "開始您的創作之旅！",
            desc: "準備好了嗎？現在就開始製作屬於您的第一頁 DAKKU 手帳吧！完成後可以自行截圖保存喔。",
            img: "images/tutorial_4.png" 
        }
    ];

    // ==========================================
    // 2. 獲取 DOM 元素
    // ==========================================
    const overlay = document.getElementById("tutorialOverlay");
    const stepImage = document.getElementById("stepImage");
    const stepTitle = document.getElementById("stepTitle");
    const stepDesc = document.getElementById("stepDesc");
    const stepDotsContainer = document.getElementById("stepDots");
    const prevBtn = document.getElementById("prevStepBtn");
    const nextBtn = document.getElementById("nextStepBtn");
    const closeBtn = document.getElementById("skipTutorial");

    let currentStepIndex = 0;

    // ==========================================
    // 3. 核心功能函式
    // ==========================================

    // 檢查是否需要顯示教學 (使用 localStorage)
    function checkAndShowTutorial() {
        const hasSeenTutorial = sessionStorage.getItem("hasSeenDakkuTutorial");

        // 如果沒看過 (或是你想測試，可以先把 !hasSeenTutorial 拿掉，改成 true)
        if (!hasSeenTutorial) {
            // 延遲一點點顯示，讓畫面先載入
            setTimeout(() => {
                overlay.classList.add("active");
                renderStep(0);
            }, 500);
        }
    }

    // 渲染當前步驟的內容
    function renderStep(index) {
        const step = tutorialSteps[index];

        // 更新文字與圖片
        stepTitle.textContent = step.title;
        stepDesc.textContent = step.desc;
        stepImage.src = step.img;

        // 如果圖片路徑是空的或錯誤，可以用假圖代替 (測試用)
        stepImage.onerror = function () {
            this.src = 'https://via.placeholder.com/400x250/EFEEF2/3f4046?text=Image+' + (index + 1);
        };

        // 更新點點狀態
        updateDots(index);

        // 控制按鈕顯示
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

    // 更新進度點點
    function updateDots(index) {
        stepDotsContainer.innerHTML = "";
        tutorialSteps.forEach((_, i) => {
            const dot = document.createElement("span");
            dot.className = i === index ? "dot active" : "dot";
            stepDotsContainer.appendChild(dot);
        });
    }

    // 關閉教學並紀錄
    function closeTutorial() {
        overlay.classList.remove("active");
        // 紀錄到瀏覽器，下次就不會再彈出來了
        localStorage.setItem("hasSeenDakkuTutorial", "true");
    }

    // ==========================================
    // 4. 事件監聽
    // ==========================================

    // 下一步按鈕
    nextBtn.addEventListener("click", () => {
        if (currentStepIndex < tutorialSteps.length - 1) {
            currentStepIndex++;
            renderStep(currentStepIndex);
        } else {
            // 如果是最後一步，點擊就是關閉
            closeTutorial();
        }
    });

    // 上一步按鈕
    prevBtn.addEventListener("click", () => {
        if (currentStepIndex > 0) {
            currentStepIndex--;
            renderStep(currentStepIndex);
        }
    });

    // 關閉 (X) 按鈕
    closeBtn.addEventListener("click", closeTutorial);

    // ==========================================
    // 5. 啟動
    // ==========================================
    checkAndShowTutorial();
});
