const amazonContainer = document.getElementById("amazon-products");
const aliContainer = document.getElementById("aliexpress-products");
const searchInput = document.getElementById("searchBox");

let products = [];
let productEmbeddings = []; // Stocke les embeddings des produits

// Récupérer les produits depuis le backend
async function fetchProducts() {
  const res = await fetch("https://sawem-backend.onrender.com/products");
  products = await res.json();

  // Créer embeddings des titres de produits
  for (let product of products) {
    const embRes = await fetch("https://sawem-embedding8.onrender.com/embed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: product.title })
    });
    const data = await embRes.json();
    productEmbeddings.push(data.embedding);
  }

  displayProducts(products);
}

// Calculer similarité cosinus entre deux vecteurs
function cosineSimilarity(vecA, vecB) {
  let dot = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Créer carte produit
function createProductCard(product) {
  const card = document.createElement("div");
  card.className = "product-card";

  card.innerHTML = `
    <img src="${product.image}" alt="${product.title}">
    <h3>${product.title}</h3>
    <p class="price">${product.price}</p>
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

// Affichage des produits triés par similarité avec recherche
async function displayProducts(productsList, searchTerm = "") {
  amazonContainer.innerHTML = "";
  aliContainer.innerHTML = "";

  let listToDisplay = productsList;

  if (searchTerm) {
    // Créer embedding du terme de recherche
    const res = await fetch("https://sawem-embedding8.onrender.com/embed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: searchTerm })
    });
    const data = await res.json();
    const searchEmbedding = data.embedding;

    // Trier par similarité cosinus
    listToDisplay = [...productsList].sort((a, b) => {
      const idxA = products.indexOf(a);
      const idxB = products.indexOf(b);
      const simA = cosineSimilarity(searchEmbedding, productEmbeddings[idxA]);
      const simB = cosineSimilarity(searchEmbedding, productEmbeddings[idxB]);
      return simB - simA;
    });
  }

  listToDisplay.forEach(product => {
    const card = createProductCard(product);
    if (product.source.toLowerCase() === "amazon") amazonContainer.appendChild(card);
    else if (product.source.toLowerCase() === "aliexpress") aliContainer.appendChild(card);
  });
}

// Recherche en temps réel
searchInput.addEventListener("input", () => {
  const term = searchInput.value;
  displayProducts(products, term);
});

fetchProducts();
