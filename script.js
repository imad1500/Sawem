async function searchProducts() {
  const query = document.getElementById("searchInput").value.trim();
  const productsContainer = document.getElementById("products");
  productsContainer.innerHTML = "⏳ Chargement des produits...";

  try {
    const response = await fetch("https://sawem-backend.onrender.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error("Erreur réseau lors de la recherche");
    }

    const products = await response.json();

    if (!products || products.length === 0) {
      productsContainer.innerHTML = "⚠️ Aucun produit trouvé.";
      return;
    }

    // Afficher les produits
    productsContainer.innerHTML = products.map(p => `
      <div class="product">
        <img src="${p.image}" alt="${p.title}" />
        <h3>${p.title}</h3>
        <p>${p.price}</p>
        <a href="${p.link}" target="_blank">Voir le produit</a>
        <small>Source: ${p.source}</small>
      </div>
    `).join("");

  } catch (err) {
    console.error("Erreur lors du chargement:", err);
    productsContainer.innerHTML = "❌ Erreur lors du chargement des produits.";
  }
}
