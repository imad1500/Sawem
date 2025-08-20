// Charger les produits depuis products.json
async function loadProducts() {
  try {
    const response = await fetch("products.json"); // Assure-toi que products.json est au même niveau
    const products = await response.json();
    displayProducts(products);

    // Gestion recherche
    const searchInput = document.getElementById("search");
    searchInput.addEventListener("input", () => {
      const keyword = searchInput.value.toLowerCase();
      const filtered = products.filter(p =>
        p.title.toLowerCase().includes(keyword)
      );
      displayProducts(filtered);
    });
  } catch (error) {
    console.error("Erreur lors du chargement des produits :", error);
  }
}

// Afficher produits
function displayProducts(products) {
  const container = document.getElementById("products");
  container.innerHTML = "";

  if (products.length === 0) {
    container.innerHTML = "<p>Aucun produit trouvé.</p>";
    return;
  }

  products.forEach(p => {
    const card = document.createElement("div");
    card.className = "product";

    card.innerHTML = `
      <img src="${p.image}.jpg" alt="${p.title}">
      <h3>${p.title}</h3>
      <p class="price">${p.price}</p>
      <a href="${p.link}" target="_blank" class="btn">Voir le produit</a>
    `;

    container.appendChild(card);
  });
}

// Lancer au chargement
window.addEventListener("DOMContentLoaded", loadProducts);
