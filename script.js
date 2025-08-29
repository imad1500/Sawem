const amazonContainer = document.getElementById("amazon-products");
const aliContainer = document.getElementById("aliexpress-products");
const searchInput = document.getElementById("searchBox");

let products = [];

// Affichage des produits
function displayProducts(productsList) {
  amazonContainer.innerHTML = "";
  aliContainer.innerHTML = "";

  productsList.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${product.image}" alt="${product.title}">
      <h3>${product.title}</h3>
      <p class="price">${product.price}</p>
      <p>⭐ Score: ${product.sawem_score?.toFixed(2) || 0}</p>
      <input type="number" min="1" max="5" placeholder="Vote (1-5)" class="vote-input">
      <button class="vote-btn">Voter</button>
      <a href="${product.link}" target="_blank" class="btn">Voir le produit</a>
    `;
    const voteBtn = card.querySelector(".vote-btn");
    const voteInput = card.querySelector(".vote-input");

    voteBtn.addEventListener("click", async () => {
      const stars = parseInt(voteInput.value);
      if (!stars || stars < 1 || stars > 5) return alert("Vote invalide (1-5)");
      const res = await fetch("https://sawem-backend.onrender.com/vote", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({product_id: product.id, stars})
      });
      const data = await res.json();
      product.sawem_score = data.score;
      displayProducts(products);
    });

    if (product.source.toLowerCase() === "amazon") amazonContainer.appendChild(card);
    else aliContainer.appendChild(card);
  });
}

// Recherche intelligente
searchInput.addEventListener("input", async () => {
  const term = searchInput.value.trim();
  if (!term) return;

  const res = await fetch(`https://sawem-backend.onrender.com/search?query=${encodeURIComponent(term)}`);
  const results = await res.json();
  displayProducts(results);
});

// Afficher tous les produits au départ
async function fetchAllProducts() {
  const res = await fetch("https://sawem-backend.onrender.com/products");
  const allProducts = await res.json();
  products = allProducts;
  displayProducts(allProducts);
}

fetchAllProducts();
