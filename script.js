// script.js

const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const productsContainer = document.getElementById("products");

async function fetchProducts(query) {
  productsContainer.innerHTML = "🔄 Chargement des produits...";

  try {
    const res = await fetch("https://sawem-backend.onrender.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) {
      throw new Error(`Erreur serveur: ${res.status}`);
    }

    const products = await res.json();

    if (!products || products.length === 0) {
      productsContainer.innerHTML = "❌ Aucun produit trouvé.";
      return;
    }

    // Affichage des produits
    productsContainer.innerHTML = "";
    products.forEach((product) => {
      const productCard = document.createElement("div");
      productCard.className = "product-card";
      productCard.innerHTML = `
        <a href="${product.link}" target="_blank">
          <img src="${product.image}" alt="${product.title}" />
          <h3>${product.title}</h3>
          ${product.price ? `<p>Prix: ${product.price}</p>` : ""}
        </a>
      `;
      productsContainer.appendChild(productCard);
    });
  } catch (err) {
    console.error("Erreur fetchProducts:", err);
    productsContainer.innerHTML = "❌ Erreur lors du chargement des produits.";
  }
}

// Événement de recherche
searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const query = searchInput.value.trim();
  if (query) {
    fetchProducts(query);
  }
});

// Chargement initial (par ex. tous les produits Tech & Electronique)
fetchProducts("Tech & Electronique");
