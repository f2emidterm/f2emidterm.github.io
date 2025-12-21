/* ========================================= */
/* 1. 強制重置 (加入這段在最上面)              */
/* ========================================= */

// A. 告訴瀏覽器：「不要記住捲動位置」，改由我們手動控制
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

// B. 當頁面載入完成時，強制回到頂部並鎖定
window.addEventListener('load', () => {
    // 1. 瞬間回到頂部 (0, 0)
    window.scrollTo(0, 0);
    
    // 2. 確保鎖定捲動的 class 有加上
    document.body.classList.add('lock-scroll');

    // 3. 重置過場 SVG 狀態 (移除 active)
    const deco = document.querySelector('.between-deco');
    if (deco) {
        deco.classList.remove('active');
        deco.classList.remove('in-view');
    }

    // 4. 重置所有彈出視窗 (讓它們回到預設顯示狀態)
    // 這裡假設 HTML 裡 window-1 預設有 show，我們確保邏輯重跑
    const windows = document.querySelectorAll('.about-window');
    windows.forEach(win => {
        // 如果你需要重置動畫，可以先移除 show 再加回去 (視你的 CSS 動畫設定而定)
        // 但通常重新整理頁面 HTML 會重置，所以只要確保捲動位置對即可
    });
});

// C. 防止離開頁面時會有殘影 (可選)
window.addEventListener('beforeunload', () => {
    window.scrollTo(0, 0);
});

/* ===== Back to top ===== */
const backToTopBtn = document.getElementById("backToTopBtn");

window.addEventListener('scroll', () => {
  // 加上防呆，避免元素不存在報錯
  if (backToTopBtn) {
      if (document.documentElement.scrollTop > 1700) {
        backToTopBtn.style.display = "block";
      } else {
        backToTopBtn.style.display = "none";
      }
  }
});

if (backToTopBtn) {
    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}


/* ===== 疊加視窗 + 過場控制 ===== */
const closeBtns = document.querySelectorAll('.close-btn');
const betweenDeco = document.querySelector('.between-deco');

closeBtns.forEach((btn, index) => {
  btn.addEventListener('click', () => {

    const next = btn.dataset.next;

    // 邏輯：按下第一個視窗(Window 1)的按鈕時，觸發後續效果
    if (index === 0) {
      
      // 1. 解鎖捲動 (讓使用者可以往下滑看到網站內容)
      document.body.classList.remove('lock-scroll');

      // 2. 顯示過場 SVG 橋樑
      if (betweenDeco) {
        betweenDeco.classList.add('active');
      }
    }

    // 顯示下一個視窗 (Window 2)
    if (next) {
      const nextWindow = document.querySelector(`.${next}`);
      if (nextWindow) {
        // 稍微延遲一點點跳出，增加層次感
        setTimeout(() => {
            nextWindow.classList.add('show');
        }, 200); 
      }
    }
    
  });
});


/* ===== Scroll Observe Animation ===== */
const observerOptions = {
  root: null,
  threshold: 0.2
};

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
    }
  });
}, observerOptions);


// observe 通用元素
document.querySelectorAll('.observe').forEach(el => observer.observe(el));

// 書本
const book = document.querySelector('.book-section');
if (book) observer.observe(book);

/* ===== Philosophy 星星專用 observer（漂浮用） ===== */
const philosophy = document.querySelector('.about-philosophy');
const stars = document.querySelectorAll('.star');

if (philosophy) {
  const philoObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        philosophy.classList.add('in-view');

        // 等進場動畫跑完，再開始漂浮
        setTimeout(() => {
          stars.forEach(star => star.classList.add('float'));
        }, 3000); 
      }
    });
  }, { threshold: 0.3 });

  philoObserver.observe(philosophy);
}

// 過場 SVG（淡入）
if (betweenDeco) observer.observe(betweenDeco);