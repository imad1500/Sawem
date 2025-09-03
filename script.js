async function fetchProducts(query = "") {
  try {
    const url = query
      ? `http://localhost:10000/search?query=${encodeURIComponent(query)}`
      : `http://localhost:10000/products`;

    const response = await fetch(url);
    const products = await response.json();

    if (!Array.isArray(products) || products.length === 0) {
      document.getElementById("products").innerHTML =
        `<p>❌ Aucun produit trouvé.</p>`;
      return;
    }

    // Séparer les produits par source
    const aliExpressProducts = products.filter(p => p.source === "aliexpress");
    const amazonProducts = products.filter(p => p.source === "amazon");

    // Générer HTML
    let html = "";

    if (aliExpressProducts.length > 0) {
      html += `<h2 class="source-title">AliExpress</h2>`;
      html += `<div class="product-grid">`;
      aliExpressProducts.forEach(p => {
        html += renderProduct(p);
      });
      html += `</div>`;
    }

    if (amazonProducts.length > 0) {
      html += `<h2 class="source-title">Amazon</h2>`;
      html += `<div class="product-grid">`;
      amazonProducts.forEach(p => {
        html += renderProduct(p);
      });
      html += `</div>`;
    }

    document.getElementById("products").innerHTML = html;
  } catch (err) {
    console.error("Erreur fetchProducts:", err);
    document.getElementById("products").innerHTML =
      `<p>❌ Erreur serveur: ${err.message}</p>`;
  }
}

function renderProduct(p) {
  const rating = parseFloat(p.user_rating) || 0;
  const stars = renderStars(rating);

  return `
    <div class="product-card">
      <img src="${p.image || 'https://via.placeholder.com/150'}" alt="${p.title}" />
      <h3>${p.title}</h3>
      <p>${p.price}</p>
      <p class="stars">Vote: ${stars} <span class="rating">(${rating.toFixed(1)})</span></p>
      <button onclick="alert('Voir le produit: ${p.title}')">Voir</button>
    </div>
  `;
}

function renderStars(rating) {
  let stars = "";
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars += `<span class="star full">★</span>`;
    } else if (i - rating < 1 && i > rating) {
      stars += `<span class="star half">★</span>`;
    } else {
      stars += `<span class="star empty">★</span>`;
    }
  }
  return stars;
}

// Charger initialement
fetchProducts();

// Recherche
document.getElementById("searchBtn").addEventListener("click", () => {
  const query = document.getElementById("searchInput").value;
  fetchProducts(query);
});
