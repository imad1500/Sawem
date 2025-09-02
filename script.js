const API_URL = "https://sawem-backend.onrender.com";

async function searchProducts(query) {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "⏳ Chargement des produits...";

  try {
    const response = await fetch(`${API_URL}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error("Erreur API");
    }

    const products = await response.json();

    if (!products || products.length === 0) {
      resultsDiv.innerHTML = "❌ Aucun produit trouvé.";
      return;
    }

    resultsDiv.innerHTML = products
      .map(
        (p) => `
        <div class="product-card">
          <img src="${p.image}" alt="${p.title}">
          <h3>${p.title}</h3>
          <p><strong>${p.price}</strong></p>
          <a href="${p.link}" target="_blank">Voir le produit</a>
        </div>
      `
      )
      .join("");
  } catch (err) {
    console.error(err);
    resultsDiv.innerHTML = "❌ Erreur lors du chargement des produits.";
  }
}

// 🎯 Attacher au bouton recherche
document.getElementById("searchBtn").addEventListener("click", () => {
  const query = document.getElementById("searchInput").value.trim();
  if (query) searchProducts(query);
});

// 🎯 Lancer une recherche par défaut au chargement
window.onload = () => {
  searchProducts("samsung");
};
