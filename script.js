// script.js - VERSION OPTIMISÉE POUR PERFORMANCE ET GOOGLE LOGIN
(function() {
  'use strict';
  
  // ==================== CONFIG ====================
  const CONFIG = {
    BACKEND_URL: "https://sawem-backend.onrender.com",
    CACHE_DURATION: 5 * 60 * 1000,
    DEBOUNCE_DELAY: 300,
    MAX_RETRIES: 3,
    REQUEST_TIMEOUT: 10000
  };

  // ==================== CACHE ====================
  class ClientCache {
    constructor() { this.cache = new Map(); this.maxSize = 100; }
    set(key, value, duration = CONFIG.CACHE_DURATION) {
      if (this.cache.size >= this.maxSize) this.cache.delete(this.cache.keys().next().value);
      this.cache.set(key, { value, expires: Date.now() + duration });
    }
    get(key) {
      const cached = this.cache.get(key);
      if (!cached) return null;
      if (Date.now() > cached.expires) { this.cache.delete(key); return null; }
      return cached.value;
    }
    clear() { this.cache.clear(); }
    cleanup() { for (const [k,v] of this.cache.entries()) if (Date.now()>v.expires) this.cache.delete(k); }
  }

  const clientCache = new ClientCache();

  // ==================== DOM MANAGER ====================
  class DOMManager {
    constructor() { this.elements = {}; this.initialized=false; }
    init() {
      if (this.initialized) return;
      const ids = ["searchInput","searchBtn","productsContainer","googleLoginBtn","logoutBtn",
                   "authStatus","userInfo","userAvatar","userName","userEmail",
                   "welcomeMessage","welcomeUserName","notification"];
      ids.forEach(id => this.elements[id] = document.getElementById(id));
      this.initialized=true;
    }
    get(name){ return this.elements[name]; }
  }
  const domManager = new DOMManager();

  // ==================== API MANAGER ====================
  class APIManager {
    constructor(){ this.activeRequests=new Map(); }
    async makeRequest(url, options={}, useCache=false, cacheKey=null){
      const key = `${options.method||'GET'}-${url}-${JSON.stringify(options.body||{})}`;
      if(this.activeRequests.has(key)) return this.activeRequests.get(key);
      if(useCache && cacheKey){ const cached = clientCache.get(cacheKey); if(cached) return cached; }
      const req = this._executeRequest(url,options);
      this.activeRequests.set(key, req);
      try{
        const res = await req;
        if(useCache && cacheKey && res) clientCache.set(cacheKey,res);
        return res;
      } finally { this.activeRequests.delete(key); }
    }
    async _executeRequest(url,options,attempt=1){
      const controller = new AbortController();
      const timeoutId = setTimeout(()=>controller.abort(), CONFIG.REQUEST_TIMEOUT);
      try{
        const response = await fetch(url,{...options,signal:controller.signal});
        clearTimeout(timeoutId);
        if(!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        return await response.json();
      } catch(error){
        clearTimeout(timeoutId);
        if(attempt<CONFIG.MAX_RETRIES && !controller.signal.aborted){ await new Promise(r=>setTimeout(r,1000*attempt)); return this._executeRequest(url,options,attempt+1);}
        throw error;
      }
    }
  }
  const apiManager = new APIManager();

  // ==================== UTILITIES ====================
  const utils = {
    escapeHtml: s=>{ const d=document.createElement('div'); d.textContent=s||''; return d.innerHTML; },
    debounce: (f,w)=>{ let t; return function(...a){ clearTimeout(t); t=setTimeout(()=>f.apply(this,a),w); }; },
    formatDate: ds=>new Date(ds).toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}),
    createImageWithFallback: (src,alt,fallback)=>{ const img=document.createElement('img'); img.alt=alt; img.loading='lazy'; img.decoding='async'; img.onerror=()=>img.src=fallback||'https://via.placeholder.com/400x300?text=Image+non+disponible'; img.src=src; return img; }
  };

  // ==================== AUTH ====================
  let authToken=null;
  const auth = {
    saveToken: t=>{ try{ localStorage.setItem('sawem_auth_token',t); authToken=t; }catch{} },
    getToken: ()=>{ if(!authToken){ try{ authToken=localStorage.getItem('sawem_auth_token'); }catch{} } return authToken; },
    removeToken: ()=>{ try{ localStorage.removeItem('sawem_auth_token'); authToken=null; }catch{} },
    getAuthHeaders: ()=>{ const t=auth.getToken(); return t?{'Authorization':`Bearer ${t}`,'Content-Type':'application/json'}:{'Content-Type':'application/json'} }
  };

  // ==================== NOTIFICATIONS ====================
  const notifications = {
    queue:[],isShowing:false,
    show(m,t='success',d=3000){ this.queue.push({m,t,d}); if(!this.isShowing) this.processQueue(); },
    processQueue:function(){
      if(this.queue.length===0){ this.isShowing=false; return; }
      this.isShowing=true;
      const {m,t,d}=this.queue.shift();
      const n = domManager.get('notification'); if(!n) return;
      n.textContent=m; n.className=`notification ${t}`; n.offsetHeight; n.classList.add('show');
      setTimeout(()=>{ n.classList.remove('show'); setTimeout(()=>this.processQueue(),300); },d);
    }
  };

  // ==================== USER ====================
  let currentUser=null;
  const userManager={
    async checkUser(){
      try{
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token');
        if(urlToken){ auth.saveToken(urlToken); window.history.replaceState({}, document.title, window.location.pathname); }
        const token = auth.getToken(); if(!token) throw new Error("Aucun token");
        const userData = await apiManager.makeRequest(`${CONFIG.BACKEND_URL}/verify-token`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token})},true,`user-${token.slice(-10)}`);
        if(userData?.success && userData.user){ currentUser=userData.user; this.displayUserConnected(userData.user); if(urlToken||urlParams.get('auth')==='success') notifications.show(`Connexion réussie ! Bienvenue ${userData.user.name}`); } else throw new Error("Données utilisateur invalides");
      }catch(e){ console.error('checkUser error:',e); currentUser=null; auth.removeToken(); this.displayUserDisconnected(); if(new URLSearchParams(window.location.search).get('auth')==='error'){ notifications.show("Erreur lors de la connexion",'error'); window.history.replaceState({}, document.title, window.location.pathname); } }
    },
    displayUserConnected(u){
      const aS=domManager.get('authStatus'),gB=domManager.get('googleLoginBtn'),uI=domManager.get('userInfo'),uN=domManager.get('userName'),uE=domManager.get('userEmail'),uA=domManager.get('userAvatar'),wM=domManager.get('welcomeMessage'),wU=domManager.get('welcomeUserName');
      if(aS) aS.style.display="none"; if(gB) gB.style.display="none";
      if(uN) uN.textContent=u.name||"Utilisateur"; if(uE) uE.textContent=u.email||"";
      if(uA){ uA.src=u.photo||`https://ui-avatars.com/api/?name=${encodeURIComponent(u.name||'User')}&size=40&background=0d6efd&color=fff`; uA.alt=u.name||"Avatar"; }
      if(uI) uI.style.display="flex"; if(wU) wU.textContent=u.name||"Utilisateur"; if(wM) wM.style.display="block";
    },
    displayUserDisconnected(){
      const aS=domManager.get('authStatus'),gB=domManager.get('googleLoginBtn'),uI=domManager.get('userInfo'),wM=domManager.get('welcomeMessage');
      if(uI) uI.style.display="none"; if(wM) wM.style.display="none";
      if(aS){ aS.textContent="❌ Non connecté"; aS.className="auth-status disconnected"; aS.style.display="block"; }
      if(gB){ gB.href=`${CONFIG.BACKEND_URL}/auth/google`; gB.style.display="flex"; }
    },
    async logout(){
      try{ await apiManager.makeRequest(`${CONFIG.BACKEND_URL}/logout`,{method:'POST',headers:auth.getAuthHeaders()}); }catch(e){ console.error('Logout error:',e); }
      auth.removeToken(); currentUser=null; clientCache.clear(); notifications.show("Déconnexion réussie",'success'); this.displayUserDisconnected();
    }
  };

  // ==================== PRODUCTS RENDERER ====================
  const productRenderer = {
    renderStars(r){
      const full=Math.floor(r||0),half=r-full>=0.5; let html='<div class="stars">';
      for(let i=1;i<=5;i++){ html+=i<=full?'<span class="star full">★</span>':(half&&i===full+1?'<span class="star half">★</span>':'<span class="star empty">★</span>'); }
      html+='</div>'; return html;
    },
    renderReviews(reviews){ if(!reviews||!reviews.length) return '<div class="no-reviews">Aucun avis disponible</div>'; return reviews.slice(0,3).map(r=>`<div class="review"><div class="review-header"><strong>${utils.escapeHtml(r.user_name||'Anonyme')}</strong><span class="review-date">${utils.formatDate(r.created_at)}</span></div><div class="review-body">${utils.escapeHtml(r.comment)}</div></div>`).join(''); },
    renderProductCard(p){
      const title=utils.escapeHtml(p.title||""),price=utils.escapeHtml(p.price||""),link=p.link||"#",rating=Number(p.user_rating||0),starsHTML=this.renderStars(rating),reviewsHTML=this.renderReviews(p.reviews||[]),isLoggedIn=!!currentUser;
      return `<div class="product-card" data-id="${p.id}"><img src="${p.image||'https://via.placeholder.com/400x300'}" alt="${title}" loading="lazy" decoding="async" /><div class="product-info"><h3 class="product-title">${title}</h3><div class="product-price">${price}</div><div class="product-rating">${starsHTML}<span class="rating-value">(${rating.toFixed(1)})</span></div><div class="product-actions"><a class="view-btn" href="${utils.escapeHtml(link)}" target="_blank" rel="noopener">Voir le produit</a><button class="vote-btn" data-product-id="${p.id}" ${!isLoggedIn?'disabled title="Connectez-vous pour voter"':''}>Noter</button></div><div class="reviews-section"><div class="reviews-list" id="reviews-${p.id}">${reviewsHTML}</div><div class="review-form"><textarea id="review-textarea-${p.id}" rows="3" ${!isLoggedIn?'placeholder="Connectez-vous pour laisser un avis" disabled':'placeholder="Votre avis..."'}></textarea><button class="send-review-btn" data-product-id="${p.id}" ${!isLoggedIn?'disabled':''}>Envoyer l'avis</button></div></div></div></div>`; 
    },
    renderSkeletonCards(count=6){ return Array.from({length:count}).map(()=>`<div class="skeleton-card"><div class="skeleton-image"></div><div class="skeleton-content"><div class="skeleton-line"></div><div class="skeleton-line short"></div><div class="skeleton-line medium"></div></div></div>`).join(''); },
    displayProducts(products){
      const container=domManager.get('productsContainer'); if(!container) return;
      if(!products||!products.length){ container.innerHTML='<div class="no-products">❌ Aucun produit trouvé.</div>'; return; }
      const sources={aliexpress:products.filter(p=>(p.source||"").toLowerCase().includes("aliexpress")),amazon:products.filter(p=>(p.source||"").toLowerCase().includes("amazon")),others:products.filter(p=>{const s=(p.source||"").toLowerCase();return!s.includes("aliexpress")&&!s.includes("amazon");})};
      let html='';
      Object.entries(sources).forEach(([key,prods])=>{ if(prods.length===0) return; const titles={aliexpress:'AliExpress',amazon:'Amazon',others:'Autres sources'}; html+=`<div class="source-section"><h2 class="source-title">${titles[key]}</h2><div class="product-grid">${prods.map(p=>this.renderProductCard(p)).join('')}</div></div>`; });
      container.innerHTML=html; this.attachEventListeners();
    },
    attachEventListeners(){
      document.addEventListener('click',e=>{
        if(e.target.matches('.vote-btn')){ e.preventDefault(); const id=e.target.dataset.productId; if(id) productActions.promptVote(parseInt(id)); }
        if(e.target.matches('.send-review-btn')){ e.preventDefault(); const id=e.target.dataset.productId; if(id) productActions.submitReview(parseInt(id)); }
      });
    }
  };

  // ==================== PRODUCT ACTIONS ====================
  const productActions={
    async promptVote(id){
      if(!currentUser){ notifications.show("Veuillez vous connecter pour voter",'error'); return; }
      const stars=parseInt(prompt("Notez ce produit (1-5 étoiles) :")); if(!Number.isInteger(stars)||stars<1||stars>5){ notifications.show("Note invalide",'error'); return; }
      try{ await apiManager.makeRequest(`${CONFIG.BACKEND_URL}/vote`,{method:'POST',headers:auth.getAuthHeaders(),body:JSON.stringify({product_id:id,stars})}); notifications.show(`Vote enregistré : ${stars}/5 étoiles`,'success'); const q=domManager.get('searchInput')?.value?.trim(); if(q) productManager.searchProducts(q); else productManager.loadProducts(); }catch(e){ console.error('Vote error:',e); if(e.message.includes('401')){ notifications.show("Session expirée",'error'); auth.removeToken(); userManager.displayUserDisconnected(); }else{ notifications.show("Erreur lors du vote",'error'); } }
    },
    async submitReview(id){
      if(!currentUser){ notifications.show("Veuillez vous connecter pour laisser un avis",'error'); return; }
      const ta=document.getElementById(`review-textarea-${id}`); if(!ta) return; const comment=ta.value.trim(); if(!comment){ notifications.show("Veuillez écrire un commentaire",'error'); return; }
      try{
        const result = await apiManager.makeRequest(`${CONFIG.BACKEND_URL}/review`,{method:'POST',headers:auth.getAuthHeaders(),body:JSON.stringify({product_id:id,comment})});
        notifications.show("Avis publié avec succès",'success');
        if(result?.reviews){ const reviewsContainer=document.getElementById(`reviews-${id}`); if(reviewsContainer) reviewsContainer.innerHTML=productRenderer.renderReviews(result.reviews); }
        ta.value='';
      }catch(e){ console.error('Review error:',e); if(e.message.includes('401')){ notifications.show("Session expirée",'error'); auth.removeToken(); userManager.displayUserDisconnected(); }else{ notifications.show("Erreur lors de l'envoi de l'avis",'error'); } }
    }
  };

  // ==================== PRODUCT MANAGER ====================
  const productManager={
    async loadProducts(){
      const container=domManager.get('productsContainer'); if(container) container.innerHTML=productRenderer.renderSkeletonCards(6);
      try{
        const products = await apiManager.makeRequest(`${CONFIG.BACKEND_URL}/products`,{method:'GET',headers:auth.getAuthHeaders()},true,'products-list');
        productRenderer.displayProducts(products);
      }catch(e){ console.error('Load products error:',e); const container=domManager.get('productsContainer'); if(container) container.innerHTML='<div class="no-products">❌ Impossible de charger les produits.</div>'; }
    },
    async searchProducts(query){
      if(!query){ this.loadProducts(); return; }
      const container=domManager.get('productsContainer'); if(container) container.innerHTML=productRenderer.renderSkeletonCards(4);
      try{
        const products = await apiManager.makeRequest(`${CONFIG.BACKEND_URL}/search`,{method:'POST',headers:auth.getAuthHeaders(),body:JSON.stringify({query})});
        productRenderer.displayProducts(products);
      }catch(e){ console.error('Search products error:',e); const container=domManager.get('productsContainer'); if(container) container.innerHTML='<div class="no-products">❌ Recherche impossible.</div>'; }
    }
  };

  // ==================== GLOBAL EVENTS ====================
  function attachGlobalEvents(){
    const searchBtn = domManager.get('searchBtn'), searchInput = domManager.get('searchInput');
    if(searchBtn) searchBtn.addEventListener('click',()=>{ const q=searchInput?.value?.trim(); productManager.searchProducts(q); });
    if(searchInput){ const debouncedSearch=utils.debounce(q=>productManager.searchProducts(q),CONFIG.DEBOUNCE_DELAY); searchInput.addEventListener('input',e=>{ const q=e.target.value.trim(); if(q.length>=2) debouncedSearch(q); else if(q.length===0) productManager.loadProducts(); }); searchInput.addEventListener('keypress',e=>{ if(e.key==='Enter'){ e.preventDefault(); productManager.searchProducts(e.target.value.trim()); } }); }
    const logoutBtn = domManager.get('logoutBtn'); if(logoutBtn) logoutBtn.addEventListener('click',()=>userManager.logout());
  }

  // ==================== INIT APP ====================
  async function initApp(){
    domManager.init(); attachGlobalEvents();
    setInterval(()=>clientCache.cleanup(),5*60*1000);
    await userManager.checkUser();
    productManager.loadProducts();
  }

  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded',initApp); } else { initApp(); }

})();

