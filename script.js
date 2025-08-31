const amazonContainer = document.getElementById("amazon-products");
const aliContainer = document.getElementById("aliexpress-products");
const searchInput = document.getElementById("searchBox");

let products = [];

// URL du service embeddings
const EMBEDDING_API_URL = "https://sawem-embedding8.onrender.com/embed";

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
      displayProducts(products, searchInput.value); // réaffichage pour trier après vote
    }
  });

  return card;
}

// Appel du service embeddings
async function getEmbedding(text) {
  try {
    const res = await fetch(EMBEDDING_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    if (!res.ok) throw new Error("Erreur API embeddings");
    const data = await res.json();
    return data.embedding;
  } catch (err) {
    console.error(err);
    return null;
  }
}

// Score de pertinence produit via embeddings
async function relevanceScoreEmbedding(product, searchEmbedding) {
  if (!searchEmbedding || !product.embedding) return 0;

  // Similarité cosinus
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < searchEmbedding.length; i++) {
    dot += (searchEmbedding[i] * product.embedding[i]);
    normA += searchEmbedding[i] * searchEmbedding[i];
    normB += product.embedding[i] * product.embedding[i];
  }
  const cosine = dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-10);
  // Combiner avec vote
  return 0.7 * cosine + 0.3 * (product.user_rating || 0)/5;
}

// Affichage des produits triés
async function displayProducts(productsList, searchTerm = "") {
  amazonContainer.innerHTML = "";
  aliContainer.innerHTML = "";

  let listToDisplay = [...productsList];

  if (searchTerm) {
    const searchEmbedding = await getEmbedding(searchTerm);
    // Trier par pertinence via embeddings
    listToDisplay.sort(async (a, b) => {
      const scoreA = await relevanceScoreEmbedding(a, searchEmbedding);
      const scoreB = await relevanceScoreEmbedding(b, searchEmbedding);
      return scoreB - scoreA;
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

// Initialisation
fetchProducts();
