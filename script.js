const API_BASE = "https://sawem-backend.onrender.com";

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const productsContainer = document.getElementById("productsContainer");

// ====== Render produits ======
function renderProducts(products){
  if(!products?.length){productsContainer.innerHTML="<p>❌ Aucun produit trouvé.</p>"; return;}
  productsContainer.innerHTML = products.map(p=>`
    <div class="product-card" data-id="${p.id}">
      <img src="${p.image}" alt="${p.title}" onerror="this.src='https://via.placeholder.com/400x300?text=Produit';"/>
      <div class="product-info">
        <h3>${p.title}</h3>
        <p>${p.price||""}</p>
        <div class="product-actions">
          <a class="view-btn" href="${p.link}" target="_blank" rel="noopener">Voir</a>
          <div>
            <button class="vote-btn" onclick="vote(${p.id},this)">Vote</button>
            <span class="votes-badge" id="votes-${p.id}">${p.votes??0} votes</span>
          </div>
        </div>
        <div class="reviews-container" id="reviews-${p.id}"></div>
        <div>
          <input type="text" id="review-input-${p.id}" placeholder="Votre avis..." style="width:80%;padding:6px;margin-top:4px"/>
          <button onclick="postReview(${p.id})" style="padding:6px 10px;margin-top:4px;">Envoyer</button>
        </div>
      </div>
    </div>
  `).join("");

  // Charger reviews
  products.forEach(p=>loadReviews(p.id));
}

// ====== Load reviews ======
async function loadReviews(product_id){
  const container = document.getElementById(`reviews-${product_id}`);
  if(!container) return;
  container.innerHTML = "<p>⏳ Chargement des avis...</p>";
  try{
    const res = await fetch(`${API_BASE}/reviews/${product_id}`);
    if(!res.ok) throw new Error("Erreur reviews");
    const reviews = await res.json();
    if(!reviews.length){container.innerHTML="<p>Aucun avis.</p>"; return;}
    container.innerHTML = reviews.map(r=>`
      <div class="review">
        <strong>${r.user_name}</strong> <span class="review-time">[${new Date(r.created_at).toLocaleDateString()}]</span>
        <div>${r.comment}</div>
      </div>
    `).join("");
  }catch(err){container.innerHTML=`<p>❌ ${err.message}</p>`;}
}

// ====== Post review ======
async function postReview(product_id){
  const input = document.getElementById(`review-input-${product_id}`);
  if(!input || !input.value.trim()) return;
  const comment = input.value.trim();
  try{
    const res = await fetch(`${API_BASE}/reviews`, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({product_id, comment})
    });
    if(!res.ok) throw new Error("Erreur envoi avis");
    input.value="";
    loadReviews(product_id);
  }catch(err){alert(`❌ ${err.message}`);}
}

// ====== Vote ======
async function vote(id, btn){
  try{
    btn.disabled=true;
    const res = await fetch(`${API_BASE}/vote`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({product_id:id})
    });
    if(!res.ok) throw new Error("Vote refusé");
    const data = await res.json();
    const badge = document.getElementById(`votes-${id}`);
    if(badge && typeof data.votes==="number") badge.textContent = `${data.votes} votes`;
    btn.disabled=false;
  }catch(err){alert(`❌ ${err.message}`); btn.disabled=false;}
}
window.vote=vote;

// ====== Load produits init ======
async function loadAllProducts(){
  productsContainer.innerHTML="<p>⏳ Chargement...</p>";
  try{
    const res = await fetch(`${API_BASE}/products`);
    if(!res.ok) throw new Error("Erreur serveur");
    const products = await res.json();
    renderProducts(products);
  }catch(err){productsContainer.innerHTML=`<p>❌ ${err.message}</p>`;}
}

// ====== Recherche ======
searchBtn.addEventListener("click", async ()=>{
  const query = searchInput.value.trim();
  if(!query){loadAllProducts(); return;}
  productsContainer.innerHTML="<p>⏳ Recherche...</p>";
  try{
    const res = await fetch(`${API_BASE}/search`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({query})
    });
    if(!res.ok) throw new Error("Erreur serveur");
    const products = await res.json();
    renderProducts(products);
  }catch(err){productsContainer.innerHTML=`<p>❌ ${err.message}</p>`;}
});

// Lancement initial
loadAllProducts();
