const amazonContainer = document.getElementById("amazon-products");
const aliContainer = document.getElementById("aliexpress-products");
const searchBox = document.getElementById("searchBox");

async function fetchProducts() {
  const res = await fetch("/products"); // Node.js backend
  const products = await res.json();
  displayProducts(products);
}

function displayProducts(products) {
  amazonContainer.innerHTML = "";
  aliContainer.innerHTML = "";
  products.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${product.image}" alt="${product.title}">
      <h3>${product.title}</h3>
      <p class="price">${product.price}</p>
      <a href="${product.link}" target="_blank" class="btn">Voir le produit</a>
    `;
    if (product.source === "Amazon") amazonContainer.appendChild(card);
    else if (product.source === "AliExpress") aliContainer.appendChild(card);
  });
}

// Recherche en temps réel
searchBox.addEventListener("input", () => {
  const term = searchBox.value.toLowerCase();
  fetch("/products")
    .then(res => res.json())
    .then(products => {
      const filtered = products.filter(p => p.title.toLowerCase().includes(term));
      displayProducts(filtered);
    });
});

fetchProducts();
