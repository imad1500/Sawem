// script.js
const productsContainer = document.getElementById("products");
const searchInput = document.getElementById("searchInput");

// 🔹 Charger les produits depuis ton backend
async function loadProducts(query = "") {
  try {
    const res = await fetch(`https://sawem-backend.onrender.com/products?search=${encodeURIComponent(query)}`);
    
    if (!res.ok) {
      throw new Error(`Erreur serveur: ${res.status}`);
    }

    const products = await res.json();

    // Nettoyer l'affichage
    productsContainer.innerHTML = "";

    if (products.length === 0) {
      productsContainer.innerHTML = "<p>Aucun produit trouvé.</p>";
      return;
    }

    // Générer les cartes produits
    products.forEach((p) => {
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <img src="${p.image}" alt="${p.name}" />
        <h3>${p.name}</h3>
        <p>${p.price} €</p>
        <a href="${p.url}" target="_blank">Voir sur ${p.source}</a>
      `;
      productsContainer.appendChild(card);
    });
  } catch (err) {
    console.error("Erreur:", err);
    productsContainer.innerHTML = `<p>❌ Erreur lors du chargement des produits.</p>`;
  }
}

// 🔹 Recherche en direct
searchInput.addEventListener("input", (e) => {
  const query = e.target.value;
  loadProducts(query);
});

// Charger les produits au démarrage
loadProducts();
