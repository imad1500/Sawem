const searchInput = document.getElementById("search-input");
const productsContainer = document.getElementById("products");

// Fonction pour charger les produits initiaux
async function loadProducts(query = "") {
  productsContainer.innerHTML = "<p>⏳ Chargement...</p>";

  try {
    const response = await fetch("https://sawem-backend.onrender.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    const products = await response.json();

    if (!products || products.length === 0) {
      productsContainer.innerHTML = "<p>Aucun produit trouvé.</p>";
      return;
    }

    // Affichage des produits
    productsContainer.innerHTML = "";
    products.forEach((p) => {
      const productCard = document.createElement("div");
      productCard.className = "product-card";

      productCard.innerHTML = `
        <img src="${p.image}" alt="${p.title}" />
        <h3>${p.title}</h3>
        <a href="https://aliexpress.com/wholesale?SearchText=${encodeURIComponent(
          p.title
        )}" target="_blank" class="btn">🛒 Voir sur AliExpress</a>
        <a href="https://www.amazon.fr/s?k=${encodeURIComponent(
          p.title
        )}" target="_blank" class="btn btn-secondary">🛒 Voir sur Amazon</a>
      `;

      productsContainer.appendChild(productCard);
    });
  } catch (error) {
    console.error("Erreur chargement produits:", error);
    productsContainer.innerHTML =
      "<p>❌ Erreur lors du chargement des produits.</p>";
  }
}

// Charger les produits initiaux
loadProducts();

// Écoute recherche
searchInput.addEventListener("input", (e) => {
  const query = e.target.value.trim();
  loadProducts(query);
});
