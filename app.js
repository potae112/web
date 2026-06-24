// Nexa Store - JavaScript Application Logic

const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3Crect fill='%23ffffff' opacity='0.05' width='1' height='1'/%3E%3C/svg%3E";

// ================= DATABASE / STATE MANAGEMENT =================
let db = {
  settings: {
    siteName: "test",
    logoUrl: "",
    siteDesc: "ยินดีต้อนรับเข้าสู่ test!",
    footerText: "ข้อความที่จะแสดงใน Footer ของเว็บไซต์",
    bgUrl: "",
    bgOpacity: "14.6",
    glassBlur: true,
    productsCol5: true,
    showPurchases: true,
    // Style settings
    colorPrimary: "#ff477e",
    colorBg: "#0b0f19",
    colorTitleLogo: "#ffffff",
    fontFamily: "system-ui, -apple-system, sans-serif",
    customCss: "/* เขียน CSS เพิ่มเติมที่นี่ */",
    // Banner settings
    bannerTitle: "ยินดีต้อนรับเข้าสู่ test!",
    bannerDesc: "พบกับสินค้าล้ำสมัย คุณภาพเยี่ยมในราคาสุดพิเศษได้ที่นี่",
    bannerImg: "",
    bannerTag: "โปรโมชั่นพิเศษ",
    // Auth settings
    registerEnabled: true,
    loginTitle: "test",
    loginLogo: "",
    loginDesc: "เข้าสู่ระบบเพื่อเข้าถึงบัญชีของคุณ",
    registerTitle: "test",
    registerLogo: "",
    registerDesc: "สร้างบัญชีของคุณ",
    authBg: "#1e1e1e",
    authTitleColor: "#ffffff",
    authDescColor: "#a0a0a0",
    authTextColor: "#ffffff",
    authBorderColor: "#333333",
    // SEO Settings
    seoTitle: "test - ร้านค้าพรีเมียม",
    seoDesc: "ยินดีต้อนรับเข้าสู่ test!",
    seoFavicon: "",
    // Discord Webhook settings
    webhookUrl: "",
    webhookOnRegister: true,
    webhookOnPurchase: true,
    // Top announcement settings
    topAnnEnabled: false,
    topAnnText: "",
    topAnnMode: "static",
    topAnnBg: "#ffffff",
    topAnnColor: "#ffffff",
    // Popup settings
    popupEnabled: false,
    popupTitle: "",
    popupImg: "",
    popupLink: "",
    // Contact settings
    contactFacebook: "",
    contactDiscord: "",
    contactLine: ""
  },
  products: [],
  users: [
    { username: "admin", password: "0952235101Asd@@", role: "admin" }
  ],
  orders: [],
  recentPurchases: [],
  announcements: []
};

// Application State
let currentUser = null;
let cart = [];
let selectedProduct = null;
let currentView = "shop";

// Initialize LocalStorage Data
function loadDatabase() {
  const localDb = localStorage.getItem("nexa_store_db_v6");
  if (localDb) {
    try {
      db = JSON.parse(localDb);
      // Ensure arrays exist
      if (!db.products) db.products = [];
      if (!db.users) db.users = [];
      if (!db.orders) db.orders = [];
      if (!db.recentPurchases) db.recentPurchases = [];
      if (!db.settings) db.settings = {};
      if (!db.announcements) db.announcements = [];
      if (!db.categories) db.categories = [];
    } catch (e) {
      console.error("Error loading localStorage DB, using default.", e);
    }
  } else {
    // Migrate from v5 if available
    const oldDb = localStorage.getItem("nexa_store_db_v5");
    if (oldDb) {
      try {
        db = JSON.parse(oldDb);
        if (!db.announcements) db.announcements = [];
        if (db.settings.topAnnBg === undefined) {
          db.settings.topAnnEnabled = false;
          db.settings.topAnnText = "";
          db.settings.topAnnMode = "static";
          db.settings.topAnnBg = "#ffffff";
          db.settings.topAnnColor = "#ffffff";
        }
        if (db.settings.popupEnabled === undefined) {
          db.settings.popupEnabled = false;
          db.settings.popupTitle = "";
          db.settings.popupImg = "";
          db.settings.popupLink = "";
        }
        saveDatabase();
      } catch (e) {
        console.error("Migration error", e);
      }
    } else {
      saveDatabase();
    }
  }

  // Migration for separate Webhook URLs
  if (db.settings) {
    let migrated = false;
    if (db.settings.webhookRegisterUrl === undefined) {
      db.settings.webhookRegisterUrl = db.settings.webhookUrl || "";
      migrated = true;
    }
    if (db.settings.webhookRegisterEnabled === undefined) {
      db.settings.webhookRegisterEnabled = db.settings.webhookOnRegister !== false;
      migrated = true;
    }
    if (db.settings.webhookPurchaseUrl === undefined) {
      db.settings.webhookPurchaseUrl = db.settings.webhookUrl || "";
      migrated = true;
    }
    if (db.settings.webhookPurchaseEnabled === undefined) {
      db.settings.webhookPurchaseEnabled = db.settings.webhookOnPurchase !== false;
      migrated = true;
    }
    if (migrated) {
      saveDatabase();
    }
  }

  // Force update default admin password
  const adminUser = db.users.find(u => u.username === "admin");
  if (adminUser) {
    adminUser.password = "0952235101Asd@@";
    saveDatabase();
  }

  // Automatic upgrade from default white/black to rose theme if setting hasn't been custom modified
  if (db.settings && db.settings.colorPrimary === "#ffffff") {
    db.settings.colorPrimary = "#ff477e";
    db.settings.colorBg = "#0b0f19";
    saveDatabase();
  }
}

function saveDatabase() {
  localStorage.setItem("nexa_store_db_v6", JSON.stringify(db));
}

// ================= INITIALIZATION & STYLE INJECTION =================
document.addEventListener("DOMContentLoaded", () => {
  loadDatabase();
  applySettings();
  initAuthSession();
  renderStoreFront();
  setupAdminForms();
  showView("shop");
  checkPopupAnnouncement();
});

function applySettings() {
  const s = db.settings;
  
  // Set SEO Meta
  document.title = s.seoTitle || s.siteName || "Nexa Store";
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.name = "description";
    document.head.appendChild(metaDesc);
  }
  metaDesc.content = s.seoDesc || "";
  
  let favicon = document.querySelector('link[rel="icon"]');
  if (!favicon) {
    favicon = document.createElement('link');
    favicon.rel = "icon";
    document.head.appendChild(favicon);
  }
  favicon.href = s.seoFavicon || "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🛒</text></svg>";

  // Apply CSS variables to Root
  const root = document.documentElement;
  root.style.setProperty("--site-name-color", s.colorTitleLogo || "#ffffff");
  root.style.setProperty("--primary-color", s.colorPrimary || "#ffffff");
  root.style.setProperty("--primary-hover", adjustColorLightness(s.colorPrimary || "#ffffff", -10));
  root.style.setProperty("--bg-color", s.colorBg || "#121212");
  root.style.setProperty("--bg-overlay-opacity", (parseFloat(s.bgOpacity || 0) / 100).toString());
  root.style.setProperty("--bg-image", s.bgUrl ? `url('${s.bgUrl}')` : 'none');
  root.style.setProperty("--font-family", s.fontFamily || "'Kanit', sans-serif");
  
  // Products per row grid class
  root.style.setProperty("--products-per-row", s.productsCol5 ? "5" : "4");

  // Menu Glassmorphism or solid
  const header = document.getElementById("site-header");
  const cartDrawer = document.getElementById("cart-drawer");
  const adminSidebar = document.querySelector(".admin-sidebar");
  const purchaseTicker = document.getElementById("recent-purchases-container");

  if (s.glassBlur) {
    header?.classList.remove("no-glass");
    header?.classList.add("glass-effect");
    cartDrawer?.classList.remove("no-glass");
    cartDrawer?.classList.add("glass-effect");
    adminSidebar?.classList.remove("no-glass");
    adminSidebar?.classList.add("glass-effect");
    purchaseTicker?.classList.remove("no-glass");
    purchaseTicker?.classList.add("glass-effect");
  } else {
    header?.classList.remove("glass-effect");
    header?.classList.add("no-glass");
    cartDrawer?.classList.remove("glass-effect");
    cartDrawer?.classList.add("no-glass");
    adminSidebar?.classList.remove("glass-effect");
    adminSidebar?.classList.add("no-glass");
    purchaseTicker?.classList.remove("glass-effect");
    purchaseTicker?.classList.add("no-glass");
  }

  // Auth Colors
  root.style.setProperty("--auth-bg-color", s.authBg || "#ffffff");
  root.style.setProperty("--auth-title-color", s.authTitleColor || "#111827");
  root.style.setProperty("--auth-text-color", s.authTextColor || "#111827");
  root.style.setProperty("--auth-desc-color", s.authDescColor || "#4b5563");
  root.style.setProperty("--auth-border-color", s.authBorderColor || "#F3F4F6");

  // Inject Custom CSS
  document.getElementById("admin-custom-styles").textContent = s.customCss || "";

  // Render frontend texts
  document.getElementById("header-title").textContent = s.siteName;
  
  const headerLogo = document.getElementById("header-logo");
  if (headerLogo) {
    if (s.logoUrl) {
      headerLogo.src = s.logoUrl;
      headerLogo.style.display = "block";
    } else {
      headerLogo.style.display = "none";
    }
  }
  
  // Banner Render
  const banner = document.getElementById("hero-banner");
  if (banner) {
    banner.style.backgroundImage = s.bannerImg ? `url('${s.bannerImg}')` : 'none';
  }
  document.getElementById("banner-tag").textContent = s.bannerTag || "โปรโมชั่น";
  document.getElementById("banner-title").textContent = s.bannerTitle || s.siteName;
  document.getElementById("banner-desc").textContent = s.bannerDesc || s.siteDesc;

  // Footer text
  const footerLogo = document.getElementById("footer-logo-img");
  if (footerLogo) {
    if (s.logoUrl) {
      footerLogo.src = s.logoUrl;
      footerLogo.style.display = "block";
    } else {
      footerLogo.style.display = "none";
    }
  }
  document.getElementById("footer-site-name").textContent = s.siteName;
  document.getElementById("footer-site-desc").textContent = s.siteDesc;
  document.getElementById("footer-custom-message").textContent = s.footerText;
  document.getElementById("footer-copyright-name").textContent = s.siteName;

  // Contact list rendering in footer
  const contactList = document.getElementById("footer-contact-list");
  if (contactList) {
    let html = "";
    if (s.contactFacebook) {
      html += `<a href="${s.contactFacebook}" target="_blank" style="display: flex; align-items: center; gap: 8px; color: inherit; text-decoration: none; transition: color 0.2s;" onmouseover="this.style.color='var(--primary-color)'" onmouseout="this.style.color='inherit'"><i class="fa-brands fa-facebook" style="color: #1877F2; font-size: 1.1rem; width: 20px; text-align: center;"></i> Facebook</a>`;
    }
    if (s.contactDiscord) {
      html += `<a href="${s.contactDiscord}" target="_blank" style="display: flex; align-items: center; gap: 8px; color: inherit; text-decoration: none; transition: color 0.2s;" onmouseover="this.style.color='var(--primary-color)'" onmouseout="this.style.color='inherit'"><i class="fa-brands fa-discord" style="color: #5865F2; font-size: 1.1rem; width: 20px; text-align: center;"></i> Discord</a>`;
    }
    if (s.contactLine) {
      const lineUrl = s.contactLine.startsWith("http") ? s.contactLine : `https://line.me/R/ti/p/~${s.contactLine.replace("@", "")}`;
      html += `<a href="${lineUrl}" target="_blank" style="display: flex; align-items: center; gap: 8px; color: inherit; text-decoration: none; transition: color 0.2s;" onmouseover="this.style.color='var(--primary-color)'" onmouseout="this.style.color='inherit'"><i class="fa-brands fa-line" style="color: #06C755; font-size: 1.1rem; width: 20px; text-align: center;"></i> Line</a>`;
    }
    if (!s.contactFacebook && !s.contactDiscord && !s.contactLine) {
      html = `<span style="color: var(--text-muted); font-style: italic;">ยังไม่ได้ตั้งค่าช่องทางติดต่อ</span>`;
    }
    contactList.innerHTML = html;
  }

  // Contact Dropdown rendering in Navbar
  const contactDropdown = document.getElementById("contact-dropdown-menu");
  if (contactDropdown) {
    let dropdownHtml = "";
    if (s.contactFacebook) {
      dropdownHtml += `<a href="${s.contactFacebook}" target="_blank" class="dropdown-item"><i class="fa-brands fa-facebook" style="color: #1877F2; width: 18px; text-align: center;"></i> Facebook</a>`;
    }
    if (s.contactDiscord) {
      dropdownHtml += `<a href="${s.contactDiscord}" target="_blank" class="dropdown-item"><i class="fa-brands fa-discord" style="color: #5865F2; width: 18px; text-align: center;"></i> Discord</a>`;
    }
    if (s.contactLine) {
      const lineUrl = s.contactLine.startsWith("http") ? s.contactLine : `https://line.me/R/ti/p/~${s.contactLine.replace("@", "")}`;
      dropdownHtml += `<a href="${lineUrl}" target="_blank" class="dropdown-item"><i class="fa-brands fa-line" style="color: #06C755; width: 18px; text-align: center;"></i> Line</a>`;
    }
    if (!s.contactFacebook && !s.contactDiscord && !s.contactLine) {
      dropdownHtml = `<span class="dropdown-item" style="color: var(--text-muted); font-size: 0.8rem; font-style: italic; pointer-events: none;">ยังไม่ได้ตั้งค่าช่องทางติดต่อ</span>`;
    }
    contactDropdown.innerHTML = dropdownHtml;
  }

  // Toggle dynamic features on front view
  const tickerSection = document.getElementById("recent-purchases-container");
  if (tickerSection) {
    tickerSection.style.display = s.showPurchases ? "flex" : "none";
  }

  // Setup Auth Cards texts and images dynamically
  const loginLogo = document.getElementById("login-logo");
  if (loginLogo) {
    if (s.loginLogo) {
      loginLogo.src = s.loginLogo;
      loginLogo.style.display = "block";
    } else {
      loginLogo.style.display = "none";
    }
  }
  document.getElementById("login-title").textContent = s.loginTitle;
  document.getElementById("login-desc").textContent = s.loginDesc;

  const registerLogo = document.getElementById("register-logo");
  if (registerLogo) {
    if (s.registerLogo) {
      registerLogo.src = s.registerLogo;
      registerLogo.style.display = "block";
    } else {
      registerLogo.style.display = "none";
    }
  }
  document.getElementById("register-title").textContent = s.registerTitle;
  document.getElementById("register-desc").textContent = s.registerDesc;
  
  // Register toggle on Auth page
  const registerLink = document.getElementById("register-link-container");
  if (registerLink) {
    registerLink.style.display = s.registerEnabled ? "block" : "none";
  }

  // Top Announcement Rendering
  const topAnnBar = document.getElementById("top-announcement-bar");
  const topAnnContent = document.getElementById("top-announcement-content");
  if (topAnnBar && topAnnContent) {
    if (s.topAnnEnabled) {
      topAnnBar.style.display = "block";
      topAnnBar.style.backgroundColor = s.topAnnBg || "#ffffff";
      topAnnBar.style.color = s.topAnnColor || "#000000";
      
      if (s.topAnnMode === "scroll") {
        topAnnContent.innerHTML = `<marquee scrollamount="5" behavior="scroll" direction="left" onmouseover="this.stop();" onmouseout="this.start();">${s.topAnnText}</marquee>`;
      } else {
        topAnnContent.innerHTML = s.topAnnText || "";
      }
      
      requestAnimationFrame(() => {
        const height = topAnnBar.offsetHeight;
        document.documentElement.style.setProperty("--top-ann-height", height + "px");
      });
    } else {
      topAnnBar.style.display = "none";
      document.documentElement.style.setProperty("--top-ann-height", "0px");
    }
  }
}

// Utility to lighten/darken color for hover effect
function adjustColorLightness(hex, percent) {
  let R = parseInt(hex.substring(1, 3), 16);
  let G = parseInt(hex.substring(3, 5), 16);
  let B = parseInt(hex.substring(5, 7), 16);

  R = parseInt(R * (100 + percent) / 100);
  G = parseInt(G * (100 + percent) / 100);
  B = parseInt(B * (100 + percent) / 100);

  R = (R < 255) ? R : 255;
  G = (G < 255) ? G : 255;
  B = (B < 255) ? B : 255;

  R = (R > 0) ? R : 0;
  G = (G > 0) ? G : 0;
  B = (B > 0) ? B : 0;

  const rHex = R.toString(16).padStart(2, '0');
  const gHex = G.toString(16).padStart(2, '0');
  const bHex = B.toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}

// Sync HEX Text box and color wheel
function syncHexToColorPicker(pickerId, hexValue) {
  if (/^#[0-9A-F]{6}$/i.test(hexValue)) {
    document.getElementById(pickerId).value = hexValue;
  }
}

function updateBgOpacityLabel(val) {
  document.getElementById("bg-opacity-label").textContent = val + "%";
}

// ================= SESSION & ROUTING =================
function initAuthSession() {
  const sessionUser = sessionStorage.getItem("nexa_session_user");
  if (sessionUser) {
    currentUser = JSON.parse(sessionUser);
    updateNavbarAuthUI();
  }
}

function showView(viewName) {
  currentView = viewName;
  document.querySelectorAll(".view-section").forEach(sec => sec.style.display = "none");
  
  const navShop = document.getElementById("nav-shop");
  const navAdmin = document.getElementById("nav-admin");

  if (viewName === "shop") {
    document.getElementById("shop-view").style.display = "block";
    if (navShop) navShop.classList.add("active");
    if (navAdmin) navAdmin.classList.remove("active");
    renderStoreFront();
  } else if (viewName === "auth") {
    document.getElementById("auth-view").style.display = "block";
    if (navShop) navShop.classList.remove("active");
    if (navAdmin) navAdmin.classList.remove("active");
    toggleAuthMode('login');
  } else if (viewName === "admin") {
    // Auth Check
    if (!currentUser || currentUser.role !== "admin") {
      showNotification("เฉพาะผู้ดูแลระบบเท่านั้นที่เข้าถึงหน้านี้ได้", "error");
      showView("auth");
      return;
    }
    document.getElementById("admin-view").style.display = "block";
    if (navShop) navShop.classList.remove("active");
    if (navAdmin) navAdmin.classList.add("active");
    renderAllAdminLists();

  }
  
  // Collapse Mobile menu
  document.getElementById("main-nav").classList.remove("active");
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleMobileMenu() {
  document.getElementById("main-nav").classList.toggle("active");
}

function updateNavbarAuthUI() {
  const authItem = document.getElementById("nav-auth-item");
  const userItem = document.getElementById("nav-user-item");
  const dropdownAdmin = document.getElementById("dropdown-nav-admin");
  const navUsername = document.getElementById("nav-username");

  if (currentUser) {
    authItem.style.display = "none";
    userItem.style.display = "block";
    navUsername.textContent = currentUser.username;

    if (currentUser.role === "admin") {
      if (dropdownAdmin) dropdownAdmin.style.display = "flex";
    } else {
      if (dropdownAdmin) dropdownAdmin.style.display = "none";
    }
  } else {
    authItem.style.display = "block";
    userItem.style.display = "none";
    if (dropdownAdmin) dropdownAdmin.style.display = "none";
  }
}

function toggleAuthMode(mode) {
  if (mode === "register") {
    if (!db.settings.registerEnabled) {
      showNotification("การลงทะเบียนถูกปิดใช้งานโดยผู้ดูแลระบบ", "error");
      return;
    }
    document.getElementById("login-card").style.display = "none";
    document.getElementById("register-card").style.display = "block";
  } else {
    document.getElementById("login-card").style.display = "block";
    document.getElementById("register-card").style.display = "none";
  }
}

// ================= AUTHENTICATION ACTIONS =================
function handleLogin(e) {
  e.preventDefault();
  const userInp = document.getElementById("login-username").value.trim();
  const passInp = document.getElementById("login-password").value;

  const foundUser = db.users.find(u => u.username.toLowerCase() === userInp.toLowerCase() && u.password === passInp);
  
  if (foundUser) {
    if (foundUser.status === "suspended") {
      showNotification("บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ", "error");
      return;
    }
    currentUser = foundUser;
    sessionStorage.setItem("nexa_session_user", JSON.stringify(currentUser));
    updateNavbarAuthUI();
    showNotification(`ยินดีต้อนรับกลับมาคุณ ${currentUser.username}!`, "success");
    
    // Clear login inputs
    document.getElementById("login-username").value = "";
    document.getElementById("login-password").value = "";

    if (currentUser.role === "admin") {
      showView("admin");
    } else {
      showView("shop");
    }
  } else {
    showNotification("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง!", "error");
  }
}

function handleRegister(e) {
  e.preventDefault();
  if (!db.settings.registerEnabled) {
    showNotification("ขณะนี้ปิดปรับปรุงระบบรับสมัครสมาชิกใหม่", "error");
    return;
  }

  const userInp = document.getElementById("register-username").value.trim();
  const passInp = document.getElementById("register-password").value;
  const confPass = document.getElementById("register-confirm-password").value;

  if (userInp.length < 4) {
    showNotification("ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 4 ตัวอักษร", "error");
    return;
  }
  if (passInp.length < 6) {
    showNotification("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร", "error");
    return;
  }
  if (passInp !== confPass) {
    showNotification("ยืนยันรหัสผ่านไม่ตรงกัน!", "error");
    return;
  }

  const existUser = db.users.find(u => u.username.toLowerCase() === userInp.toLowerCase());
  if (existUser) {
    showNotification("มีชื่อผู้ใช้นี้ในระบบแล้ว!", "error");
    return;
  }

  // Create member account
  const newUser = { username: userInp, password: passInp, role: "member" };
  db.users.push(newUser);
  saveDatabase();

  showNotification("สมัครสมาชิกสำเร็จแล้ว! กรุณาเข้าสู่ระบบ", "success");
  
  // Trigger Discord Register Webhook
  triggerDiscordWebhook("register", { username: userInp });

  // Clear inputs and toggle
  document.getElementById("register-username").value = "";
  document.getElementById("register-password").value = "";
  document.getElementById("register-confirm-password").value = "";
  toggleAuthMode("login");
}

function logout() {
  currentUser = null;
  sessionStorage.removeItem("nexa_session_user");
  cart = [];
  updateCartBadge();
  updateNavbarAuthUI();
  showNotification("ออกจากระบบเรียบร้อยแล้ว", "info");
  showView("shop");
}

// ================= FRONTEND SHOP SYSTEM =================
let activeCategory = "all";
let searchQuery = "";

function renderStoreFront() {
  renderAnnouncements();
  const container = document.getElementById("products-container");
  if (!container) return;

  container.innerHTML = "";

  // Render Categories buttons
  const catListContainer = document.getElementById("category-list");
  if (catListContainer) {
    const categoriesSet = new Set(db.products.map(p => p.category));
    let catHtml = `<button class="category-btn ${activeCategory === 'all' ? 'active' : ''}" onclick="filterCategory('all')">ทั้งหมด</button>`;
    
    categoriesSet.forEach(cat => {
      if (cat) {
        catHtml += `<button class="category-btn ${activeCategory === cat ? 'active' : ''}" onclick="filterCategory('${cat}')">${cat}</button>`;
      }
    });
    catListContainer.innerHTML = catHtml;
  }

  // Filter products
  let filtered = db.products;
  if (activeCategory !== "all") {
    filtered = filtered.filter(p => p.category === activeCategory);
  }
  if (searchQuery) {
    filtered = filtered.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.desc.toLowerCase().includes(searchQuery.toLowerCase()));
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-store glass-effect">
        <i class="fa-solid fa-box-open"></i>
        <h3>ไม่พบรายการสินค้าที่ตรงตามความต้องการของคุณ</h3>
        <p>ลองค้นหาด้วยคำอื่นหรือเลือกหมวดหมู่อื่น</p>
      </div>
    `;
    return;
  }

  // Render products
  filtered.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card glass-effect";
    
    const stockBadge = getProductBadgeHTML(p);
    const productImgSrc = p.image || PLACEHOLDER_IMG;
    
    card.onclick = () => openProductDetailModal(p.id);
    card.style.cursor = "pointer";

    card.innerHTML = `
      <div class="product-image-container">
        <img src="${productImgSrc}" alt="${p.title}" class="product-img" loading="lazy">
        ${stockBadge}
      </div>
      <div class="product-info">
        <span class="product-category">${p.category}</span>
        <h3 class="product-title">${p.title}</h3>
        <p class="product-desc">${p.desc || 'ไม่มีคำอธิบายสำหรับสินค้านี้'}</p>
        <div class="product-footer">
          <div class="product-price">฿${p.price.toLocaleString()}<span>THB</span></div>
          <button class="product-btn" title="ดูรายละเอียด"><i class="fa-solid fa-eye"></i></button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  // Recent Purchase Ticker Track
  renderTicker();
}

function renderTicker() {
  const track = document.getElementById("ticker-track");
  if (!track) return;
  track.innerHTML = "";

  if (db.recentPurchases.length === 0) {
    track.innerHTML = `<span class="ticker-item"><i class="fa-solid fa-clock"></i> ยังไม่มีรายการซื้อล่าสุด</span>`;
    return;
  }

  // Create ticker items
  let tickerHtml = "";
  db.recentPurchases.forEach(item => {
    tickerHtml += `
      <span class="ticker-item">
        <div class="ticker-avatar">${item.username.substring(0, 1).toUpperCase()}</div>
        <span>คุณ <strong>${item.username}</strong> ซื้อ <strong>${item.product}</strong></span>
        <span class="ticker-time"><i class="fa-solid fa-clock-rotate-left"></i> ${item.time}</span>
      </span>
    `;
  });

  // To loop seamlessly, duplicate contents
  track.innerHTML = tickerHtml + tickerHtml;
}

function filterCategory(catName) {
  activeCategory = catName;
  renderStoreFront();
}

let searchDebounceTimer;
function handleSearch(val) {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    searchQuery = val.trim();
    renderStoreFront();
  }, 250);
}

// Helper functions for custom badges and product media galleries
function getProductBadgeHTML(p) {
  const badgeType = p.customBadge || "auto";
  
  if (badgeType === "none") {
    return "";
  }
  
  if (badgeType === "hot") {
    return `<span class="product-badge" style="background: linear-gradient(135deg, #ff0844 0%, #ffb199 100%); box-shadow: 0 0 10px rgba(255, 8, 68, 0.5);">HOT</span>`;
  }
  if (badgeType === "bestseller") {
    return `<span class="product-badge" style="background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); color: #111; box-shadow: 0 0 10px rgba(246, 211, 101, 0.3);">ขายดี</span>`;
  }
  if (badgeType === "new") {
    return `<span class="product-badge" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); box-shadow: 0 0 10px rgba(79, 172, 254, 0.4);">ใหม่</span>`;
  }
  if (badgeType === "out") {
    return `<span class="product-badge" style="background: #ef4444;">หมด</span>`;
  }

  // auto based on stock
  if (p.stock > 0) {
    return `<span class="product-badge">มีสินค้า</span>`;
  } else {
    return `<span class="product-badge" style="background: #ef4444;">หมด</span>`;
  }
}

function isVideoUrl(url) {
  if (!url) return false;
  const cleanUrl = url.trim().toLowerCase();
  return cleanUrl.endsWith(".mp4") || 
         cleanUrl.endsWith(".webm") || 
         cleanUrl.endsWith(".mov") || 
         cleanUrl.includes("youtube.com") || 
         cleanUrl.includes("youtu.be");
}

function getYoutubeEmbedUrl(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}?autoplay=1`;
  }
  return url;
}

function getYoutubeId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : "";
}

// ================= PRODUCT DETAILS MODAL =================
function openProductDetailModal(id) {
  const p = db.products.find(prod => prod.id === id);
  if (!p) return;

  selectedProduct = p;

  // Clear previous media state
  const imgViewer = document.getElementById("detail-modal-img");
  const videoViewer = document.getElementById("detail-modal-video");
  const iframeViewer = document.getElementById("detail-modal-iframe");
  const gallery = document.getElementById("detail-modal-gallery");

  imgViewer.style.display = "block";
  videoViewer.style.display = "none";
  videoViewer.src = "";
  iframeViewer.style.display = "none";
  iframeViewer.src = "";
  gallery.innerHTML = "";

  // Set default main image
  const defaultImg = p.image || PLACEHOLDER_IMG;
  imgViewer.src = defaultImg;

  // Parse gallery items
  const galleryItems = [];
  // Add main image first
  galleryItems.push({ type: "image", url: defaultImg });

  // Add additional items from p.gallery
  if (p.gallery) {
    const lines = p.gallery.split("\n").map(l => l.trim()).filter(Boolean);
    lines.forEach(url => {
      if (isVideoUrl(url)) {
        galleryItems.push({ type: "video", url: url });
      } else {
        galleryItems.push({ type: "image", url: url });
      }
    });
  }

  // Helper to switch active media
  function selectMedia(item) {
    if (item.type === "video") {
      imgViewer.style.display = "none";
      if (item.url.includes("youtube.com") || item.url.includes("youtu.be")) {
        videoViewer.style.display = "none";
        videoViewer.src = "";
        iframeViewer.style.display = "block";
        iframeViewer.src = getYoutubeEmbedUrl(item.url);
      } else {
        iframeViewer.style.display = "none";
        iframeViewer.src = "";
        videoViewer.style.display = "block";
        videoViewer.src = item.url;
        videoViewer.play().catch(() => {});
      }
    } else {
      videoViewer.style.display = "none";
      videoViewer.src = "";
      iframeViewer.style.display = "none";
      iframeViewer.src = "";
      imgViewer.style.display = "block";
      imgViewer.src = item.url;
    }
  }

  // If there are multiple items, render thumbnails
  if (galleryItems.length > 1) {
    gallery.style.display = "flex";
    galleryItems.forEach((item, index) => {
      const thumb = document.createElement("div");
      thumb.style.width = "50px";
      thumb.style.height = "50px";
      thumb.style.borderRadius = "4px";
      thumb.style.overflow = "hidden";
      thumb.style.cursor = "pointer";
      thumb.style.border = index === 0 ? "2px solid var(--primary-color)" : "1px solid var(--glass-border)";
      thumb.style.flexShrink = "0";
      thumb.style.background = "rgba(0,0,0,0.3)";
      thumb.style.display = "flex";
      thumb.style.alignItems = "center";
      thumb.style.justifyContent = "center";
      thumb.style.position = "relative";

      if (item.type === "video") {
        // Thumbnail with play icon overlay
        thumb.innerHTML = `
          <div style="position:absolute; width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.5); z-index:1;">
            <i class="fa-solid fa-play" style="color:white; font-size:0.8rem;"></i>
          </div>
        `;
        if (item.url.includes("youtube.com") || item.url.includes("youtu.be")) {
          const ytId = getYoutubeId(item.url);
          thumb.style.backgroundImage = `url('https://img.youtube.com/vi/${ytId}/default.jpg')`;
          thumb.style.backgroundSize = "cover";
          thumb.style.backgroundPosition = "center";
        } else {
          thumb.innerHTML += `<video src="${item.url}" style="width:100%; height:100%; object-fit:cover;"></video>`;
        }
      } else {
        thumb.innerHTML = `<img src="${item.url}" loading="lazy" style="width:100%; height:100%; object-fit:cover;">`;
      }

      thumb.onclick = () => {
        // Highlight active border
        Array.from(gallery.children).forEach(c => c.style.border = "1px solid var(--glass-border)");
        thumb.style.border = "2px solid var(--primary-color)";
        selectMedia(item);
      };

      gallery.appendChild(thumb);
    });
  } else {
    gallery.style.display = "none";
  }

  document.getElementById("detail-modal-category").textContent = p.category;
  document.getElementById("detail-modal-title").textContent = p.title;
  document.getElementById("detail-modal-desc").innerHTML = p.desc || "ไม่มีคำอธิบายเพิ่มเติมสำหรับสินค้านี้";
  document.getElementById("detail-modal-price").textContent = `฿${p.price.toLocaleString()}`;
  document.getElementById("detail-qty").value = "1";
  
  const badge = document.getElementById("detail-modal-stock");
  const buyBtn = document.getElementById("detail-modal-buy-btn");
  
  // Custom Badge logic:
  const badgeType = p.customBadge || "auto";
  if (badgeType === "hot") {
    badge.textContent = "HOT";
    badge.style.background = "linear-gradient(135deg, #ff0844 0%, #ffb199 100%)";
    badge.style.color = "white";
  } else if (badgeType === "bestseller") {
    badge.textContent = "ขายดี";
    badge.style.background = "linear-gradient(135deg, #f6d365 0%, #fda085 100%)";
    badge.style.color = "#111";
  } else if (badgeType === "new") {
    badge.textContent = "ใหม่";
    badge.style.background = "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)";
    badge.style.color = "white";
  } else if (badgeType === "out") {
    badge.textContent = "สินค้าหมด";
    badge.style.background = "#ef4444";
    badge.style.color = "white";
  } else {
    // auto / stock-based
    if (p.stock > 0) {
      badge.textContent = `มีสินค้าคงเหลือ: ${p.stock} ชิ้น`;
      badge.style.background = "var(--primary-color)";
      badge.style.color = "white";
    } else {
      badge.textContent = "สินค้าหมด";
      badge.style.background = "#ef4444";
      badge.style.color = "white";
    }
  }

  if (p.stock > 0) {
    buyBtn.disabled = false;
    buyBtn.style.opacity = "1";
  } else {
    buyBtn.disabled = true;
    buyBtn.style.opacity = "0.5";
  }

  document.getElementById("product-detail-modal").classList.add("active");
}

function closeProductDetailModal() {
  const modal = document.getElementById("product-detail-modal");
  if (modal) modal.classList.remove("active");
  // Stop any playing video
  const video = document.getElementById("detail-modal-video");
  if (video) { video.pause(); video.src = ""; }
  const iframe = document.getElementById("detail-modal-iframe");
  if (iframe) { iframe.src = ""; }
}

function viewMoreMedia() {
  if (!selectedProduct) return;
  const media = [];
  if (selectedProduct.gallery) {
    selectedProduct.gallery.split("\n").map(l => l.trim()).filter(Boolean).forEach(url => media.push(url));
  }
  if (media.length === 0 && selectedProduct.image) {
    media.push(selectedProduct.image);
  }
  if (media.length) {
    window.open(media[0], "_blank");
  } else {
    alert("ไม่มีสื่อเพิ่มเติมสำหรับสินค้านี้");
  }
}


function buyProductDirectly() {
  if (!selectedProduct) return;

  if (!currentUser) {
    showNotification("กรุณาเข้าสู่ระบบก่อนทำการซื้อสินค้า", "error");
    closeProductDetailModal();
    showView("auth");
    return;
  }

  const qty = parseInt(document.getElementById("detail-qty").value);
  if (isNaN(qty) || qty <= 0) {
    showNotification("จำนวนสินค้าไม่ถูกต้อง", "error");
    return;
  }

  const p = db.products.find(prod => prod.id === selectedProduct.id);
  if (!p || p.stock < qty) {
    showNotification(`สินค้าเหลือไม่เพียงพอในคลัง (เหลือ ${p ? p.stock : 0} ชิ้น)`, "error");
    return;
  }

  if (!confirm(`คุณแน่ใจว่าต้องการสั่งซื้อ "${p.title}" จำนวน ${qty} ชิ้น เป็นเงิน ฿${(p.price * qty).toLocaleString()} หรือไม่?`)) {
    return;
  }

  p.stock -= qty;

  const orderId = "ORD-" + Math.floor(1000 + Math.random() * 9000);
  const now = new Date();
  const dateStr = now.getFullYear() + "-" + 
                  String(now.getMonth() + 1).padStart(2, '0') + "-" + 
                  String(now.getDate()).padStart(2, '0') + " " + 
                  String(now.getHours()).padStart(2, '0') + ":" + 
                  String(now.getMinutes()).padStart(2, '0');

  const newOrder = {
    id: orderId,
    username: currentUser.username,
    itemNames: `${p.title} x${qty}`,
    total: p.price * qty,
    date: dateStr
  };

  db.orders.push(newOrder);

  db.recentPurchases.unshift({
    username: currentUser.username,
    product: p.title,
    time: "เพิ่งสั่งซื้อ"
  });

  if (db.recentPurchases.length > 20) {
    db.recentPurchases = db.recentPurchases.slice(0, 20);
  }

  saveDatabase();
  closeProductDetailModal();
  renderStoreFront();

  showNotification("สั่งซื้อสินค้าเรียบร้อยแล้ว!", "success");
  triggerDiscordWebhook("purchase", newOrder);
}

// ================= SHOPPING CART SYSTEM =================
function toggleCartDrawer() {
  const el = document.getElementById("cart-drawer");
  if (el) el.classList.toggle("active");
}

function addToCart(prodId, qty = 1) {
  const p = db.products.find(prod => prod.id === prodId);
  if (!p) return;

  if (p.stock <= 0) {
    showNotification("สินค้านี้หมดคลังเรียบร้อยแล้ว", "error");
    return;
  }

  const existIndex = cart.findIndex(item => item.id === prodId);
  if (existIndex > -1) {
    const newQty = cart[existIndex].quantity + qty;
    if (p.stock < newQty) {
      showNotification(`ไม่สามารถเพิ่มจำนวนนี้ได้ (มีจำกัดในสต็อก ${p.stock} ชิ้น)`, "error");
      return;
    }
    cart[existIndex].quantity = newQty;
  } else {
    cart.push({ id: prodId, product: p, quantity: qty });
  }

  showNotification(`เพิ่ม ${p.title} เข้าตะกร้าแล้ว`, "success");
  updateCartBadge();
  renderCartDrawer();
}

function updateCartQty(prodId, delta) {
  const idx = cart.findIndex(item => item.id === prodId);
  if (idx === -1) return;

  const item = cart[idx];
  const newQty = item.quantity + delta;

  if (newQty <= 0) {
    cart.splice(idx, 1);
  } else {
    // Check Stock
    if (item.product.stock < newQty) {
      showNotification(`สินค้าในสต็อกมีไม่เพียงพอ`, "error");
      return;
    }
    item.quantity = newQty;
  }
  updateCartBadge();
  renderCartDrawer();
}

function removeFromCart(prodId) {
  cart = cart.filter(item => item.id !== prodId);
  updateCartBadge();
  renderCartDrawer();
}

function updateCartBadge() {
  const el = document.getElementById("cart-badge");
  if (el) {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    el.textContent = count;
  }
}

function renderCartDrawer() {
  const container = document.getElementById("cart-items-container");
  if (!container) return;

  container.innerHTML = "";

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty-state">
        <i class="fa-solid fa-shopping-basket" style="font-size: 2.5rem; margin-bottom:10px;"></i>
        <p>ตะกร้าสินค้าว่างเปล่า</p>
      </div>
    `;
    document.getElementById("cart-total-price").textContent = "฿0.00";
    return;
  }

  let total = 0;
  cart.forEach(item => {
    const itemTotal = item.product.price * item.quantity;
    total += itemTotal;

    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <img src="${item.product.image}" alt="${item.product.title}" class="cart-item-img">
      <div class="cart-item-info">
        <h4 class="cart-item-title">${item.product.title}</h4>
        <div class="cart-item-price">฿${item.product.price.toLocaleString()}</div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="updateCartQty('${item.id}', -1)"><i class="fa-solid fa-minus"></i></button>
          <span style="font-size:0.9rem; font-weight:600; min-width:20px; text-align:center;">${item.quantity}</span>
          <button class="qty-btn" onclick="updateCartQty('${item.id}', 1)"><i class="fa-solid fa-plus"></i></button>
        </div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">
        <i class="fa-solid fa-trash"></i>
      </button>
    `;
    container.appendChild(row);
  });

  document.getElementById("cart-total-price").textContent = `฿${total.toLocaleString()}`;
}

function checkout() {
  if (cart.length === 0) {
    showNotification("ยังไม่มีสินค้าในตะกร้า", "error");
    return;
  }

  if (!currentUser) {
    showNotification("กรุณาเข้าสู่ระบบก่อนทำการซื้อสินค้า", "error");
    showView("auth");
    toggleCartDrawer();
    return;
  }

  // Double check stocks
  for (let item of cart) {
    const p = db.products.find(prod => prod.id === item.id);
    if (!p || p.stock < item.quantity) {
      showNotification(`สินค้า ${item.product.title} สินค้ามีสต็อกไม่เพียงพอ กรุณาลดจำนวน`, "error");
      return;
    }
  }

  // Deduct Stocks & Create Order logs
  let itemsStrList = [];
  let checkoutTotal = 0;
  
  cart.forEach(item => {
    const p = db.products.find(prod => prod.id === item.id);
    p.stock -= item.quantity;
    itemsStrList.push(`${p.title} x${item.quantity}`);
    checkoutTotal += p.price * item.quantity;
  });

  const orderId = "ORD-" + Math.floor(1000 + Math.random() * 9000);
  const now = new Date();
  const dateStr = now.getFullYear() + "-" + 
                  String(now.getMonth() + 1).padStart(2, '0') + "-" + 
                  String(now.getDate()).padStart(2, '0') + " " + 
                  String(now.getHours()).padStart(2, '0') + ":" + 
                  String(now.getMinutes()).padStart(2, '0');

  const newOrder = {
    id: orderId,
    username: currentUser.username,
    itemNames: itemsStrList.join(", "),
    total: checkoutTotal,
    date: dateStr
  };

  db.orders.push(newOrder);

  // Add to recent purchases list (at index 0)
  cart.forEach(item => {
    db.recentPurchases.unshift({
      username: currentUser.username,
      product: item.product.title,
      time: "เพิ่งสั่งซื้อ"
    });
  });

  // Keep recentPurchases size under control (e.g. max 10)
  if (db.recentPurchases.length > 10) {
    db.recentPurchases = db.recentPurchases.slice(0, 10);
  }

  saveDatabase();

  showNotification("สั่งซื้อสินค้าสำเร็จแล้ว! ขอบคุณที่อุดหนุน", "success");
  
  // Trigger Discord Webhook Notification
  triggerDiscordWebhook("purchase", newOrder);

  // Reset cart
  cart = [];
  updateCartBadge();
  renderCartDrawer();
  toggleCartDrawer();
  renderStoreFront();
}

// Initial render of admin panel lists
function renderAllAdminLists() {
  renderAdminProductsList();
  renderAdminCategoriesList();
  renderAdminOrdersList();
  renderAdminUsersList();
}

function switchAdminTab(tabName, menuItem) {
  // Toggle Active menu
  document.querySelectorAll(".admin-sidebar .admin-menu-item").forEach(item => item.classList.remove("active"));
  if (menuItem) {
    menuItem.classList.add("active");
  } else {
    // Attempt to match side item automatically
    const sideItem = Array.from(document.querySelectorAll(".admin-sidebar .admin-menu-item")).find(item => {
      const onclickAttr = item.getAttribute("onclick");
      return onclickAttr && onclickAttr.includes(`'${tabName}'`);
    });
    if (sideItem) sideItem.classList.add("active");
  }

  // Toggle active views
  document.querySelectorAll(".admin-section").forEach(sec => sec.classList.remove("active"));
  const section = document.getElementById(`admin-tab-${tabName}`);
  if (section) section.classList.add("active");

  // Re-render list when switching to relevant tabs
  if (tabName === "order-users") {
    renderAdminOrdersList();
    renderAdminUsersList();
  } else if (tabName === "product-settings") {
    renderAdminProductsList();
  }
}

// Admin form populate
function setupAdminForms() {
  const s = db.settings;
  
  // General settings
  document.getElementById("cfg-site-name").value = s.siteName || "";
  document.getElementById("cfg-site-logo").value = s.logoUrl || "";
  document.getElementById("cfg-site-desc").value = s.siteDesc || "";
  document.getElementById("cfg-footer-text").value = s.footerText || "";
  document.getElementById("cfg-bg-url").value = s.bgUrl || "";
  document.getElementById("cfg-bg-opacity").value = s.bgOpacity || "0";
  updateBgOpacityLabel(s.bgOpacity || "0");

  // Contact settings
  document.getElementById("cfg-contact-facebook").value = s.contactFacebook || "";
  document.getElementById("cfg-contact-discord").value = s.contactDiscord || "";
  document.getElementById("cfg-contact-line").value = s.contactLine || "";

  // Styles settings
  document.getElementById("cfg-color-primary").value = s.colorPrimary || "#ffffff";
  document.getElementById("cfg-color-primary-hex").value = s.colorPrimary || "#ffffff";
  document.getElementById("cfg-color-bg").value = s.colorBg || "#121212";
  document.getElementById("cfg-color-bg-hex").value = s.colorBg || "#121212";
  document.getElementById("cfg-color-title-logo").value = s.colorTitleLogo || "#ffffff";
  document.getElementById("cfg-color-title-logo-hex").value = s.colorTitleLogo || "#ffffff";
  document.getElementById("cfg-font-family").value = s.fontFamily || "'Kanit', sans-serif";
  document.getElementById("cfg-glass-blur").checked = !!s.glassBlur;
  document.getElementById("cfg-products-col5").checked = !!s.productsCol5;
  document.getElementById("cfg-show-purchases").checked = !!s.showPurchases;
  document.getElementById("cfg-custom-css").value = s.customCss || "";

  // Banner settings
  document.getElementById("cfg-banner-title").value = s.bannerTitle || "";
  document.getElementById("cfg-banner-desc").value = s.bannerDesc || "";
  document.getElementById("cfg-banner-img").value = s.bannerImg || "";
  document.getElementById("cfg-banner-tag").value = s.bannerTag || "";

  // Auth settings
  document.getElementById("cfg-register-enabled").checked = !!s.registerEnabled;
  document.getElementById("cfg-login-title").value = s.loginTitle || "";
  document.getElementById("cfg-login-logo").value = s.loginLogo || "";
  document.getElementById("cfg-login-desc").value = s.loginDesc || "";
  document.getElementById("cfg-register-title").value = s.registerTitle || "";
  document.getElementById("cfg-register-logo").value = s.registerLogo || "";
  document.getElementById("cfg-register-desc").value = s.registerDesc || "";
  
  document.getElementById("cfg-auth-bg").value = s.authBg || "#ffffff";
  document.getElementById("cfg-auth-bg-hex").value = s.authBg || "#ffffff";
  document.getElementById("cfg-auth-title-color").value = s.authTitleColor || "#111827";
  document.getElementById("cfg-auth-title-color-hex").value = s.authTitleColor || "#111827";
  document.getElementById("cfg-auth-desc-color").value = s.authDescColor || "#4b5563";
  document.getElementById("cfg-auth-desc-color-hex").value = s.authDescColor || "#4b5563";
  document.getElementById("cfg-auth-text-color").value = s.authTextColor || "#111827";
  document.getElementById("cfg-auth-text-color-hex").value = s.authTextColor || "#111827";
  document.getElementById("cfg-auth-border-color").value = s.authBorderColor || "#F3F4F6";
  document.getElementById("cfg-auth-border-color-hex").value = s.authBorderColor || "#F3F4F6";

  // SEO & Webhook settings
  document.getElementById("cfg-seo-title").value = s.seoTitle || "";
  document.getElementById("cfg-seo-desc").value = s.seoDesc || "";
  document.getElementById("cfg-seo-favicon").value = s.seoFavicon || "";
  document.getElementById("cfg-webhook-logo").value = s.webhookLogo || "";
  document.getElementById("cfg-webhook-register-url").value = s.webhookRegisterUrl || "";
  document.getElementById("cfg-webhook-register-msg").value = s.webhookRegisterMsg || "";
  document.getElementById("cfg-webhook-register-enabled").checked = !!s.webhookRegisterEnabled;
  document.getElementById("cfg-webhook-purchase-url").value = s.webhookPurchaseUrl || "";
  document.getElementById("cfg-webhook-purchase-msg").value = s.webhookPurchaseMsg || "";
  document.getElementById("cfg-webhook-purchase-enabled").checked = !!s.webhookPurchaseEnabled;

  // Top Announcement settings
  document.getElementById("cfg-top-ann-enabled").checked = !!s.topAnnEnabled;
  document.getElementById("cfg-top-ann-text").value = s.topAnnText || "";
  document.getElementById("cfg-top-ann-bg").value = s.topAnnBg || "#ffffff";
  document.getElementById("cfg-top-ann-bg-hex").value = s.topAnnBg || "#ffffff";
  document.getElementById("cfg-top-ann-color").value = s.topAnnColor || "#ffffff";
  document.getElementById("cfg-top-ann-color-hex").value = s.topAnnColor || "#ffffff";
  
  const topAnnModes = document.getElementsByName("cfg-top-ann-mode");
  topAnnModes.forEach(r => {
    r.checked = r.value === (s.topAnnMode || "static");
  });
  
  updateTopAnnBadge(!!s.topAnnEnabled);
  updateTopAnnLength(s.topAnnText || "");

  // Real-time Hex sync for top announcement pickers
  document.getElementById("cfg-top-ann-bg").addEventListener("input", (e) => {
    document.getElementById("cfg-top-ann-bg-hex").value = e.target.value;
  });
  document.getElementById("cfg-top-ann-color").addEventListener("input", (e) => {
    document.getElementById("cfg-top-ann-color-hex").value = e.target.value;
  });
  // Real-time Hex sync for storefront announcement pickers
  document.getElementById("cfg-ann-bg").addEventListener("input", (e) => {
    document.getElementById("cfg-ann-bg-hex").value = e.target.value;
  });
  document.getElementById("cfg-ann-border").addEventListener("input", (e) => {
    document.getElementById("cfg-ann-border-hex").value = e.target.value;
  });
  document.getElementById("cfg-ann-text-color").addEventListener("input", (e) => {
    document.getElementById("cfg-ann-text-color-hex").value = e.target.value;
  });

  // Storefront announcements list
  renderAdminAnnouncementsList();

  // Popup settings
  document.getElementById("cfg-popup-title").value = s.popupTitle || "";
  document.getElementById("cfg-popup-img").value = s.popupImg || "";
  document.getElementById("cfg-popup-link").value = s.popupLink || "";
  document.getElementById("cfg-popup-enabled").checked = !!s.popupEnabled;
}

// SAVE ACTIONS
function saveGeneralSettings() {
  db.settings.siteName = document.getElementById("cfg-site-name").value.trim();
  db.settings.logoUrl = document.getElementById("cfg-site-logo").value.trim();
  db.settings.siteDesc = document.getElementById("cfg-site-desc").value.trim();
  db.settings.footerText = document.getElementById("cfg-footer-text").value.trim();
  db.settings.bgUrl = document.getElementById("cfg-bg-url").value.trim();
  db.settings.bgOpacity = document.getElementById("cfg-bg-opacity").value;
  db.settings.seoTitle = document.getElementById("cfg-seo-title").value.trim();
  db.settings.seoDesc = document.getElementById("cfg-seo-desc").value.trim();
  db.settings.seoFavicon = document.getElementById("cfg-seo-favicon").value.trim();
  db.settings.webhookLogo = document.getElementById("cfg-webhook-logo").value.trim();
  db.settings.webhookRegisterUrl = document.getElementById("cfg-webhook-register-url").value.trim();
  db.settings.webhookRegisterMsg = document.getElementById("cfg-webhook-register-msg").value.trim();
  db.settings.webhookRegisterEnabled = document.getElementById("cfg-webhook-register-enabled").checked;
  db.settings.webhookPurchaseUrl = document.getElementById("cfg-webhook-purchase-url").value.trim();
  db.settings.webhookPurchaseMsg = document.getElementById("cfg-webhook-purchase-msg").value.trim();
  db.settings.webhookPurchaseEnabled = document.getElementById("cfg-webhook-purchase-enabled").checked;

  // Save contacts
  db.settings.contactFacebook = document.getElementById("cfg-contact-facebook").value.trim();
  db.settings.contactDiscord = document.getElementById("cfg-contact-discord").value.trim();
  db.settings.contactLine = document.getElementById("cfg-contact-line").value.trim();

  saveDatabase();
  applySettings();
  showNotification("บันทึกการตั้งค่าเว็บเรียบร้อยแล้ว", "success");
}

function saveStyleSettings() {
  db.settings.colorPrimary = document.getElementById("cfg-color-primary").value;
  db.settings.colorBg = document.getElementById("cfg-color-bg").value;
  db.settings.colorTitleLogo = document.getElementById("cfg-color-title-logo").value;
  db.settings.fontFamily = document.getElementById("cfg-font-family").value;
  db.settings.glassBlur = document.getElementById("cfg-glass-blur").checked;
  db.settings.productsCol5 = document.getElementById("cfg-products-col5").checked;
  db.settings.showPurchases = document.getElementById("cfg-show-purchases").checked;
  db.settings.customCss = document.getElementById("cfg-custom-css").value;

  // Sync textbox values
  document.getElementById("cfg-color-primary-hex").value = db.settings.colorPrimary;
  document.getElementById("cfg-color-bg-hex").value = db.settings.colorBg;
  document.getElementById("cfg-color-title-logo-hex").value = db.settings.colorTitleLogo;

  saveDatabase();
  applySettings();
  renderStoreFront();
  showNotification("บันทึกการตั้งค่าสไตล์เรียบร้อยแล้ว", "success");
}

function saveBannerSettings() {
  db.settings.bannerTitle = document.getElementById("cfg-banner-title").value.trim();
  db.settings.bannerDesc = document.getElementById("cfg-banner-desc").value.trim();
  db.settings.bannerImg = document.getElementById("cfg-banner-img").value.trim();
  db.settings.bannerTag = document.getElementById("cfg-banner-tag").value.trim();

  saveDatabase();
  applySettings();
  showNotification("บันทึกการตั้งค่าแบนเนอร์เรียบร้อยแล้ว", "success");
}

function saveAuthSettings() {
  db.settings.registerEnabled = document.getElementById("cfg-register-enabled").checked;
  db.settings.loginTitle = document.getElementById("cfg-login-title").value.trim();
  db.settings.loginLogo = document.getElementById("cfg-login-logo").value.trim();
  db.settings.loginDesc = document.getElementById("cfg-login-desc").value.trim();
  db.settings.registerTitle = document.getElementById("cfg-register-title").value.trim();
  db.settings.registerLogo = document.getElementById("cfg-register-logo").value.trim();
  db.settings.registerDesc = document.getElementById("cfg-register-desc").value.trim();
  
  db.settings.authBg = document.getElementById("cfg-auth-bg").value;
  db.settings.authTitleColor = document.getElementById("cfg-auth-title-color").value;
  db.settings.authDescColor = document.getElementById("cfg-auth-desc-color").value;
  db.settings.authTextColor = document.getElementById("cfg-auth-text-color").value;
  db.settings.authBorderColor = document.getElementById("cfg-auth-border-color").value;

  // Sync textbox values
  document.getElementById("cfg-auth-bg-hex").value = db.settings.authBg;
  document.getElementById("cfg-auth-title-color-hex").value = db.settings.authTitleColor;
  document.getElementById("cfg-auth-desc-color-hex").value = db.settings.authDescColor;
  document.getElementById("cfg-auth-text-color-hex").value = db.settings.authTextColor;
  document.getElementById("cfg-auth-border-color-hex").value = db.settings.authBorderColor;

  saveDatabase();
  applySettings();
  showNotification("บันทึกการตั้งค่าระบบล็อกอินแล้ว", "success");
}

// ================= ADMIN PRODUCT MANAGEMENT CRUD =================
function renderAdminProductsList() {
  const tbody = document.getElementById("admin-products-table-body");
  if (!tbody) return;
  
  tbody.innerHTML = "";

  if (db.products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">ยังไม่มีรายการสินค้าในขณะนี้</td></tr>`;
    return;
  }

  db.products.forEach(p => {
    const productImgSrc = p.image || PLACEHOLDER_IMG;
    tbody.innerHTML += `
      <tr>
        <td><img src="${productImgSrc}" alt="${p.title}" class="table-img"></td>
        <td><strong>${p.title}</strong></td>
        <td><span class="ticker-item" style="margin:0;">${p.category}</span></td>
        <td>฿${p.price.toLocaleString()}</td>
        <td>${p.stock}</td>
        <td>
          <div class="action-btns">
            <button class="btn-icon" onclick="openProductModal('edit', '${p.id}')"><i class="fa-solid fa-edit"></i></button>
            <button class="btn-icon delete" onclick="deleteProduct('${p.id}')"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `;
  });
}

function openProductModal(mode, prodId = '') {
  // Clear form
  document.getElementById("prod-id").value = "";
  document.getElementById("prod-title").value = "";
  document.getElementById("prod-category").value = "";
  document.getElementById("prod-price").value = "";
  document.getElementById("prod-stock").value = "999";
  document.getElementById("prod-badge").value = "auto";
  document.getElementById("prod-gallery").value = "";
  document.getElementById("prod-image").value = "";
  document.getElementById("prod-desc").value = "";
  document.getElementById("prod-img-file").value = "";

  const formTitle = document.getElementById("admin-product-modal-title");

  if (mode === "add") {
    if (formTitle) formTitle.textContent = "เพิ่มสินค้าใหม่";
  } else if (mode === "edit") {
    if (formTitle) formTitle.textContent = "แก้ไขข้อมูลสินค้า";
    const p = db.products.find(prod => prod.id === prodId);
    if (p) {
      document.getElementById("prod-id").value = p.id;
      document.getElementById("prod-title").value = p.title;
      document.getElementById("prod-category").value = p.category;
      document.getElementById("prod-price").value = p.price;
      document.getElementById("prod-stock").value = p.stock;
      document.getElementById("prod-badge").value = p.customBadge || "auto";
      document.getElementById("prod-gallery").value = p.gallery || "";
      document.getElementById("prod-image").value = p.image;
      document.getElementById("prod-desc").value = p.desc || "";
    }
  }

  // Switch to the dedicated product form admin-section tab
  switchAdminTab("product-form");
  
  // Render suggestion pills and sync layout preview
  renderCategorySuggestions();
  syncProductPreview();
}

function closeAdminProductModal() {
  // Switch back to main product settings listing
  switchAdminTab("product-settings");
}

function handleProductFormSubmit(e) {
  e.preventDefault();
  
  const id = document.getElementById("prod-id").value;
  const title = document.getElementById("prod-title").value.trim();
  const category = document.getElementById("prod-category").value.trim();
  const price = parseFloat(document.getElementById("prod-price").value);
  const stock = parseInt(document.getElementById("prod-stock").value);
  const customBadge = document.getElementById("prod-badge").value;
  const gallery = document.getElementById("prod-gallery").value.trim();
  const image = document.getElementById("prod-image").value.trim();
  const desc = document.getElementById("prod-desc").value.trim();

  // Update badge based on role or stock as before
  const badge = document.getElementById("detail-modal-stock");
  const buyBtn = document.getElementById("detail-modal-buy-btn");
  if (badge) {
    const badgeType = document.getElementById("prod-badge").value;
    if (badgeType === "none") {
      badge.style.display = "none";
    } else {
      badge.style.display = "block";
      badge.style.color = "white";
      if (badgeType === "hot") {
        badge.textContent = "HOT";
        badge.style.background = "linear-gradient(135deg, #ff0844 0%, #ffb199 100%)";
      } else if (badgeType === "bestseller") {
        badge.textContent = "ขายดี";
        badge.style.background = "linear-gradient(135deg, #f6d365 0%, #fda085 100%)";
      } else if (badgeType === "new") {
        badge.textContent = "ใหม่";
        badge.style.background = "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)";
      } else if (badgeType === "out") {
        badge.textContent = "สินค้าหมด";
        badge.style.background = "#ef4444";
      } else {
        // auto based on stock
        if (stock > 0) {
          badge.textContent = `มีสินค้าคงเหลือ: ${stock} ชิ้น`;
          badge.style.background = "var(--primary-color)";
        } else {
          badge.textContent = "สินค้าหมด";
          badge.style.background = "#ef4444";
        }
      }
    }
  }

  // Safely handle buyBtn (may be removed)
  if (buyBtn) {
    if (stock > 0) {
      buyBtn.disabled = false;
      buyBtn.style.opacity = "1";
    } else {
      buyBtn.disabled = true;
      buyBtn.style.opacity = "0.5";
    }
  }

  if (id) {
    // Edit Mode
    const idx = db.products.findIndex(prod => prod.id === id);
    if (idx > -1) {
      db.products[idx] = { id, title, category, price, stock, customBadge, gallery, image, desc };
      showNotification("แก้ไขสินค้าเรียบร้อยแล้ว", "success");
    }
  } else {
    // Add Mode
    const newId = "prod-" + Date.now();
    const newProd = { id: newId, title, category, price, stock, customBadge, gallery, image, desc };
    db.products.push(newProd);
    showNotification("เพิ่มสินค้าใหม่สำเร็จ", "success");
  }

  saveDatabase();
  closeAdminProductModal();
  renderAdminProductsList();
  renderAdminCategoriesList(); // Sync bulk category manager table
  renderStoreFront();
}

function submitProductFormDirectly() {
  document.getElementById("submit-hidden-btn").click();
}

// Live synchronizer for the Preview Card
function syncProductPreview() {
  const title = document.getElementById("prod-title").value.trim() || "ชื่อสินค้า";
  const category = document.getElementById("prod-category").value.trim() || "หมวดหมู่";
  const price = parseFloat(document.getElementById("prod-price").value) || 0;
  const stock = parseInt(document.getElementById("prod-stock").value) || 0;
  const image = document.getElementById("prod-image").value.trim() || PLACEHOLDER_IMG;
  const desc = document.getElementById("prod-desc").value.trim() || "รายละเอียดสินค้า...";

  document.getElementById("preview-card-title").textContent = title;
  document.getElementById("preview-card-category").textContent = category;
  document.getElementById("preview-card-price").textContent = `฿${price.toLocaleString()}`;
  document.getElementById("preview-card-img").src = image;

  const badge = document.getElementById("preview-card-badge");
  if (badge) {
    const badgeType = document.getElementById("prod-badge").value;
    if (badgeType === "none") {
      badge.style.display = "none";
    } else {
      badge.style.display = "block";
      badge.style.color = "white";
      if (badgeType === "hot") {
        badge.textContent = "HOT";
        badge.style.background = "linear-gradient(135deg, #ff0844 0%, #ffb199 100%)";
        badge.style.color = "white";
      } else if (badgeType === "bestseller") {
        badge.textContent = "ขายดี";
        badge.style.background = "linear-gradient(135deg, #f6d365 0%, #fda085 100%)";
        badge.style.color = "#111";
      } else if (badgeType === "new") {
        badge.textContent = "ใหม่";
        badge.style.background = "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)";
        badge.style.color = "white";
      } else if (badgeType === "out") {
        badge.textContent = "หมด";
        badge.style.background = "#ef4444";
        badge.style.color = "white";
      } else {
        // auto
        if (stock > 0) {
          badge.textContent = "มีสินค้า";
          badge.style.background = "var(--primary-color)";
          badge.style.color = "white";
        } else {
          badge.textContent = "หมด";
          badge.style.background = "var(--danger)";
          badge.style.color = "white";
        }
      }
    }
  }

  // Render description HTML dynamically on preview card
  document.getElementById("preview-card-desc").innerHTML = desc;
}

// File Upload helper
function triggerProductImgUpload() {
  document.getElementById("prod-img-file").click();
}

function handleProductImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById("prod-image").value = e.target.result;
    syncProductPreview();
    showNotification("อัปโหลดรูปภาพสำเร็จ!", "success");
  };
  reader.readAsDataURL(file);
}

// Category suggestion pills rendering
function renderCategorySuggestions() {
  const container = document.getElementById("category-pills-list");
  if (!container) return;

  container.innerHTML = "";
  const categoriesSet = new Set([...(db.categories || []), ...db.products.map(p => p.category)].filter(Boolean));

  if (categoriesSet.size === 0) {
    container.innerHTML = `<span style="font-size:0.75rem; color:var(--text-muted);">ยังไม่มีหมวดหมู่แนะนำ (กรอกเพื่อเริ่มระบบ)</span>`;
    return;
  }

  categoriesSet.forEach(cat => {
    const pill = document.createElement("span");
    pill.className = "category-pill";
    pill.textContent = cat;
    pill.onclick = () => {
      document.getElementById("prod-category").value = cat;
      syncProductPreview();
    };
    container.appendChild(pill);
  });
}

// Bulk Category Manager table builder
function renderAdminCategoriesList() {
  const tbody = document.getElementById("admin-categories-table-body");
  if (!tbody) return;

  tbody.innerHTML = "";
  const categoriesSet = new Set([...(db.categories || []), ...db.products.map(p => p.category)].filter(Boolean));

  if (categoriesSet.size === 0) {
    tbody.innerHTML = `<tr><td colspan="2" style="text-align:center; font-size:0.8rem; color:var(--text-muted); padding:10px 0;">ไม่มีหมวดหมู่ในระบบ</td></tr>`;
    return;
  }

  categoriesSet.forEach(cat => {
    tbody.innerHTML += `
      <tr>
        <td style="padding:8px 0;"><strong>${cat}</strong></td>
        <td style="text-align:right; padding:8px 0;">
          <div style="display:flex; justify-content:flex-end; gap:5px;">
            <button class="action-btn edit-btn" onclick="renameCategoryPrompt('${cat}')" style="background:var(--primary-color); border:none; padding:4px 8px; border-radius:4px; color:white; cursor:pointer;" title="แก้ไขชื่อ"><i class="fa-solid fa-edit"></i></button>
            <button class="action-btn delete-btn" onclick="deleteCategoryPrompt('${cat}')" style="background:var(--danger); border:none; padding:4px 8px; border-radius:4px; color:white; cursor:pointer;" title="ลบหมวดหมู่"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `;
  });
}

function adminAddCategory() {
  const input = document.getElementById("admin-new-category-input");
  if (!input) return;
  const catName = input.value.trim();
  if (catName === "") {
    showNotification("กรุณากรอกชื่อหมวดหมู่", "error");
    return;
  }

  const categoriesSet = new Set([...(db.categories || []), ...db.products.map(p => p.category)].filter(Boolean));
  if (categoriesSet.has(catName)) {
    showNotification("มีหมวดหมู่นี้ในระบบแล้ว", "error");
    return;
  }

  if (!db.categories) db.categories = [];
  db.categories.push(catName);
  saveDatabase();
  input.value = "";

  renderAdminCategoriesList();
  renderCategorySuggestions();
  showNotification(`เพิ่มหมวดหมู่ "${catName}" สำเร็จ`, "success");
}

function renameCategoryPrompt(oldName) {
  const newName = prompt(`กรุณากรอกชื่อหมวดหมู่ใหม่สำหรับสินค้าที่เป็น "${oldName}":`, oldName);
  if (newName && newName.trim() && newName.trim() !== oldName) {
    const cleanedNewName = newName.trim();
    
    // Update db.categories
    if (db.categories) {
      db.categories = db.categories.map(c => c === oldName ? cleanedNewName : c);
    }
    
    // Update db.products
    db.products.forEach(p => {
      if (p.category === oldName) {
        p.category = cleanedNewName;
      }
    });
    
    saveDatabase();
    renderAdminProductsList();
    renderAdminCategoriesList();
    renderCategorySuggestions();
    renderStoreFront();
    showNotification(`เปลี่ยนชื่อหมวดหมู่เป็น "${cleanedNewName}" เรียบร้อยแล้ว`, "success");
  }
}

function deleteCategoryPrompt(catName) {
  if (confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่ "${catName}"?\n* สินค้าในหมวดหมู่นี้ทั้งหมดจะไม่ถูกลบ แต่จะถูกตั้งให้ไม่มีหมวดหมู่`)) {
    // Delete from db.categories
    if (db.categories) {
      db.categories = db.categories.filter(c => c !== catName);
    }
    
    // Update db.products
    db.products.forEach(p => {
      if (p.category === catName) {
        p.category = "";
      }
    });
    
    saveDatabase();
    renderAdminProductsList();
    renderAdminCategoriesList();
    renderCategorySuggestions();
    renderStoreFront();
    showNotification(`ลบหมวดหมู่เรียบร้อยแล้ว`, "info");
  }
}

function deleteProduct(prodId) {
  if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบสินค้านี้?")) {
    db.products = db.products.filter(p => p.id !== prodId);
    saveDatabase();
    renderAdminProductsList();
    renderStoreFront();
    showNotification("ลบสินค้าเรียบร้อยแล้ว", "info");
  }
}

// ================= ADMIN ORDERS & MEMBERS LISTS =================
function renderAdminOrdersList() {
  const tbody = document.getElementById("admin-orders-table-body");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (db.orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">ยังไม่มีรายการสั่งซื้อสินค้า</td></tr>`;
    return;
  }

  const sortedOrders = [...db.orders].reverse();
  sortedOrders.forEach(o => {
    tbody.innerHTML += `
      <tr>
        <td><strong>${o.id}</strong></td>
        <td>${o.username}</td>
        <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${o.itemNames}</td>
        <td>฿${o.total.toLocaleString()}</td>
        <td>${o.date}</td>
        <td>
          <button class="btn-icon delete" onclick="deleteOrder('${o.id}')"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>
    `;
  });
}

function deleteOrder(id) {
  if (confirm(`คุณต้องการลบเลขออเดอร์ ${id} ออกจากระบบประวัติหรือไม่?`)) {
    db.orders = db.orders.filter(o => o.id !== id);
    saveDatabase();
    renderAdminOrdersList();

    showNotification("ลบออเดอร์เรียบร้อยแล้ว", "info");
  }
}

function renderAdminUsersList() {
  const tbody = document.getElementById("admin-users-table-body");
  if (!tbody) return;

  tbody.innerHTML = "";
  const members = db.users;
  if (members.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">ยังไม่มีสมาชิกในระบบ</td></tr>`;
    return;
  }
  members.forEach(u => {
    const statusIcon = u.status === "suspended" ? "🔴" : "🟢";
    const statusText = u.status === "suspended" ? "ระงับ" : "ปกติ";
    const editBtn = `<button class="btn-icon" onclick="openAdminEditUserModal('${u.username}')" title="จัดการบัญชีสมาชิก" style="background: rgba(255,255,255,0.05); border-radius: 4px; padding: 6px 12px; border: 1px solid var(--glass-border); color: var(--text-color); cursor: pointer; transition: background 0.2s; display: flex; align-items: center; gap: 6px;"><i class="fa-solid fa-gear" style="color: var(--primary-color)"></i> จัดการ</button>`;
    const deleteBtn = `<button class="btn-icon delete" onclick="deleteUser('${u.username}')" title="ลบผู้ใช้งาน" style="background: rgba(239, 68, 68, 0.1); border-radius: 4px; padding: 6px 12px; border: 1px solid rgba(239, 68, 68, 0.2); color: #ef4444; cursor: pointer;"><i class="fa-solid fa-user-minus"></i></button>`;
    
    tbody.innerHTML += `
      <tr>
        <td><strong>${u.username}</strong></td>
        <td>${statusIcon} ${statusText}</td>
        <td>${u.role || "member"}</td>
        <td>
          <div style="display: flex; gap: 8px; align-items: center;">
            ${editBtn}
            ${deleteBtn}
          </div>
        </td>
      </tr>
    `;
  });
}

function openAdminEditUserModal(username) {
  const u = db.users.find(usr => usr.username === username);
  if (!u) return;

  document.getElementById("edit-user-username-hidden").value = u.username;
  document.getElementById("edit-user-username-display").value = u.username;
  document.getElementById("edit-user-password").value = "";
  document.getElementById("edit-user-role").value = u.role || "member";
  document.getElementById("edit-user-status").value = u.status || "active";
  document.getElementById("edit-user-note").value = u.note || "";

  document.getElementById("admin-edit-user-modal").classList.add("active");
}

function closeAdminEditUserModal() {
  document.getElementById("admin-edit-user-modal").classList.remove("active");
}

function saveAdminEditUser() {
  const username = document.getElementById("edit-user-username-hidden").value;
  const newPass = document.getElementById("edit-user-password").value.trim();
  const newRole = document.getElementById("edit-user-role").value;
  const newStatus = document.getElementById("edit-user-status").value;
  const newNote = document.getElementById("edit-user-note").value.trim();

  const u = db.users.find(usr => usr.username === username);
  if (!u) return;

  if (newPass !== "") {
    u.password = newPass;
  }

  // Warn if self-demoting from admin
  if (username === currentUser.username && newRole !== "admin") {
    if (!confirm("คุณกำลังเปลี่ยนสิทธิ์ของตนเองเป็น member ซึ่งจะทำให้สูญเสียการเข้าถึงหน้าผู้ดูแลระบบ (Admin) ทันที ต้องการบันทึกหรือไม่?")) {
      return;
    }
  }

  u.role = newRole;
  u.status = newStatus;
  u.note = newNote;
  saveDatabase();
  closeAdminEditUserModal();
  renderAdminUsersList();

  // If self-demoted, redirect to storefront
  if (username === currentUser.username && newRole !== "admin") {
    currentUser.role = newRole;
    showView("shop");
    initAuthSession();
  }

  showNotification(`บันทึกข้อมูลผู้ใช้ "${username}" เรียบร้อยแล้ว`, "success");
}

function deleteUser(username) {
  if (confirm(`คุณแน่ใจว่าจะลบบัญชีผู้ใช้ ${username} หรือไม่?`)) {
    db.users = db.users.filter(u => u.username !== username);
    saveDatabase();
    renderAdminUsersList();
    showNotification(`ลบบัญชีสมาชิก ${username} แล้ว`, "info");
  }
}

// ================= DISCORD WEBHOOK CLIENT =================
function triggerDiscordWebhook(eventType, data) {
  let url = "";
  let enabled = false;
  let customMsg = "";

  if (eventType === "register") {
    url = db.settings.webhookRegisterUrl || document.getElementById("cfg-webhook-register-url")?.value.trim() || "";
    enabled = db.settings.webhookRegisterEnabled ?? document.getElementById("cfg-webhook-register-enabled")?.checked ?? true;
    customMsg = db.settings.webhookRegisterMsg || document.getElementById("cfg-webhook-register-msg")?.value.trim() || "";
  } else if (eventType === "purchase") {
    url = db.settings.webhookPurchaseUrl || document.getElementById("cfg-webhook-purchase-url")?.value.trim() || "";
    enabled = db.settings.webhookPurchaseEnabled ?? document.getElementById("cfg-webhook-purchase-enabled")?.checked ?? true;
    customMsg = db.settings.webhookPurchaseMsg || document.getElementById("cfg-webhook-purchase-msg")?.value.trim() || "";
  }

  if (!enabled || !url || !url.startsWith("https://discord.com/api/webhooks/")) return;

  const siteName = db.settings.siteName || "Nexa Store";
  const logo = db.settings.webhookLogo || db.settings.logoUrl || "";

  let payload = {};

  if (eventType === "register") {
    let desc = customMsg || `👋 ยินดีต้อนรับ **${data.username}** สู่ **${siteName}**`;
    desc = desc.replace(/{username}/g, data.username).replace(/{sitename}/g, siteName);

    payload = {
      username: siteName,
      avatar_url: logo,
      embeds: [
        {
          title: "🎉 สมาชิกใหม่!",
          description: desc,
          color: 0x5865F2,
          thumbnail: { url: logo || "https://cdn.discordapp.com/embed/avatars/0.png" },
          fields: [
            { name: "👤 ชื่อผู้ใช้", value: `\`${data.username}\``, inline: true },
            { name: "📋 สิทธิ์", value: "`Member`", inline: true },
            { name: "📅 เวลาสมัคร", value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: false }
          ],
          footer: { text: `${siteName} • ระบบแจ้งเตือนอัตโนมัติ`, icon_url: logo },
          timestamp: new Date().toISOString()
        }
      ]
    };
  } else if (eventType === "purchase") {
    let desc = customMsg || `📦 มีคำสั่งซื้อสินค้าใหม่จาก **${data.username}**`;
    desc = desc.replace(/{username}/g, data.username)
               .replace(/{sitename}/g, siteName)
               .replace(/{items}/g, data.itemNames || "")
               .replace(/{total}/g, data.total?.toLocaleString?.() || data.total || "")
               .replace(/{orderid}/g, data.id || "");

    payload = {
      username: siteName,
      avatar_url: logo,
      embeds: [
        {
          title: "🛒 คำสั่งซื้อใหม่!",
          description: desc,
          color: 0xff477e,
          thumbnail: { url: logo || "https://cdn.discordapp.com/embed/avatars/0.png" },
          fields: [
            { name: "🏷️ เลขออเดอร์", value: `\`${data.id}\``, inline: true },
            { name: "👤 ผู้ซื้อ", value: `\`${data.username}\``, inline: true },
            { name: "📦 สินค้า", value: `${data.itemNames}`, inline: false },
            { name: "💰 ยอดชำระ", value: `**฿${data.total.toLocaleString()} THB**`, inline: true }
          ],
          footer: { text: `${siteName} • ระบบแจ้งเตือนอัตโนมัติ`, icon_url: logo },
          timestamp: new Date().toISOString()
        }
      ]
    };
  }

  sendRequestToDiscord(url, payload);
}

function sendRequestToDiscord(url, payload) {
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  .then(response => {
    if (response.ok) {
      console.log("Discord Webhook triggered successfully!");
    } else {
      console.error("Failed to send Discord Webhook", response.statusText);
    }
  })
  .catch(err => {
    console.error("Error sending webhook request", err);
  });
}

function triggerTestWebhook(type) {
  const urlFieldId = type === "register" ? "cfg-webhook-register-url" : "cfg-webhook-purchase-url";
  const msgFieldId = type === "register" ? "cfg-webhook-register-msg" : "cfg-webhook-purchase-msg";
  const url = document.getElementById(urlFieldId).value.trim();
  const customMsg = document.getElementById(msgFieldId).value.trim();
  if (!url || !url.startsWith("https://discord.com/api/webhooks/")) {
    showNotification("กรุณาระบุ Discord Webhook URL ให้ถูกต้องก่อนทดสอบ!", "error");
    return;
  }
  
  showNotification("กำลังส่งคำขอทดสอบไปยัง Discord...", "info");
  
  const testDesc = customMsg || "✅ การเชื่อมต่อ Webhook สำเร็จ";
  
  const testPayload = {
    username: db.settings.siteName || "Nexa Store",
    avatar_url: db.settings.webhookLogo || db.settings.logoUrl || "https://img1.pic.in.th/images/Futuristic-NX-logo-with-cherry-blossoms.png",
    embeds: [
      {
        title: `🔔 ทดสอบ Webhook (${type === "register" ? "ระบบสมัครสมาชิก" : "ระบบสั่งซื้อสินค้า"})`,
        description: testDesc,
        color: 16730014,
        fields: [
          { name: "สถานะการเชื่อมต่อ", value: "🟢 ออนไลน์ / พร้อมทำงาน", inline: true },
          { name: "การทดสอบโดย", value: `👤 \`${currentUser ? currentUser.username : 'Anonymous Admin'}\``, inline: true }
        ],
        footer: { text: `Nexa Store System • ${new Date().toLocaleString('th-TH')}` }
      }
    ]
  };

  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(testPayload)
  })
  .then(res => {
    if (res.ok) {
      showNotification("ส่งแจ้งเตือนการทดสอบไปยัง Discord สำเร็จ! กรุณาตรวจสอบห้องดิสคอร์ด", "success");
    } else {
      showNotification(`ส่งไม่สำเร็จ: ${res.status} ${res.statusText}`, "error");
    }
  })
  .catch(err => {
    showNotification(`ส่งไม่สำเร็จเกิดข้อผิดพลาด: ${err.message}`, "error");
  });
}

// ================= DATABASE EXPORT / IMPORT =================
function exportDatabase() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `nexa_store_backup_${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showNotification("ดาวน์โหลดไฟล์สำรองข้อมูลเรียบร้อยแล้ว", "success");
}

function importDatabase() {
  const fileInput = document.getElementById("db-import-file");
  if (fileInput.files.length === 0) {
    showNotification("กรุณาเลือกไฟล์ .json ที่ต้องการนำเข้า!", "error");
    return;
  }

  const file = fileInput.files[0];
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importedData = JSON.parse(e.target.result);
      
      // Basic validations
      if (importedData.settings && importedData.products) {
        db = importedData;
        saveDatabase();
        applySettings();
        setupAdminForms();
        renderStoreFront();
    
        
        showNotification("นำเข้าข้อมูลสำรองและกู้คืนระบบสำเร็จเรียบร้อยแล้ว!", "success");
        fileInput.value = ""; // reset input
      } else {
        showNotification("โครงสร้างไฟล์ข้อมูลสำรองไม่ถูกต้อง!", "error");
      }
    } catch (err) {
      showNotification("ไม่สามารถอ่านข้อมูลไฟล์ได้ (ไม่เป็นรูปแบบ JSON หรือไฟล์เสียหาย)", "error");
    }
  };
  reader.readAsText(file);
}

// ================= NOTIFICATION HELPER =================
function showNotification(message, type = 'success') {
  const container = document.getElementById("notification-container");
  if (!container) return;

  const notify = document.createElement("div");
  notify.className = `notification ${type}`;
  
  let icon = '<i class="fa-solid fa-check-circle"></i>';
  if (type === 'error') icon = '<i class="fa-solid fa-exclamation-circle"></i>';
  if (type === 'info') icon = '<i class="fa-solid fa-info-circle"></i>';

  notify.innerHTML = `${icon} <span>${message}</span>`;
  container.appendChild(notify);

  // Remove notification after 3.5s
  setTimeout(() => {
    notify.style.animation = 'slide-in 0.3s reverse forwards';
    setTimeout(() => {
      notify.remove();
    }, 300);
  }, 3500);
}

// ================= ACCORDION & MENU SYSTEM =================
function toggleAdminAccordion(headerEl) {
  const accordion = headerEl.parentElement;
  accordion.classList.toggle("collapsed");
}

function toggleUserDropdown() {
  const userMenu = document.getElementById("user-dropdown-menu");
  const contactMenu = document.getElementById("contact-dropdown-menu");
  if (contactMenu) contactMenu.classList.remove("active");
  if (userMenu) {
    userMenu.classList.toggle("active");
  }
}

function toggleContactDropdown() {
  const userMenu = document.getElementById("user-dropdown-menu");
  const contactMenu = document.getElementById("contact-dropdown-menu");
  if (userMenu) userMenu.classList.remove("active");
  if (contactMenu) {
    contactMenu.classList.toggle("active");
  }
}

// Window click listener to close dropdowns on click outside
window.addEventListener("click", function(event) {
  // User dropdown auto-close
  const userContainer = document.querySelector(".user-dropdown-container:not(.contact-dropdown-container)");
  const userMenu = document.getElementById("user-dropdown-menu");
  if (userMenu && userMenu.classList.contains("active")) {
    if (!userContainer || !userContainer.contains(event.target)) {
      userMenu.classList.remove("active");
    }
  }

  // Contact dropdown auto-close
  const contactContainer = document.querySelector(".contact-dropdown-container");
  const contactMenu = document.getElementById("contact-dropdown-menu");
  if (contactMenu && contactMenu.classList.contains("active")) {
    if (!contactContainer || !contactContainer.contains(event.target)) {
      contactMenu.classList.remove("active");
    }
  }
});

function showUserProfile() {
  if (!currentUser) return;
  document.getElementById("profile-username-val").textContent = currentUser.username;
  document.getElementById("profile-role-val").textContent = currentUser.role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : 'สมาชิก (User)';
  document.getElementById("profile-modal").classList.add("active");
  const menu = document.getElementById("user-dropdown-menu");
  if (menu) menu.classList.remove("active");
}

function closeUserProfile() {
  document.getElementById("profile-modal").classList.remove("active");
}

// ================= TOP ANNOUNCEMENT SETTINGS =================
function updateTopAnnBadge(enabled) {
  const badge = document.getElementById("top-ann-status-badge");
  if (badge) {
    if (enabled) {
      badge.textContent = "เปิด";
      badge.style.background = "rgba(16, 185, 129, 0.2)";
      badge.style.color = "#10b981";
    } else {
      badge.textContent = "ปิด";
      badge.style.background = "rgba(239, 68, 68, 0.2)";
      badge.style.color = "#ef4444";
    }
  }
}

function updateTopAnnLength(text) {
  const lengthEl = document.getElementById("top-ann-length");
  if (lengthEl) {
    lengthEl.textContent = text.length;
  }
}

function saveTopAnnouncementSettings() {
  const s = db.settings;
  s.topAnnEnabled = document.getElementById("cfg-top-ann-enabled").checked;
  s.topAnnText = document.getElementById("cfg-top-ann-text").value;
  s.topAnnBg = document.getElementById("cfg-top-ann-bg").value;
  s.topAnnColor = document.getElementById("cfg-top-ann-color").value;
  
  let selectedMode = "static";
  const topAnnModes = document.getElementsByName("cfg-top-ann-mode");
  topAnnModes.forEach(r => {
    if (r.checked) selectedMode = r.value;
  });
  s.topAnnMode = selectedMode;
  
  saveDatabase();
  applySettings();
  showNotification("บันทึกประกาศด้านบนสำเร็จแล้ว!", "success");
}

// ================= STOREFRONT ANNOUNCEMENTS CRUD =================
let selectedStorefrontAnnStyle = "classic";

function selectAnnStyle(styleName, element) {
  document.querySelectorAll(".ann-style-option").forEach(opt => opt.classList.remove("active"));
  element.classList.add("active");
  selectedStorefrontAnnStyle = styleName;
}

function saveAnnouncement() {
  const text = document.getElementById("cfg-ann-text").value.trim();
  if (!text) {
    showNotification("กรุณาระบุข้อความประกาศ", "error");
    return;
  }
  
  const idInput = document.getElementById("cfg-ann-id").value;
  const isEdit = !!idInput;
  
  let displayMode = "static";
  const displayRadios = document.getElementsByName("cfg-ann-display");
  displayRadios.forEach(r => {
    if (r.checked) displayMode = r.value;
  });
  
  let status = "enabled";
  const statusRadios = document.getElementsByName("cfg-ann-status");
  statusRadios.forEach(r => {
    if (r.checked) status = r.value;
  });
  
  const bgColor = document.getElementById("cfg-ann-bg").value;
  const borderColor = document.getElementById("cfg-ann-border").value;
  const textColor = document.getElementById("cfg-ann-text-color").value;
  
  const annData = {
    id: isEdit ? idInput : "ann_" + Date.now(),
    text: text,
    displayMode: displayMode,
    cardStyle: selectedStorefrontAnnStyle,
    status: status,
    bgColor: bgColor,
    borderColor: borderColor,
    textColor: textColor
  };
  
  if (!db.announcements) db.announcements = [];
  
  if (isEdit) {
    const idx = db.announcements.findIndex(a => a.id === idInput);
    if (idx !== -1) {
      db.announcements[idx] = annData;
    }
    showNotification("แก้ไขประกาศสำเร็จแล้ว!", "success");
  } else {
    db.announcements.push(annData);
    showNotification("สร้างประกาศใหม่สำเร็จแล้ว!", "success");
  }
  
  saveDatabase();
  resetAnnouncementForm();
  renderAdminAnnouncementsList();
  renderAnnouncements();
}

function resetAnnouncementForm() {
  document.getElementById("cfg-ann-id").value = "";
  document.getElementById("cfg-ann-text").value = "";
  
  // Reset radios
  document.getElementsByName("cfg-ann-display").forEach(r => r.checked = r.value === "static");
  document.getElementsByName("cfg-ann-status").forEach(r => r.checked = r.value === "enabled");
  
  // Reset style picker
  selectedStorefrontAnnStyle = "classic";
  document.querySelectorAll(".ann-style-option").forEach(opt => {
    opt.classList.remove("active");
    if (opt.querySelector(".ann-preview-box.classic") || opt.outerHTML.includes("'classic'")) {
      opt.classList.add("active");
    }
  });
  
  // Reset color pickers
  document.getElementById("cfg-ann-bg").value = "#ffffff";
  document.getElementById("cfg-ann-bg-hex").value = "#ffffff";
  document.getElementById("cfg-ann-border").value = "#000000";
  document.getElementById("cfg-ann-border-hex").value = "#000000";
  document.getElementById("cfg-ann-text-color").value = "#000000";
  document.getElementById("cfg-ann-text-color-hex").value = "#000000";
  
  document.getElementById("ann-form-title").innerHTML = `<i class="fa-solid fa-plus-circle"></i> เพิ่มประกาศใหม่`;
  document.getElementById("btn-save-ann").innerHTML = `<i class="fa-solid fa-save"></i> สร้างประกาศ`;
  document.getElementById("btn-cancel-ann").style.display = "none";
}

function renderAdminAnnouncementsList() {
  const tbody = document.getElementById("admin-announcements-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  
  const list = db.announcements || [];
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">ยังไม่มีรายการประกาศในระบบ</td></tr>`;
    return;
  }
  
  list.forEach(ann => {
    // Style label mapping
    const styleThaiMap = {
      classic: "คลาสสิก",
      gradient: "ไล่สี",
      glass: "กระจก",
      neon: "นีออน",
      modern: "โมเดิร์น",
      pill: "ยาเม็ด",
      minimal: "มินิมอล",
      highlight: "โดดเด่น"
    };
    const formatThaiMap = {
      scroll: "เลื่อน (Scroll)",
      static: "อยู่นิ่ง (Static)"
    };
    
    const styleLabel = styleThaiMap[ann.cardStyle] || ann.cardStyle;
    const formatLabel = formatThaiMap[ann.displayMode] || ann.displayMode;
    const statusText = ann.status === "enabled" ? `<span style="color:#10b981; font-weight:bold;">เปิดใช้งาน</span>` : `<span style="color:#ef4444; font-weight:bold;">ยกเลิก</span>`;
    
    // Strip HTML tag for snippet list representation
    const textSnippet = ann.text.replace(/<\/?[^>]+(>|$)/g, "").substring(0, 35) + (ann.text.length > 35 ? "..." : "");
    
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${textSnippet}</td>
      <td>
        <div style="font-size: 0.8rem; line-height: 1.3;">
          <div>กรอบ: <strong>${styleLabel}</strong></div>
          <div>แสดง: <strong>${formatLabel}</strong></div>
        </div>
      </td>
      <td>${statusText}</td>
      <td>
        <div style="display:flex; gap:5px;">
          <button class="action-btn edit-btn" onclick="editAnnouncement('${ann.id}')" style="background:var(--primary-color); border:none; padding:4px 8px; border-radius:4px; color:white; cursor:pointer;" title="แก้ไข"><i class="fa-solid fa-edit"></i></button>
          <button class="action-btn delete-btn" onclick="deleteAnnouncement('${ann.id}')" style="background:var(--danger); border:none; padding:4px 8px; border-radius:4px; color:white; cursor:pointer;" title="ลบ"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function editAnnouncement(id) {
  const ann = db.announcements.find(a => a.id === id);
  if (!ann) return;
  
  document.getElementById("cfg-ann-id").value = ann.id;
  document.getElementById("cfg-ann-text").value = ann.text;
  
  // Set display mode
  document.getElementsByName("cfg-ann-display").forEach(r => {
    r.checked = r.value === ann.displayMode;
  });
  
  // Set status
  document.getElementsByName("cfg-ann-status").forEach(r => {
    r.checked = r.value === ann.status;
  });
  
  // Set style
  selectedStorefrontAnnStyle = ann.cardStyle;
  document.querySelectorAll(".ann-style-option").forEach(opt => {
    opt.classList.remove("active");
    if (opt.outerHTML.includes(`'${ann.cardStyle}'`)) {
      opt.classList.add("active");
    }
  });
  
  // Set colors
  document.getElementById("cfg-ann-bg").value = ann.bgColor || "#ffffff";
  document.getElementById("cfg-ann-bg-hex").value = ann.bgColor || "#ffffff";
  document.getElementById("cfg-ann-border").value = ann.borderColor || "#000000";
  document.getElementById("cfg-ann-border-hex").value = ann.borderColor || "#000000";
  document.getElementById("cfg-ann-text-color").value = ann.textColor || "#000000";
  document.getElementById("cfg-ann-text-color-hex").value = ann.textColor || "#000000";
  
  document.getElementById("ann-form-title").innerHTML = `<i class="fa-solid fa-edit"></i> แก้ไขประกาศ`;
  document.getElementById("btn-save-ann").innerHTML = `<i class="fa-solid fa-save"></i> บันทึกประกาศ`;
  document.getElementById("btn-cancel-ann").style.display = "block";
}

function deleteAnnouncement(id) {
  if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบประกาศนี้?")) return;
  db.announcements = db.announcements.filter(a => a.id !== id);
  saveDatabase();
  renderAdminAnnouncementsList();
  renderAnnouncements();
  showNotification("ลบประกาศเรียบร้อยแล้ว", "success");
}

function renderAnnouncements() {
  const container = document.getElementById("storefront-announcements-container");
  if (!container) return;
  container.innerHTML = "";
  
  const activeAnns = db.announcements ? db.announcements.filter(a => a.status === "enabled") : [];
  if (activeAnns.length === 0) {
    container.style.display = "none";
    return;
  }
  container.style.display = "block";
  
  activeAnns.forEach(ann => {
    const card = document.createElement("div");
    card.className = `ann-card ${ann.cardStyle}`;
    
    // Apply user customized colors
    if (ann.bgColor) card.style.backgroundColor = ann.bgColor;
    if (ann.textColor) card.style.color = ann.textColor;
    
    if (ann.cardStyle === "gradient" || ann.cardStyle === "modern") {
      if (ann.borderColor) card.style.borderLeftColor = ann.borderColor;
    } else if (ann.cardStyle !== "pill" && ann.cardStyle !== "highlight") {
      if (ann.borderColor) card.style.borderColor = ann.borderColor;
    }
    
    const textContainer = document.createElement("div");
    textContainer.className = "ann-text-container";
    
    if (ann.displayMode === "scroll") {
      textContainer.innerHTML = `<marquee scrollamount="4" behavior="scroll" direction="left" onmouseover="this.stop();" onmouseout="this.start();">${ann.text}</marquee>`;
    } else {
      textContainer.innerHTML = ann.text;
    }
    
    card.appendChild(textContainer);
    container.appendChild(card);
  });
}

// ================= POPUP ANNOUNCEMENT SETTINGS =================
function triggerPopupImgUpload() {
  document.getElementById("popup-img-file").click();
}

function handlePopupImgUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById("cfg-popup-img").value = e.target.result;
    showNotification("อัปโหลดรูปภาพสำเร็จ!", "success");
  };
  reader.readAsDataURL(file);
}

function savePopupAnnouncementSettings() {
  const s = db.settings;
  s.popupTitle = document.getElementById("cfg-popup-title").value.trim();
  s.popupImg = document.getElementById("cfg-popup-img").value.trim();
  s.popupLink = document.getElementById("cfg-popup-link").value.trim();
  s.popupEnabled = document.getElementById("cfg-popup-enabled").checked;
  
  saveDatabase();
  showNotification("บันทึกข้อมูลป็อปอัพสำเร็จแล้ว!", "success");
}

function checkPopupAnnouncement() {
  const s = db.settings;
  if (s.popupEnabled && s.popupImg) {
    const shown = sessionStorage.getItem("nexa_popup_shown");
    if (!shown) {
      document.getElementById("popup-title-text").textContent = s.popupTitle || "ประกาศจากร้าน";
      const anchor = document.getElementById("popup-link-anchor");
      const img = document.getElementById("popup-image-el");
      
      img.src = s.popupImg;
      if (s.popupLink) {
        anchor.href = s.popupLink;
        anchor.style.pointerEvents = "auto";
      } else {
        anchor.removeAttribute("href");
        anchor.style.pointerEvents = "none";
      }
      
      document.getElementById("popup-announcement-modal").classList.add("active");
    }
  }
}

function closePopupAnnouncement() {
  document.getElementById("popup-announcement-modal").classList.remove("active");
  sessionStorage.setItem("nexa_popup_shown", "true");
}

// ================= LOGO & BANNER UPLOADER =================
function triggerLogoUpload() {
  document.getElementById("logo-img-file").click();
}

function handleLogoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById("cfg-site-logo").value = e.target.result;
    showNotification("อัปโหลดรูปภาพโลโก้สำเร็จ! กรุณาคลิกบันทึกข้อมูลเพื่อใช้รูปภาพนี้", "success");
  };
  reader.readAsDataURL(file);
}

function triggerBannerUpload() {
  document.getElementById("banner-img-file").click();
}

function handleBannerUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById("cfg-banner-img").value = e.target.result;
    showNotification("อัปโหลดรูปภาพแบนเนอร์สำเร็จ! กรุณาคลิกบันทึกข้อมูลเพื่อใช้รูปภาพนี้", "success");
  };
  reader.readAsDataURL(file);
}

// ================= NAVIGATION SCROLL ACTIONS =================
function scrollToCatalog() {
  if (currentView !== "shop") {
    showView("shop");
  }
  // Let the browser finish rendering the shop view before scrolling
  setTimeout(() => {
    const catalogEl = document.getElementById("catalog");
    if (catalogEl) {
      const headerOffset = 80;
      const elementPosition = catalogEl.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  }, 120);
}

function scrollToContact() {
  if (currentView !== "shop") {
    showView("shop");
  }
  // Let the browser finish rendering the shop view before scrolling
  setTimeout(() => {
    const footerEl = document.querySelector("footer");
    if (footerEl) {
      footerEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, 120);
}

// ================= CLEAR/DELETE IMAGES AND FAVICON UPLOADER =================
function clearLogoImage() {
  document.getElementById("cfg-site-logo").value = "";
  showNotification("ล้างช่องลิงก์โลโก้แล้ว กรุณาคลิกปุ่มบันทึกข้อมูลด้านบนเพื่อยืนยันลบถาวร", "info");
}

function clearBannerImage() {
  document.getElementById("cfg-banner-img").value = "";
  showNotification("ล้างช่องลิงก์แบนเนอร์แล้ว กรุณาคลิกปุ่มบันทึกข้อมูลด้านบนเพื่อยืนยันลบถาวร", "info");
}

function clearPopupImage() {
  document.getElementById("cfg-popup-img").value = "";
  showNotification("ล้างช่องลิงก์รูปป็อปอัพแล้ว กรุณาคลิกปุ่มบันทึกข้อมูลด้านบนเพื่อยืนยันลบถาวร", "info");
}

function triggerWebhookLogoUpload() {
  document.getElementById("webhook-logo-img-file").click();
}

function handleWebhookLogoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById("cfg-webhook-logo").value = e.target.result;
    showNotification("อัปโหลดรูปโลโก้ Webhook สำเร็จ! กรุณาคลิกบันทึกข้อมูลเพื่อใช้รูปภาพนี้", "success");
  };
  reader.readAsDataURL(file);
}

function clearWebhookLogoImage() {
  document.getElementById("cfg-webhook-logo").value = "";
  showNotification("ล้างช่องโลโก้ Webhook แล้ว กรุณาคลิกปุ่มบันทึกข้อมูลด้านบนเพื่อยืนยัน", "info");
}

function triggerFaviconUpload() {
  document.getElementById("favicon-img-file").click();
}

function handleFaviconUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    document.getElementById("cfg-seo-favicon").value = e.target.result;
    showNotification("อัปโหลดไอคอนแท็บสำเร็จ! กรุณาคลิกปุ่มบันทึกข้อมูลด้านบนเพื่อยืนยันใช้งาน", "success");
  };
  reader.readAsDataURL(file);
}
