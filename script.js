const amazonContainer = document.getElementById("amazon-products");
const aliContainer = document.getElementById("aliexpress-products");
const searchInput = document.getElementById("searchBox");

let products = [];

// Récupérer les produits depuis le backend
async function fetchProducts() {
  try {
    const res = await fetch("https://sawem-backend.onrender.com/products");
    products = await res.json();
    displayProducts(products);
  } catch (err) {
    console.error("Erreur lors du fetch des produits :", err);
  }
}

function displayProducts(productsArray) {
  amazonContainer.innerHTML = "";
  aliContainer.innerHTML = "";

  productsArray.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${product.image}" alt="${product.title}">
      <h3>${product.title}</h3>
      <p class="price">${product.price}</p>
      <a href="${product.link}" target="_blank" class="btn">Voir le produit</a>
    `;
    if (product.source.toLowerCase() === "amazon") amazonContainer.appendChild(card);
    if (product.source.toLowerCase() === "aliexpress") aliContainer.appendChild(card);
  });
}

// Recherche en temps réel
searchInput.addEventListener("input", () => {
  const term = searchInput.value.toLowerCase();
  const filtered = products.filter(p => p.title.toLowerCase().includes(term));
  displayProducts(filtered);
});

// Initialiser
fetchProducts();
