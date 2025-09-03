const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const productsContainer = document.getElementById("productsContainer");

// === Afficher les produits ===
function displayProducts(products) {
  productsContainer.innerHTML = products.map(p => `
    <div class="product-card">
      <img src="${p.image}" alt="${p.title}" onerror="this.src='https://via.placeholder.com/200x200'"/>
      <div class="product-info">
        <h3>${p.title}</h3>
        <p>${p.price}</p>
        <div class="product-actions">
          <a class="view-btn" href="${p.link}" target="_blank">Voir</a>
          <div>
            <button class="vote-btn" onclick="vote(${p.id})">Vote (${p.user_rating || 0})</button>
          </div>
        </div>
        <div class="review-section">
          <textarea id="review-${p.id}" placeholder="Votre avis..."></textarea>
          <button onclick="sendReview(${p.id})">Envoyer</button>
        </div>
      </div>
    </div>
  `).join("");
}

// === Charger tous les produits au départ ===
async function loadProducts() {
  productsContainer.innerHTML = "<p>⏳ Chargement...</p>";
  try {
    const res = await fetch("https://sawem-backend.onrender.com/products");
    const products = await res.json();
    displayProducts(products);
  } catch (err) {
    productsContainer.innerHTML = `<p>❌ ${err.message}</p>`;
  }
}

loadProducts();

// === Rechercher ===
searchBtn.addEventListener("click", async () => {
  const query = searchInput.value.trim();
  productsContainer.innerHTML = "<p>⏳ Chargement...</p>";

  try {
    const res = await fetch("https://sawem-backend.onrender.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const products = await res.json();
    if (!Array.isArray(products) || !products.length) {
      productsContainer.innerHTML = "<p>❌ Aucun produit trouvé.</p>";
      return;
    }
    displayProducts(products);
  } catch (err) {
    productsContainer.innerHTML = `<p>❌ Erreur serveur: ${JSON.stringify(err)}</p>`;
  }
});

// === Voter ===
async function vote(productId) {
  const userId = 1; // pour test, remplacer par ID connecté
  const stars = parseInt(prompt("Notez de 1 à 5 étoiles :"));
  if (!stars || stars < 1 || stars > 5) return alert("Note invalide");

  try {
    const res = await fetch("https://sawem-backend.onrender.com/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, user_id: userId, stars }),
    });
    const data = await res.json();
    if (data.success) alert(`Merci pour votre vote ! Note actuelle: ${data.user_rating}`);
  } catch (err) {
    alert("Erreur vote");
  }
}

// === Envoyer un avis ===
async function sendReview(productId) {
  const userId = 1; // pour test, remplacer par ID connecté
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
    }
  } catch (err) {
    alert("Erreur review");
  }
}
