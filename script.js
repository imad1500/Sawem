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

// Calculer la similarité cosinus
function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
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
      displayProducts(products);
    }
  });

  return card;
}

// Recherche par embedding
async function searchByEmbedding(term) {
  if (!term) return products;

  const res = await fetch("https://sawem-backend.onrender.com/products");
  const allProducts = await res.json();

  // Obtenir embedding du terme
  const embeddingRes = await fetch("https://sawem-embedding8.onrender.com/embed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: term })
  });
  const { embedding: termEmbedding } = await embeddingRes.json();

  // Calculer similarité cosinus
  allProducts.forEach(p => {
    p.similarity = cosineSimilarity(p.embedding, termEmbedding);
  });

  return allProducts.sort((a, b) => b.similarity - a.similarity);
}

// Affichage des produits
async function displayProducts(list, term = "") {
  amazonContainer.innerHTML = "";
  aliContainer.innerHTML = "";

  let listToDisplay = term ? await searchByEmbedding(term) : list;

  listToDisplay.forEach(product => {
    const card = createProductCard(product);
    if (product.source.toLowerCase() === "amazon") amazonContainer.appendChild(card);
    else if (product.source.toLowerCase() === "aliexpress") aliContainer.appendChild(card);
  });
}

// Recherche en temps réel
searchInput.addEventListener("input", async () => {
  const term = searchInput.value.trim();
  displayProducts(products, term);
});

fetchProducts();
