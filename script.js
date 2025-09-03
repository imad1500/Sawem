const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const productsContainer = document.getElementById("productsContainer");

searchBtn.addEventListener("click", async () => {
  const query = searchInput.value.trim();
  if (!query) return;

  productsContainer.innerHTML = "<p>⏳ Chargement...</p>";

  try {
    const response = await fetch("https://sawem-backend.onrender.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) throw new Error("Erreur serveur");

    const products = await response.json();
    if (products.length === 0) {
      productsContainer.innerHTML = "<p>❌ Aucun produit trouvé.</p>";
      return;
    }

    productsContainer.innerHTML = products
      .map(p => `
        <div class="product-card">
          <img src="${p.image}" alt="${p.title}" onerror="this.src='fallback.jpg'"/>
          <h3>${p.title}</h3>
          <p>${p.price ? p.price + "€" : ""}</p>
          <div class="buttons">
            <a href="${p.link}" target="_blank">Voir</a>
            <button onclick="vote(${p.id})">Vote</button>
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
