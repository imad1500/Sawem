// script.js - VERSION CORRIGÉE POUR LE VOTE
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

  // ==================== CACHE OPTIMISÉ ====================
  class ClientCache {
    constructor() { 
      this.cache = new Map(); 
      this.maxSize = 50; // Réduit pour optimiser la mémoire
    }
    
    set(key, value, duration = CONFIG.CACHE_DURATION) {
      if (this.cache.size >= this.maxSize) {
        // Supprimer les plus anciens éléments
        const keysToDelete = Array.from(this.cache.keys()).slice(0, 10);
        keysToDelete.forEach(k => this.cache.delete(k));
      }
      this.cache.set(key, { value, expires: Date.now() + duration });
    }
    
    get(key) {
      const cached = this.cache.get(key);
      if (!cached) return null;
      if (Date.now() > cached.expires) { 
        this.cache.delete(key); 
        return null; 
      }
      return cached.value;
    }
    
    clear() { this.cache.clear(); }
    
    cleanup() { 
      for (const [k, v] of this.cache.entries()) {
        if (Date.now() > v.expires) this.cache.delete(k);
      }
    }
  }

  const clientCache = new ClientCache();

  // ==================== DOM MANAGER ====================
  class DOMManager {
    constructor() { this.elements = {}; this.initialized = false; }
    
    init() {
      if (this.initialized) return;
      const ids = [
        "searchInput", "searchBtn", "productsContainer", "googleLoginBtn", 
        "logoutBtn", "authStatus", "userInfo", "userAvatar", "userName", 
        "userEmail", "welcomeMessage", "welcomeUserName", "notification"
      ];
      ids.forEach(id => this.elements[id] = document.getElementById(id));
      this.initialized = true;
    }
    
    get(name) { return this.elements[name]; }
  }
  const domManager = new DOMManager();

  // ==================== API MANAGER OPTIMISÉ ====================
  class APIManager {
    constructor() { this.activeRequests = new Map(); }
    
    async makeRequest(url, options = {}, useCache = false, cacheKey = null) {
      const key = `${options.method || 'GET'}-${url}-${JSON.stringify(options.body || {})}`;
      
      // Éviter les requêtes en double
      if (this.activeRequests.has(key)) {
        return this.activeRequests.get(key);
      }
      
      // Vérifier le cache
      if (useCache && cacheKey) {
        const cached = clientCache.get(cacheKey);
        if (cached) return cached;
      }
      
      const request = this._executeRequest(url, options);
      this.activeRequests.set(key, request);
      
      try {
        const result = await request;
        if (useCache && cacheKey && result) {
          clientCache.set(cacheKey, result);
        }
        return result;
      } finally {
        this.activeRequests.delete(key);
      }
    }
    
    async _executeRequest(url, options, attempt = 1) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);
      
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        clearTimeout(timeoutId);
        
        // Retry logic
        if (attempt < CONFIG.MAX_RETRIES && !controller.signal.aborted) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          return this._executeRequest(url, options, attempt + 1);
        }
        
        throw error;
      }
    }
  }
  const apiManager = new APIManager();

  // ==================== UTILITIES ====================
  const utils = {
    escapeHtml: (s) => {
      const div = document.createElement('div');
      div.textContent = s || '';
      return div.innerHTML;
    },
    
    debounce: (func, wait) => {
      let timeout;
      return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    },
    
    formatDate: (dateStr) => new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric', 
      hour: '2-digit', minute: '2-digit'
    }),
    
    createImageWithFallback: (src, alt, fallback) => {
      const img = document.createElement('img');
      img.alt = alt;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.onerror = () => img.src = fallback || 'https://via.placeholder.com/400x300?text=Image+non+disponible';
      img.src = src;
      return img;
    }
  };

  // ==================== AUTH ====================
  let authToken = null;
  const auth = {
    saveToken: (token) => {
      try {
        localStorage.setItem('sawem_auth_token', token);
        authToken = token;
      } catch (e) {
        console.warn('Cannot save token to localStorage');
      }
    },
    
    getToken: () => {
      if (!authToken) {
        try {
          authToken = localStorage.getItem('sawem_auth_token');
        } catch (e) {
          console.warn('Cannot read token from localStorage');
        }
      }
      return authToken;
    },
    
    removeToken: () => {
      try {
        localStorage.removeItem('sawem_auth_token');
        authToken = null;
      } catch (e) {
        console.warn('Cannot remove token from localStorage');
      }
    },
    
    getAuthHeaders: () => {
      const token = auth.getToken();
      return token 
        ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        : { 'Content-Type': 'application/json' };
    }
  };

  // ==================== NOTIFICATIONS ====================
  const notifications = {
    queue: [],
    isShowing: false,
    
    show(message, type = 'success', duration = 3000) {
      this.queue.push({ message, type, duration });
      if (!this.isShowing) this.processQueue();
    },
    
    processQueue: function() {
      if (this.queue.length === 0) {
        this.isShowing = false;
        return;
      }
      
      this.isShowing = true;
      const { message, type, duration } = this.queue.shift();
      const notification = domManager.get('notification');
      
      if (!notification) return;
      
      notification.textContent = message;
      notification.className = `notification ${type}`;
      notification.offsetHeight; // Force reflow
      notification.classList.add('show');
      
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => this.processQueue(), 300);
      }, duration);
    }
  };

  // ==================== USER MANAGEMENT ====================
  let currentUser = null;
  
  const userManager = {
    async checkUser() {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token');
        
        if (urlToken) {
          auth.saveToken(urlToken);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        
        const token = auth.getToken();
        if (!token) throw new Error("Aucun token");
        
        const userData = await apiManager.makeRequest(
          `${CONFIG.BACKEND_URL}/verify-token`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
          },
          true,
          `user-${token.slice(-10)}`
        );
        
        if (userData?.success && userData.user) {
          currentUser = userData.user;
          this.displayUserConnected(userData.user);
          
          if (urlToken || urlParams.get('auth') === 'success') {
            notifications.show(`Connexion réussie ! Bienvenue ${userData.user.name}`);
          }
        } else {
          throw new Error("Données utilisateur invalides");
        }
      } catch (error) {
        console.error('checkUser error:', error);
        currentUser = null;
        auth.removeToken();
        this.displayUserDisconnected();
        
        if (new URLSearchParams(window.location.search).get('auth') === 'error') {
          notifications.show("Erreur lors de la connexion", 'error');
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    },
    
    displayUserConnected(user) {
      const elements = {
        authStatus: domManager.get('authStatus'),
        googleLoginBtn: domManager.get('googleLoginBtn'),
        userInfo: domManager.get('userInfo'),
        userName: domManager.get('userName'),
        userEmail: domManager.get('userEmail'),
        userAvatar: domManager.get('userAvatar'),
        welcomeMessage: domManager.get('welcomeMessage'),
        welcomeUserName: domManager.get('welcomeUserName')
      };
      
      if (elements.authStatus) elements.authStatus.style.display = "none";
      if (elements.googleLoginBtn) elements.googleLoginBtn.style.display = "none";
      
      if (elements.userName) elements.userName.textContent = user.name || "Utilisateur";
      if (elements.userEmail) elements.userEmail.textContent = user.email || "";
      
      if (elements.userAvatar) {
        elements.userAvatar.src = user.photo || 
          `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&size=40&background=0d6efd&color=fff`;
        elements.userAvatar.alt = user.name || "Avatar";
      }
      
      if (elements.userInfo) elements.userInfo.style.display = "flex";
      if (elements.welcomeUserName) elements.welcomeUserName.textContent = user.name || "Utilisateur";
      if (elements.welcomeMessage) elements.welcomeMessage.style.display = "block";
    },
    
    displayUserDisconnected() {
      const elements = {
        userInfo: domManager.get('userInfo'),
        welcomeMessage: domManager.get('welcomeMessage'),
        authStatus: domManager.get('authStatus'),
        googleLoginBtn: domManager.get('googleLoginBtn')
      };
      
      if (elements.userInfo) elements.userInfo.style.display = "none";
      if (elements.welcomeMessage) elements.welcomeMessage.style.display = "none";
      
      if (elements.authStatus) {
        elements.authStatus.textContent = "❌ Non connecté";
        elements.authStatus.className = "auth-status disconnected";
        elements.authStatus.style.display = "block";
      }
      
      if (elements.googleLoginBtn) {
        elements.googleLoginBtn.href = `${CONFIG.BACKEND_URL}/auth/google`;
        elements.googleLoginBtn.style.display = "flex";
      }
    },
    
    async logout() {
      try {
        await apiManager.makeRequest(`${CONFIG.BACKEND_URL}/logout`, {
          method: 'POST',
          headers: auth.getAuthHeaders()
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
      
      auth.removeToken();
      currentUser = null;
      clientCache.clear();
      notifications.show("Déconnexion réussie", 'success');
      this.displayUserDisconnected();
    }
  };

  // ==================== PRODUCT RENDERER ====================
  const productRenderer = {
    renderStars(rating) {
      const fullStars = Math.floor(rating || 0);
      const hasHalfStar = (rating - fullStars) >= 0.5;
      let html = '<div class="stars">';
      
      for (let i = 1; i <= 5; i++) {
        if (i <= fullStars) {
          html += '<span class="star full">★</span>';
        } else if (hasHalfStar && i === fullStars + 1) {
          html += '<span class="star half">★</span>';
        } else {
          html += '<span class="star empty">★</span>';
        }
      }
      
      html += '</div>';
      return html;
    },
    
    renderReviews(reviews) {
      if (!reviews || !reviews.length) {
        return '<div class="no-reviews">Aucun avis disponible</div>';
      }
      
      return reviews.slice(0, 3).map(review => `
        <div class="review">
          <div class="review-header">
            <strong>${utils.escapeHtml(review.user_name || 'Anonyme')}</strong>
            <span class="review-date">${utils.formatDate(review.created_at)}</span>
          </div>
          <div class="review-body">${utils.escapeHtml(review.comment)}</div>
        </div>
      `).join('');
    },
    
    renderProductCard(product) {
      const title = utils.escapeHtml(product.title || "");
      const price = utils.escapeHtml(product.price || "");
      const link = product.link || "#";
      const rating = Number(product.user_rating || 0);
      const starsHTML = this.renderStars(rating);
      const reviewsHTML = this.renderReviews(product.reviews || []);
      const isLoggedIn = !!currentUser;
      
      return `
        <div class="product-card" data-id="${product.id}">
          <img src="${product.image || 'https://via.placeholder.com/400x300'}" 
               alt="${title}" loading="lazy" decoding="async" />
          <div class="product-info">
            <h3 class="product-title">${title}</h3>
            <div class="product-price">${price}</div>
            <div class="product-rating">
              ${starsHTML}
              <span class="rating-value">(${rating.toFixed(1)})</span>
            </div>
            <div class="product-actions">
              <a class="view-btn" href="${utils.escapeHtml(link)}" target="_blank" rel="noopener">
                Voir le produit
              </a>
              <button class="vote-btn" onclick="window.promptVote(${product.id})" 
                      ${!isLoggedIn ? 'disabled title="Connectez-vous pour voter"' : ''}>
                Noter
              </button>
            </div>
            <div class="reviews-section">
              <div class="reviews-list" id="reviews-${product.id}">
                ${reviewsHTML}
              </div>
              <div class="review-form">
                <textarea id="review-textarea-${product.id}" rows="3" 
                         ${!isLoggedIn ? 'placeholder="Connectez-vous pour laisser un avis" disabled' : 'placeholder="Votre avis..."'}></textarea>
                <button class="send-review-btn" onclick="window.submitReview(${product.id})" 
                        ${!isLoggedIn ? 'disabled' : ''}>
                  Envoyer l'avis
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    },
    
    renderSkeletonCards(count = 6) {
      return Array.from({ length: count }).map(() => `
        <div class="skeleton-card">
          <div class="skeleton-image"></div>
          <div class="skeleton-content">
            <div class="skeleton-line"></div>
            <div class="skeleton-line short"></div>
            <div class="skeleton-line medium"></div>
          </div>
        </div>
      `).join('');
    },
    
    displayProducts(products) {
      const container = domManager.get('productsContainer');
      if (!container) return;
      
      if (!products || !products.length) {
        container.innerHTML = '<div class="no-products">❌ Aucun produit trouvé.</div>';
        return;
      }
      
      // Grouper par sources
      const sources = {
        aliexpress: products.filter(p => (p.source || "").toLowerCase().includes("aliexpress")),
        amazon: products.filter(p => (p.source || "").toLowerCase().includes("amazon")),
        others: products.filter(p => {
          const source = (p.source || "").toLowerCase();
          return !source.includes("aliexpress") && !source.includes("amazon");
        })
      };
      
      let html = '';
      
      Object.entries(sources).forEach(([key, prods]) => {
        if (prods.length === 0) return;
        
        const titles = {
          aliexpress: 'AliExpress',
          amazon: 'Amazon',
          others: 'Autres sources'
        };
        
        html += `
          <div class="source-section">
            <h2 class="source-title">${titles[key]}</h2>
            <div class="product-grid">
              ${prods.map(p => this.renderProductCard(p)).join('')}
            </div>
          </div>
        `;
      });
      
      container.innerHTML = html;
    }
  };

  // ==================== PRODUCT ACTIONS ====================
  const productActions = {
    async promptVote(productId) {
      if (!currentUser) {
        notifications.show("Veuillez vous connecter pour voter", 'error');
        return;
      }
      
      const stars = parseInt(prompt("Notez ce produit (1-5 étoiles) :"));
      
      if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
        notifications.show("Note invalide", 'error');
        return;
      }
      
      try {
        const result = await apiManager.makeRequest(`${CONFIG.BACKEND_URL}/vote`, {
          method: 'POST',
          headers: auth.getAuthHeaders(),
          body: JSON.stringify({ product_id: productId, stars })
        });
        
        notifications.show(`Vote enregistré : ${stars}/5 étoiles`, 'success');
        
        // ✅ CORRECTION: Mise à jour locale du produit au lieu de recharger tout
        this.updateProductRatingLocally(productId, result.user_rating);
        
      } catch (error) {
        console.error('Vote error:', error);
        
        if (error.message.includes('401')) {
          notifications.show("Session expirée", 'error');
          auth.removeToken();
          userManager.displayUserDisconnected();
        } else {
          notifications.show("Erreur lors du vote", 'error');
        }
      }
    },
    
    // ✅ NOUVELLE FONCTION: Mise à jour locale du rating
    updateProductRatingLocally(productId, newRating) {
      const productCard = document.querySelector(`[data-id="${productId}"]`);
      if (!productCard) return;
      
      const ratingValue = productCard.querySelector('.rating-value');
      const starsContainer = productCard.querySelector('.stars');
      
      if (ratingValue) {
        ratingValue.textContent = `(${Number(newRating).toFixed(1)})`;
      }
      
      if (starsContainer) {
        starsContainer.innerHTML = productRenderer.renderStars(Number(newRating)).replace('<div class="stars">', '').replace('</div>', '');
      }
    },
    
    async submitReview(productId) {
      if (!currentUser) {
        notifications.show("Veuillez vous connecter pour laisser un avis", 'error');
        return;
      }
      
      const textarea = document.getElementById(`review-textarea-${productId}`);
      if (!textarea) return;
      
      const comment = textarea.value.trim();
      if (!comment) {
        notifications.show("Veuillez écrire un commentaire", 'error');
        return;
      }
      
      try {
        const result = await apiManager.makeRequest(`${CONFIG.BACKEND_URL}/review`, {
          method: 'POST',
          headers: auth.getAuthHeaders(),
          body: JSON.stringify({ product_id: productId, comment })
        });
        
        notifications.show("Avis publié avec succès", 'success');
        
        if (result?.reviews) {
          const reviewsContainer = document.getElementById(`reviews-${productId}`);
          if (reviewsContainer) {
            reviewsContainer.innerHTML = productRenderer.renderReviews(result.reviews);
          }
        }
        
        textarea.value = '';
        
      } catch (error) {
        console.error('Review error:', error);
        
        if (error.message.includes('401')) {
          notifications.show("Session expirée", 'error');
          auth.removeToken();
          userManager.displayUserDisconnected();
        } else {
          notifications.show("Erreur lors de l'envoi de l'avis", 'error');
        }
      }
    }
  };

  // ==================== PRODUCT MANAGER ====================
  const productManager = {
    async loadProducts() {
      const container = domManager.get('productsContainer');
      
      // Essayer d'abord le cache localStorage
      try {
        const cached = localStorage.getItem('sawem_products_cache');
        const cacheTime = localStorage.getItem('sawem_products_cache_time');
        
        if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < 300000) { // 5 min
          productRenderer.displayProducts(JSON.parse(cached));
        } else {
          if (container) container.innerHTML = productRenderer.renderSkeletonCards(6);
        }
      } catch (error) {
        if (container) container.innerHTML = productRenderer.renderSkeletonCards(6);
      }

      try {
        const products = await apiManager.makeRequest(
          `${CONFIG.BACKEND_URL}/products`,
          { method: 'GET', headers: auth.getAuthHeaders() },
          true,
          'products-list'
        );
        
        productRenderer.displayProducts(products);
        
        // Sauvegarder en cache
        try {
          localStorage.setItem('sawem_products_cache', JSON.stringify(products));
          localStorage.setItem('sawem_products_cache_time', Date.now().toString());
        } catch (error) {
          console.warn('Cannot save to localStorage:', error);
        }
        
      } catch (error) {
        console.error('Load products error:', error);
        if (container && !container.innerHTML.includes('product-card')) {
          container.innerHTML = '<div class="no-products">❌ Impossible de charger les produits.</div>';
        }
      }
    },
    
    async searchProducts(query) {
      if (!query) {
        this.loadProducts();
        return;
      }
      
      const container = domManager.get('productsContainer');
      if (container) container.innerHTML = productRenderer.renderSkeletonCards(4);
      
      try {
        const products = await apiManager.makeRequest(`${CONFIG.BACKEND_URL}/search`, {
          method: 'POST',
          headers: auth.getAuthHeaders(),
          body: JSON.stringify({ query })
        });
        
        productRenderer.displayProducts(products);
        
      } catch (error) {
        console.error('Search products error:', error);
        const container = domManager.get('productsContainer');
        if (container) {
          container.innerHTML = '<div class="no-products">❌ Recherche impossible.</div>';
        }
      }
    }
  };

  // ==================== GLOBAL EVENTS ====================
  function attachGlobalEvents() {
    const searchBtn = domManager.get('searchBtn');
    const searchInput = domManager.get('searchInput');
    
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        const query = searchInput?.value?.trim();
        productManager.searchProducts(query);
      });
    }
    
    if (searchInput) {
      const debouncedSearch = utils.debounce((query) => {
        productManager.searchProducts(query);
      }, CONFIG.DEBOUNCE_DELAY);
      
      searchInput.addEventListener('input', (event) => {
        const query = event.target.value.trim();
        if (query.length >= 2) {
          debouncedSearch(query);
        } else if (query.length === 0) {
          productManager.loadProducts();
        }
      });
      
      searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          productManager.searchProducts(event.target.value.trim());
        }
      });
    }
    
    const logoutBtn = domManager.get('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => userManager.logout());
    }
  }

  // ==================== EXPOSER LES FONCTIONS POUR LES ONCLICK ====================
  window.promptVote = productActions.promptVote.bind(productActions);
  window.submitReview = productActions.submitReview.bind(productActions);

  // ==================== INIT SERVICE WORKER ====================
  function initServiceWorkerCache() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .catch(err => console.log('SW registration failed:', err));
    }
  }

  // ==================== INIT APP ====================
  async function initApp() {
    domManager.init();
    attachGlobalEvents();
    initServiceWorkerCache();
    
    // Nettoyage périodique du cache
    setInterval(() => clientCache.cleanup(), 5 * 60 * 1000);
    
    await userManager.checkUser();
    productManager.loadProducts();
  }

  // ==================== START APP ====================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
