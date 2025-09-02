const API_URL = "https://sawem-backend.onrender.com/search";

async function searchProducts() {
  const query = document.getElementById("search-input").value.trim();
  const resultsDiv = document.getElementById("results");

  resultsDiv.innerHTML = "⏳ Chargement des produits...";

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error("Erreur API backend");
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
          <p>💰 ${p.price}</p>
          <p>⭐ ${p.user_rating || "N/A"} | 🔥 Score: ${p.sawem_score || "N/A"}</p>
          <a href="${p.link}" target="_blank">Voir le produit</a>
        </div>
      `
      )
      .join("");
  } catch (err) {
    console.error("Erreur fetch:", err);
    resultsDiv.innerHTML = "❌ Erreur lors du chargement des produits.";
  }
}

// Recherche automatique au clic
document
  .getElementById("search-btn")
  .addEventListener("click", searchProducts);

// Recherche avec touche "Entrée"
document
  .getElementById("search-input")
  .addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      searchProducts();
    }
  });
