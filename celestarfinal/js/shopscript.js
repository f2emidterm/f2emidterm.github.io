
const products = [
    { id: 1, name: "BLUE OCEAN HOUR STICKER", price: "$20", category: "sticker", img: "images/stk1.jpg" },
    { id: 2, name: "SUNDAY BLUSH STICKER", price: "$20", category: "sticker", img: "images/stk2.jpg" },
    { id: 3, name: "LUCKY GREEN STICKER", price: "$20", category: "sticker", img: "images/stk3.jpg" },
    { id: 4, name: "LEMON MOOD STICKER", price: "$20", category: "sticker", img: "images/stk4.jpg" },
    { id: 5, name: "STRAWBERRY VIBES STICKER", price: "$20", category: "sticker", img: "images/stk5.jpg" },
    { id: 6, name: "MONOTONE DIARY STICKER", price: "$20", category: "sticker", img: "images/stk6.jpg" },
    { id: 7, name: "APPLE FLAVOR HAIRPIN", price: "$120", category: "accessory", img: "images/acc1.png" },
    { id: 8, name: "STARFISH RING", price: "$200", category: "accessory", img: "images/acc2.png" }
];

function getPerPage() {
    return window.innerWidth <= 600 ? 10 : 16;
}
let currentPage = 1;
let currentCategory = "all";

function renderProducts() {
    const grid = document.querySelector(".products");
    grid.innerHTML = "";

    const filtered =
        currentCategory === "all"
            ? products
            : products.filter((p) => p.category === currentCategory);

    const perPage = getPerPage();
    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    const pageItems = filtered.slice(start, end);

    if (pageItems.length === 0) {
        const noDiv = document.createElement("div");
        noDiv.className = "no-products";
        noDiv.textContent = "No products found.";
        grid.appendChild(noDiv);
        return;
    }

    pageItems.forEach((p) => {
        const card = document.createElement("div");
        card.className = "product-card";
        const imgSrc = p.img ? p.img : "https://via.placeholder.com/200/cccccc/808080?text=No+Image";
        card.innerHTML = `
          <a href="product.html?id=${p.id}">
            <div class="product-img">
              <img src="${imgSrc}" alt="${p.name}">
            </div>
            <div class="product-name">${p.name}</div>
            <div class="product-price">${p.price}</div>
          </a>
        `;
        grid.appendChild(card);
    });

    const fillCount = perPage - pageItems.length;
    for (let i = 0; i < fillCount; i++) {
        const card = document.createElement("div");
        card.className = "product-card";
        card.innerHTML = `
          <div class="product-img" style="background-color:#f0f0f0;"></div>
          <div class="product-name">PRODUCT NAME</div>
          <div class="product-price">$0</div>
        `;
        grid.appendChild(card);
    }
}


document.querySelectorAll(".filters button").forEach((btn) => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".filters button").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        currentCategory = btn.dataset.category;
        currentPage = 1;
        updatePagination();
    });
});

document.getElementById("page1").addEventListener("click", () => {
    currentPage = 1;
    updatePagination();
});
document.getElementById("page2").addEventListener("click", () => {
    currentPage = 2;
    updatePagination();
});
document.getElementById("prev").addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        updatePagination();
    }
});
document.getElementById("next").addEventListener("click", () => {
    if (currentPage < 2) {
        currentPage++;
        updatePagination();
    }
});

function updatePagination() {
    document.querySelectorAll(".pagination span").forEach((s) => s.classList.remove("active"));
    document.getElementById(`page${currentPage}`).classList.add("active");
    renderProducts();
}


renderProducts();

window.addEventListener("resize", () => {
    currentPage = 1;
    updatePagination();
});
