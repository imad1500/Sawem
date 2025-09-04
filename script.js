const backend = "https://sawem-backend.onrender.com";

// ==================== Vérification utilisateur ====================
async function checkUser() {
  try {
    const res = await fetch(`${backend}/me`, { credentials: "include" });
    if (!res.ok) return;
    const data = await res.json();
    if (data.success) {
      const info = data.user;
      document.getElementById("loginBtn").style.display = "none";
      const userDiv = document.getElementById("user-info");
      userDiv.style.display = "flex";
      document.getElementById("user-name").textContent = info.name;
      if (info.picture) document.getElementById("user-pic").src = info.picture;
    }
  } catch (err) {
    console.warn("Pas d'utilisateur connecté");
  }
}

// ==================== Chargement produits ====================
async function loadProducts() {
  try {
    const res = await fetch(`${backend}/products`, { credentials: "include" });
    const products = await res.json();
    renderProducts(products);
  } catch (err) {
    console.error("Erreur chargement produits:", err);
  }
}

// ==================== Rendu produits ====================
function renderProducts(products) {
  const grid = document.getElementById("productGrid");
  grid.innerHTML = "";

  products.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";

    const reviewsHtml = (p.reviews || []).map(r =>
      `<div class="single-review">
        <div class="rev-head">
          <span>${r.user_name}</span>
          <span>${new Date(r.created_at).toLocaleDateString()}</span>
        </div>
        <div class="rev-body">${r.comment}</div>
      </div>`
    ).join("");

    card.innerHTML = `
      <img src="${p.image}" alt="${p.title}">
      <div class="product-info">
        <h3>${p.title}</h3>
        <div class="price">${p.price} €</div>
        <div class="product-actions">
          <a href="${p.link}" target="_blank" class="view-btn">Voir</a>
          <button class="vote-btn" data-id="${p.id}">⭐ Voter</button>
        </div>
        <div class="reviews-section">
          <div class="reviews-list">${reviewsHtml}</div>
          <textarea placeholder="Écrire un commentaire…" rows="2" class="review-text"></textarea>
          <button class="send-review" data-id="${p.id}">Envoyer</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  bindVoteButtons();
  bindReviewButtons();
}

// ==================== Recherche ====================
document.getElementById("searchBtn").addEventListener("click", async () => {
  const query = document.getElementById("searchQuery").value.trim();
  if (!query) return;

  try {
    const res = await fetch(`${backend}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ query })
    });
    const products = await res.json();
    renderProducts(products);
  } catch (err) {
    console.error("Erreur recherche:", err);
  }
});

// ==================== Votes ====================
function bindVoteButtons() {
  document.querySelectorAll(".vote-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const productId = btn.dataset.id;
      const stars = 5; // par défaut
      try {
        const res = await fetch(`${backend}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ product_id: productId, stars })
        });
        const data = await res.json();
        if (data.success) alert(`Vote enregistré: ${data.user_rating} ⭐`);
      } catch (err) {
        alert("Erreur vote, connectez-vous !");
      }
    });
  });
}

// ==================== Reviews ====================
function bindReviewButtons() {
  document.querySelectorAll(".send-review").forEach(btn => {
    btn.addEventListener("click", async () => {
      const productId = btn.dataset.id;
      const textarea = btn.previousElementSibling;
      const comment = textarea.value.trim();
      if (!comment) return alert("Écrire un commentaire");

      try {
        const res = await fetch(`${backend}/review`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ product_id: productId, comment })
        });
        const data = await res.json();
        if (data.success) {
          textarea.value = "";
          const reviewsList = btn.parentElement.querySelector(".reviews-list");
          reviewsList.innerHTML = data.reviews.map(r =>
            `<div class="single-review">
              <div class="rev-head">
                <span>${r.user_name}</span>
                <span>${new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              <div class="rev-body">${r.comment}</div>
            </div>`
          ).join("");
        }
      } catch (err) {
        alert("Erreur, connectez-vous !");
      }
    });
  });
}

// ==================== Déconnexion ====================
document.getElementById("logoutBtn").addEventListener("click", async () => {
  try {
    await fetch(`${backend}/logout`, { credentials: "include" });
  } finally {
    location.reload();
  }
});

// ==================== Initialisation ====================
loadProducts();
checkUser();
