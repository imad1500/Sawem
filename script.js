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
      displayProducts(products); // réaffichage pour trier après vote
    }
  });

  return card;
}

// Calculer pertinence produit pour la recherche
function relevanceScore(product, term) {
  const title = product.title.toLowerCase();
  term = term.toLowerCase();
  const poidsTitre = 0.7;
  const poidsScore = 0.3;

  // Score de correspondance simple : +1 par mot exact présent
  const mots = term.split(" ").filter(m => m);
  let matchScore = 0;
  mots.forEach(m => {
    if (title.includes(m)) matchScore += 1;
  });

  const score = (matchScore * poidsTitre) + ((product.user_rating || 0) * poidsScore);
  return score;
}

// Affichage des produits triés
function displayProducts(productsList, searchTerm = "") {
  amazonContainer.innerHTML = "";
  aliContainer.innerHTML = "";

  let listToDisplay = productsList;

  if (searchTerm) {
    // Trier par pertinence
    listToDisplay = [...productsList].sort((a, b) => {
      return relevanceScore(b, searchTerm) - relevanceScore(a, searchTerm);
    });
  }

  listToDisplay.forEach(product => {
    const card = createProductCard(product);
    if (product.source.toLowerCase() === "amazon") amazonContainer.appendChild(card);
    else if (product.source.toLowerCase() === "aliexpress") aliContainer.appendChild(card);
  });
}

// Recherche intelligente en temps réel
searchInput.addEventListener("input", () => {
  const term = searchInput.value.toLowerCase();
  displayProducts(products, term);
});

fetchProducts();
