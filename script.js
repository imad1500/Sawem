let products = [];

async function loadProducts() {
  const res = await fetch("products.json");
  products = await res.json();
}

function searchProducts() {
  const query = document.getElementById("searchBox").value.toLowerCase();
  const results = products.filter(p => p.title.toLowerCase().includes(query));

  let html = "";
  if (results.length > 0) {
    results.forEach(p => {
      html += `
        <div class="card">
          <img src="${p.image}" alt="${p.title}">
          <h3>${p.title}</h3>
          <p>${p.price}</p>
          <a href="${p.link}" target="_blank">Voir sur Amazon</a>
        </div>
      `;
    });
  } else {
    html = "<p>Aucun produit trouvé.</p>";
  }

  document.getElementById("results").innerHTML = html;
}

// Load products when page loads
window.onload = loadProducts;

