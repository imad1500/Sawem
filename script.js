const amazonContainer = document.getElementById("amazon-products");
const aliContainer = document.getElementById("aliexpress-products");
const searchInput = document.getElementById("searchBox");

let products = [];

// ⚡ Fonction utilitaire : calculer similarité cosinus
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// 🔹 Récupérer tous les produits depuis le backend
async function fetchProducts() {
  try {
    const res = await fetch("https://sawem-backend.onrender.com/products");
    products = await res.json();
    displayProducts(products);
  } catch (err) {
    console.error("Erreur fetch produits :", err);
    amazonContainer.innerHTML = "<p>Impossible de charger les produits</p>";
    aliContainer.innerHTML = "<p>Impossible de charger les produits</p>";
  }
}

// 🔹 Formater le prix selon la source
function formatPrice(price, source) {
  if (source.toLowerCase() === "amazon") return price + " $";
  if (source.toLowerCase() === "aliexpress") return price.replace("?", "€");
  return price;
}

// 🔹 Créer une carte produit
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

    try {
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
        displayProducts(products, searchInput.value); // réaffichage avec tri
      }
    } catch (err) {
      console.error("Erreur vote :", err);
      alert("Impossible d'envoyer votre vote");
    }
  });

  return card;
}

// 🔹 Recherche par embeddings
async function semanticSearch(term) {
  if (!term) return products;

  try {
    // Appel au service embeddings
    const resp = await fetch("https://sawem-embedding8.onrender.com/embed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: term })
    });
    const data = await resp.json();
    const queryEmbedding = data.embedding;

    // Calculer similarité cosinus
    return products
      .map(p => {
        return { ...p, relevance: cosineSimilarity(p.embedding, queryEmbedding) };
      })
      .sort((a, b) => b.relevance - a.relevance);
  } catch (err) {
    console.error("Erreur embeddings :", err);
    return products; // fallback si problème embeddings
  }
}

// 🔹 Afficher les produits
async function displayProducts(productsList, searchTerm = "") {
  amazonContainer.innerHTML = "";
  aliContainer.innerHTML = "";

  let listToDisplay = productsList;

  if (searchTerm) {
    listToDisplay = await semanticSearch(searchTerm);
  }

  listToDisplay.forEach(product => {
    const card = createProductCard(product);
    if (product.source.toLowerCase() === "amazon") amazonContainer.appendChild(card);
    else if (product.source.toLowerCase() === "aliexpress") aliContainer.appendChild(card);
  });
}

// 🔹 Recherche en temps réel
searchInput.addEventListener("input", async () => {
  const term = searchInput.value.trim();
  await displayProducts(products, term);
});

// ⚡ Initialisation
fetchProducts();
