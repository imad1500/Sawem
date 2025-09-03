const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const productsContainer = document.getElementById("productsContainer");

// === Afficher une section de produits ===
function displayProductsSection(title, products) {
  if (!products || !products.length) return "";
  return `
    <h2 style="margin:20px 0;">${title}</h2>
    <div class="products-container">
      ${products.map(p => `
        <div class="product-card">
          <img src="${p.image}" alt="${p.title}" onerror="this.src='https://via.placeholder.com/200x200'"/>
          <div class="product-info">
            <h3>${p.title}</h3>
            <p>${p.price}</p>
            <div class="product-actions">
              <a class="view-btn" href="${p.link}" target="_blank">Voir</a>
              <button class="vote-btn" onclick="vote(${p.id})">
                Vote (${p.user_rating ? p.user_rating.toFixed(1) : 0})
              </button>
            </div>
            <div class="review-section">
              <textarea id="review-${p.id}" placeholder="Votre avis..."></textarea>
              <button class="review-btn" onclick="sendReview(${p.id})">Envoyer</button>
            </div>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

// === Charger tous les produits ===
async function loadProducts() {
  productsContainer.innerHTML = "<p>⏳ Chargement...</p>";
  try {
    const res = await fetch("https://sawem-backend.onrender.com/products");
    const products = await res.json();

    const aliexpress = products.filter(p => p.source.toLowerCase().includes("aliexpress"));
    const amazon = products.filter(p => p.source.toLowerCase().includes("amazon"));

    productsContainer.innerHTML = displayProductsSection("AliExpress", aliexpress) +
                                  displayProductsSection("Amazon", amazon);
  } catch (err) {
    productsContainer.innerHTML = `<p>❌ ${err.message}</p>`;
  }
}

loadProducts();

// === Recherche ===
searchBtn.addEventListener("click", async () => {
  const query = searchInput.value.trim();
  if (!query) return;

  productsContainer.innerHTML = "<p>⏳ Chargement...</p>";

  try {
    const res = await fetch("https://sawem-backend.onrender.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const data = await res.json();

    const aliexpress = data.aliexpress || [];
    const amazon = data.amazon || [];

    productsContainer.innerHTML = displayProductsSection("AliExpress", aliexpress) +
                                  displayProductsSection("Amazon", amazon);

    if (!aliexpress.length && !amazon.length) {
      productsContainer.innerHTML = "<p>❌ Aucun produit trouvé.</p>";
    }
  } catch (err) {
    productsContainer.innerHTML = `<p>❌ Erreur serveur: ${err.message}</p>`;
  }
});

// === Voter ===
async function vote(productId) {
  const userId = 1; // temporaire
  const stars = parseInt(prompt("Notez de 1 à 5 étoiles :"));
  if (!stars || stars < 1 || stars > 5) return alert("Note invalide");

  try {
    const res = await fetch("https://sawem-backend.onrender.com/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, user_id: userId, stars }),
    });
    const data = await res.json();
    if (data.success) {
      alert(`Merci pour votre vote ! Note actuelle: ${data.user_rating.toFixed(1)}`);
      loadProducts();
    }
  } catch {
    alert("Erreur vote");
  }
}

// === Envoyer un avis ===
async function sendReview(productId) {
  const userId = 1; // temporaire
  const comment = document.getElementById(`review-${productId}`).value;
  if (!comment) return alert("Avis vide");

  try {
    const res = await fetch("https://sawem-backend.onrender.com/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, user_id: userId, comment }),
    });
    const data = await res.json();
    if (data.success) {
      alert("Merci pour votre avis !");
      document.getElementById(`review-${productId}`).value = "";
      loadProducts();
    }
  } catch {
    alert("Erreur review");
  }
}
