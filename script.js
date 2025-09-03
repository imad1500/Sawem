const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const productsContainer = document.getElementById("productsContainer");

// URL de ton backend Render
const BACKEND_URL = "https://sawem-backend.onrender.com";

async function loadProducts(query = "") {
  productsContainer.innerHTML = "<p>⏳ Chargement...</p>";
  try {
    const res = await fetch(`${BACKEND_URL}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Erreur serveur: ${text}`);
    }

    const products = await res.json();
    if (!products.length) {
      productsContainer.innerHTML = "<p>❌ Aucun produit trouvé.</p>";
      return;
    }

    productsContainer.innerHTML = products.map(p => `
      <div class="product-card">
        <img src="${p.image}" alt="${p.title}" onerror="this.src='https://via.placeholder.com/200x200'"/>
        <div class="product-info">
          <h3>${p.title}</h3>
          <p>${p.price}</p>
          <div class="product-actions">
            <a class="view-btn" href="${p.link}" target="_blank">Voir</a>
            <div class="vote-stars">
              ${[1,2,3,4,5].map(i => `<span onclick="vote(${i},${p.id})">⭐</span>`).join("")}
            </div>
          </div>
          <div class="reviews">
            ${p.reviews.map(r => `
              <div class="review">
                <strong>${r.name}:</strong> ${'⭐'.repeat(r.stars)}<br>${r.comment}
              </div>
            `).join('')}
          </div>
          <textarea id="reviewComment-${p.id}" placeholder="Votre avis..."></textarea>
          <button onclick="submitReview(${p.id})">Envoyer</button>
        </div>
      </div>
    `).join("");

  } catch (err) {
    productsContainer.innerHTML = `<p>❌ ${err.message}</p>`;
  }
}

searchBtn.addEventListener("click", () => loadProducts(searchInput.value.trim()));
window.onload = () => loadProducts();

// Fonction vote
async function vote(stars, productId) {
  try {
    const res = await fetch(`${BACKEND_URL}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, stars })
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Erreur serveur: ${text}`);
    }
    const data = await res.json();
    if (data.success) alert(`Merci ! Nouveau score : ${data.new_rating}`);
  } catch (err) {
    alert(`Erreur vote: ${err.message}`);
  }
}

// Fonction envoyer un avis
async function submitReview(productId) {
  try {
    const comment = document.getElementById(`reviewComment-${productId}`).value;
    const res = await fetch(`${BACKEND_URL}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, comment })
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Erreur serveur: ${text}`);
    }
    const data = await res.json();
    if (data.success) alert("Merci pour votre avis !");
    // Recharge les produits pour afficher le nouvel avis
    loadProducts(searchInput.value.trim());
  } catch (err) {
    alert(`Erreur avis: ${err.message}`);
  }
}
