const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const productsContainer = document.getElementById("productsContainer");

async function loadProducts(query="") {
  productsContainer.innerHTML="<p>⏳ Chargement...</p>";
  try {
    const res = await fetch("/search", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({query})
    });
    const products = await res.json();
    if(!products.length) { productsContainer.innerHTML="<p>❌ Aucun produit trouvé.</p>"; return; }

    productsContainer.innerHTML = products.map(p=>`
      <div class="product-card">
        <img src="${p.image}" alt="${p.title}" onerror="this.src='https://via.placeholder.com/200x200'"/>
        <div class="product-info">
          <h3>${p.title}</h3>
          <p>${p.price}</p>
          <div class="product-actions">
            <a class="view-btn" href="${p.link}" target="_blank">Voir</a>
            <div class="vote-stars">
              ${[1,2,3,4,5].map(i=>`<span onclick="vote(${i},${p.id})">⭐</span>`).join("")}
            </div>
          </div>
          <textarea id="reviewComment-${p.id}" placeholder="Votre avis..."></textarea>
          <button onclick="submitReview(${p.id})">Envoyer</button>
        </div>
      </div>
    `).join("");
  } catch(err){ productsContainer.innerHTML=`<p>❌ ${err.message}</p>`; }
}

searchBtn.addEventListener("click", ()=>loadProducts(searchInput.value.trim()));
window.onload = ()=>loadProducts();

async function vote(stars, productId) {
  const res = await fetch("/vote", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({product_id:productId, stars})
  });
  const data = await res.json();
  if(data.success) alert(`Merci ! Nouveau score : ${data.new_rating}`);
}

async function submitReview(productId) {
  const comment = document.getElementById(`reviewComment-${productId}`).value;
  const res = await fetch("/review", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({product_id:productId, comment})
  });
  const data = await res.json();
  if(data.success) alert("Merci pour votre avis !");
}
