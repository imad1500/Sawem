// Sélection des éléments DOM
const searchBox = document.getElementById("searchBox");
const searchBtn = document.getElementById("searchBtn");
const productsGrid = document.getElementById("products-grid");

let allProducts = []; // Liste des produits chargés depuis ton backend

/**
 * Rendu des produits dans la grille
 */
function renderProducts(products) {
  productsGrid.innerHTML = "";

  if (products.length === 0) {
    productsGrid.innerHTML = "<p>Aucun produit trouvé.</p>";
    return;
  }

  products.forEach(product => {
    const card = document.createElement("div");
    card.classList.add("product-card");
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <h3>${product.name}</h3>
      <p class="price">${product.price}</p>
      <p class="score">⭐ ${product.score.toFixed(1)}</p>
      <a href="${product.link}" target="_blank" class="btn">Voir le produit</a>
    `;
    productsGrid.appendChild(card);
  });
}

/**
 * Chargement des produits depuis ton backend
 */
async function loadProducts() {
  try {
    const response = await fetch("http://localhost:5000/api/products"); // <-- adapte l’URL à ton API
    allProducts = await response.json();
    renderProducts(allProducts); // affichage initial
  } catch (err) {
    console.error("Erreur lors du chargement des produits :", err);
    productsGrid.innerHTML = "<p>Impossible de charger les produits.</p>";
  }
}

/**
 * Recherche avec embeddings
 */
async function searchProducts(query) {
  if (!query.trim()) {
    renderProducts(allProducts); // si vide → tout afficher
    return;
  }

  try {
    // 1. Obtenir l’embedding du texte recherché
    const embedRes = await fetch("https://sawem-embedding8.onrender.com/embed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: query })
    });

    const embedData = await embedRes.json();
    const queryEmbedding = embedData.embedding;

    // 2. Calculer la similarité cosinus pour chaque produit
    const ranked = allProducts.map(product => {
      return {
        ...product,
        similarity: cosineSimilarity(queryEmbedding, product.embedding)
      };
    });

    // 3. Trier par similarité décroissante
    ranked.sort((a, b) => b.similarity - a.similarity);

    // 4. Afficher les meilleurs résultats
    renderProducts(ranked.filter(p => p.similarity > 0.3)); // seuil ajustable

  } catch (err) {
    console.error("Erreur recherche embeddings :", err);
  }
}

/**
 * Calcul similarité cosinus
 */
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

// Événements
searchBtn.addEventListener("click", () => {
  searchProducts(searchBox.value);
});

searchBox.addEventListener("input", () => {
  if (!searchBox.value.trim()) {
    renderProducts(allProducts);
  }
});

// Charger les produits au démarrage
loadProducts();
