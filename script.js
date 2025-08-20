async function searchProducts() {
  const query = document.getElementById("searchBox").value;
  if (!query) return;

  // 👉 mets ton URL Render ici
  const res = await fetch(`https://www.sawem.shop/search?keyword=${encodeURIComponent(query)}`);
  const data = await res.json();

  let html = "";
  if (data.SearchResult && data.SearchResult.Items) {
    data.SearchResult.Items.forEach(item => {
      const title = item.ItemInfo.Title.DisplayValue;
      const image = item.Images.Primary.Medium.URL;
      const price = item.Offers?.Listings?.[0]?.Price?.DisplayAmount || "Prix indisponible";
      const link = item.DetailPageURL;

      html += `
        <div class="card">
          <img src="${image}" alt="${title}">
          <h3>${title}</h3>
          <p>${price}</p>
          <a href="${link}" target="_blank">Voir sur Amazon</a>
        </div>
      `;
    });
  } else {
    html = "<p>Aucun produit trouvé.</p>";
  }

  document.getElementById("results").innerHTML = html;
}
