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
      productsContainer.innerHTML = "❌ Erreur serveur.";
      return;
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      productsContainer.innerHTML = "🙁 Aucun produit trouvé.";
      return;
    }

    productsContainer.innerHTML = "";
    data.forEach((product) => {
      const card = `
        <div class="product-card">
          <img src="${product.image}" alt="${product.title}">
          <h3>${product.title}</h3>
          <p class="price">${product.price}</p>
          <a href="${product.link}" target="_blank">Voir le produit</a>
          <p class="source">📦 ${product.source}</p>
        </div>
      `;
      productsContainer.innerHTML += card;
    });
  } catch (err) {
    console.error("Erreur côté client:", err);
    productsContainer.innerHTML = "❌ Impossible de charger les produits.";
  }
}

// recherche auto au clic bouton ou Enter
document.getElementById("searchBtn").addEventListener("click", searchProducts);
document.getElementById("searchInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchProducts();
});
