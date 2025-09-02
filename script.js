const API_URL = "http://localhost:10000/search"; // change si ton backend est déployé

const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const productsDiv = document.getElementById("products");
const messageDiv = document.getElementById("message");

// Fonction d'affichage produits
function renderProducts(products) {
  productsDiv.innerHTML = "";
  messageDiv.textContent = "";

  if (!products || products.length === 0) {
    messageDiv.textContent = "❌ Aucun produit trouvé.";
    return;
  }

  products.forEach(p => {
    const div = document.createElement("div");
    div.className = "product";
    div.innerHTML = `
      <img src="${p.image}" alt="${p.title}">
      <h3>${p.title}</h3>
      <p>${p.price}</p>
      <a href="${p.link}" target="_blank">Voir le produit</a>
    `;
    productsDiv.appendChild(div);
  });
}

// Recherche API
async function searchProducts() {
  const query = searchInput.value.trim();
  if (!query) {
    messageDiv.textContent = "⚠️ Entrez un mot-clé pour rechercher.";
    return;
  }

  messageDiv.textContent = "⏳ Chargement des produits...";
  productsDiv.innerHTML = "";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(data.error || "Erreur inconnue");
    }

    renderProducts(data);
  } catch (err) {
    console.error("Erreur:", err);
    messageDiv.textContent = "❌ Erreur lors du chargement des produits.";
  }
}

// Événements
searchBtn.addEventListener("click", searchProducts);
searchInput.addEventListener("keypress", e => {
  if (e.key === "Enter") searchProducts();
});
