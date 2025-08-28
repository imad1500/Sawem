const amazonContainer = document.getElementById("amazon-products");
const aliContainer = document.getElementById("aliexpress-products");
const searchInput = document.getElementById("searchBox");

let products = [];

// Récupérer les produits depuis le backend
async function fetchProducts() {
  const res = await fetch("https://sawem-backend.onrender.com/products");
  products = await res.json();
  displayProducts(products);
}

// Formater le prix
function formatPrice(price, source) {
  if (source.toLowerCase() === "amazon") return price + " $";
  if (source.toLowerCase() === "aliexpress") return price.replace("?", "€");
  return price;
}

// Créer une carte produit avec vote
function createProductCard(product) {
  const card = document.createElement("div");
  card.className = "product-card";

  card.innerHTML = `
    <img src="${product.image}" alt="${product.title}">
    <h3>${product.title}</h3>
    <p class="price">${formatPrice(product.price, product.source)}</p>
    <p class="score">⭐ Note moyenne : ${product.user_rating || 0}</p>
    <input type="number" min="1" max="5" class="vote-input" placeholder="Vote (1-5)">
    <button class="vote-btn">Voter</button>
    <a href="${product.link}" target="_blank" class="btn">Voir le produit</a>
  `;

  const voteBtn = card.querySelector(".vote-btn");
  const voteInput = card.querySelector(".vote-input");
  const scoreElem = card.querySelector(".score");

  voteBtn.addEventListener("click", async () => {
    const stars = parseInt(voteInput.value);
    if (!stars || stars < 1 || stars > 5) return alert("Entrez une note valide (1-5)");

    const res = await fetch("https://sawem-backend.onrender.com/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: product.id, stars })
    });

    const data = await res.json();
    if (data.score) {
      product.user_rating = data.score;
      scoreElem.textContent = `⭐ Note moyenne : ${data.score}`;
      voteInput.value = "";
    }
  });

  return card;
}

// Affichage des produits
function displayProducts(productsList) {
  amazonContainer.innerHTML = "";
  aliContainer.innerHTML = "";

  productsList.forEach(product => {
    const card = createProductCard(product);
    if (product.source.toLowerCase() === "amazon") amazonContainer.appendChild(card);
    else if (product.source.toLowerCase() === "aliexpress") aliContainer.appendChild(card);
  });
}

// Recherche en temps réel
searchInput.addEventListener("input", () => {
  const term = searchInput.value.toLowerCase();
  const filtered = products.filter(p => p.title.toLowerCase().includes(term));
  displayProducts(filtered);
});

fetchProducts();
