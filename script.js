const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const productsContainer = document.getElementById("productsContainer");

// Fonction pour afficher les étoiles
function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  let stars = "";
  for (let i = 0; i < full; i++) stars += "★";
  if (half) stars += "☆";
  for (let i = stars.length; i < 5; i++) stars += "☆";
  return stars;
}

// Fonction pour afficher produits
function displayProducts(products) {
  if (!products || products.length === 0) {
    productsContainer.innerHTML = "<p>❌ Aucun produit trouvé.</p>";
    return;
  }

  // Séparer AliExpress et Amazon
  const ali = products.filter(p => p.source.toLowerCase().includes("aliexpress"));
  const amazon = products.filter(p => p.source.toLowerCase().includes("amazon"));

  const sections = [
    { title: "AliExpress", items: ali },
    { title: "Amazon", items: amazon },
  ];

  productsContainer.innerHTML = sections
    .map(section => {
      if (!section.items.length) return "";
      return `
        <h2>${section.title}</h2>
        <div class="products-container">
          ${section.items
            .map(p => `
              <div class="product-card">
                <img src="${p.image}" alt="${p.title}" onerror="this.src='https://via.placeholder.com/200x200'"/>
                <div class="product-info">
                  <h3>${p.title}</h3>
                  <p>${p.price}</p>
                  <p>Vote: ${renderStars(Number(p.user_rating || 0))} (${Number(p.user_rating||0).toFixed(1)})</p>
                  <div class="product-actions">
                    <a class="view-btn" href="${p.link}" target="_blank">Voir</a>
                    <button class="vote-btn" onclick="vote(${p.id})">Vote</button>
                  </div>
                  <div class="review-section">
                    <textarea id="review-${p.id}" placeholder="Votre avis..."></textarea>
                    <button class="vote-btn" onclick="submitReview(${p.id})">Envoyer</button>
                  </div>
                </div>
              </div>
            `).join("")}
        </div>
      `;
    }).join("");
}

// Charger produits initiaux
async function loadProducts() {
  productsContainer.innerHTML = "<p>⏳ Chargement des produits...</p>";
  try {
    const res = await fetch("https://sawem-backend.onrender.com/products");
    const data = await res.json();
    displayProducts(data);
  } catch (err) {
    productsContainer.innerHTML = `<p>❌ Erreur serveur: ${err.message}</p>`;
  }
}

// Recherche
searchBtn.addEventListener("click", async () => {
  const query = searchInput.value.trim();
  if (!query) {
    loadProducts();
    return;
  }
  productsContainer.innerHTML = "<p>⏳ Recherche en cours...</p>";

  try {
    const res = await fetch("https://sawem-backend.onrender.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const data = await res.json();
    displayProducts(data);
  } catch (err) {
    productsContainer.innerHTML = `<p>❌ Erreur serveur: ${err.message}</p>`;
  }
});

// Fonction vote
async function vote(id) {
  const stars = prompt("Entrez votre note (1 à 5) :");
  const numStars = Number(stars);
  if (!numStars || numStars < 1 || numStars > 5) return alert("Note invalide");

  try {
    const res = await fetch("https://sawem-backend.onrender.com/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: id, stars: numStars }),
    });
    const data = await res.json();
    alert(data.message);
    loadProducts();
  } catch (err) {
    alert("❌ Erreur vote: " + err.message);
  }
}

// Fonction submit review
async function submitReview(id) {
  const textarea = document.getElementById(`review-${id}`);
  const comment = textarea.value.trim();
  if (!comment) return alert("Veuillez écrire un commentaire");

  try {
    const res = await fetch("https://sawem-backend.onrender.com/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: id, comment }),
    });
    const data = await res.json();
    alert(data.message);
    textarea.value = "";
  } catch (err) {
    alert("❌ Erreur review: " + err.message);
  }
}

// Initial
loadProducts();
