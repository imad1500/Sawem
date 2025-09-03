const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const productsContainer = document.getElementById("productsContainer");

searchBtn.addEventListener("click", async () => {
  const query = searchInput.value.trim();
  if (!query) return;

  productsContainer.innerHTML = "<p>⏳ Chargement des produits...</p>";

  try {
    const response = await fetch("https://sawem-backend.onrender.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) throw new Error("Erreur serveur");

    const products = await response.json();
    if (!products.length) {
      productsContainer.innerHTML = "<p>❌ Aucun produit trouvé.</p>";
      return;
    }

    productsContainer.innerHTML = products
      .map(p => `
        <div class="product-card">
          <img src="${p.image}" alt="${p.title}" onerror="this.src='https://via.placeholder.com/200x200'"/>
          <div class="product-info">
            <h3>${p.title}</h3>
            <p>${p.price}</p>
            <div class="product-actions">
              <a class="view-btn" href="${p.link}" target="_blank">Voir</a>
              <button class="vote-btn" onclick="vote(${p.id})">Vote</button>
            </div>
          </div>
        </div>
      `).join("");

  } catch (err) {
    productsContainer.innerHTML = `<p>❌ ${err.message}</p>`;
  }
});

function vote(id) {
  alert(`Vote pour le produit ${id} !`);
}
