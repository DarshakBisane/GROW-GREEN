// =================== Shared Data ===================
let users = JSON.parse(localStorage.getItem("gg_users") || "[]");
let currentUser = JSON.parse(localStorage.getItem("gg_currentUser") || "null");
let isAdmin = localStorage.getItem("gg_isAdmin") === "true";
let farmers = JSON.parse(localStorage.getItem("gg_farmers") || "[]");
let messages = JSON.parse(localStorage.getItem("gg_messages") || "[]");

// =================== Utilities ===================
function saveAll() {
    localStorage.setItem("gg_users", JSON.stringify(users));
    localStorage.setItem("gg_currentUser", JSON.stringify(currentUser));
    localStorage.setItem("gg_isAdmin", isAdmin ? "true" : "false");
    localStorage.setItem("gg_farmers", JSON.stringify(farmers));
    localStorage.setItem("gg_messages", JSON.stringify(messages));
}

function escapeHtml(str) {
    if (typeof str !== "string") return "";
    return str.replace(/[&<>\"'`=\/]/g, (s) => ({
        "&": "&",
        "<": "<",
        ">": ">",
        '"': '"',
        "'": "'",
        "/": "/",
        "`": "`",
        "=": "=",
    })[s]);
}

// =================== Theme Toggle ===================
const themeToggle = document.getElementById("themeToggle");
if (themeToggle) {
    const savedTheme = localStorage.getItem("gg_theme");
    if (savedTheme === "dark") document.body.classList.add("dark");
    themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark");
        localStorage.setItem(
            "gg_theme",
            document.body.classList.contains("dark") ? "dark" : "light"
        );
    });
}

// =================== Menu (present on all pages) ===================
const menuBtn = document.getElementById("menuBtn");
const menuOptions = document.getElementById("menuOptions");
if (menuBtn && menuOptions) {
    menuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        menuOptions.style.display =
            menuOptions.style.display === "block" ? "none" : "block";
    });
    document.addEventListener("click", (e) => {
        if (!menuBtn.contains(e.target) && !menuOptions.contains(e.target)) {
            menuOptions.style.display = "none";
        }
    });
}

// =================== Navigation shortcuts ===================
const userLoginBtn = document.getElementById("userLoginBtn");
const searchBtnNav = document.getElementById("searchBtnNav");
const adminLoginBtn = document.getElementById("adminLoginBtn");
const uploadBtn = document.getElementById("uploadBtn");
const directoryBtn = document.getElementById("directoryBtn");
const logoutBtn = document.getElementById("logoutBtn");
const homeBtn = document.getElementById("homeBtn");
if (homeBtn) homeBtn.onclick = () => (location.href = "homepage.html");


if (userLoginBtn) userLoginBtn.onclick = () => (location.href = "login.html");
if (searchBtnNav) searchBtnNav.onclick = () => (location.href = "search.html");
if (adminLoginBtn) adminLoginBtn.onclick = () => (location.href = "adminlogin.html");
if (uploadBtn) uploadBtn.onclick = () => (location.href = "upload.html");
if (directoryBtn) directoryBtn.onclick = () => (location.href = "directory.html");
if (logoutBtn) {
    logoutBtn.onclick = () => {
        currentUser = null;
        isAdmin = false;
        saveAll();
        alert("Logged out successfully.");
        location.href = "index.html";
    };
}

// =================== Admin Login ===================
const adminLogin = document.getElementById("adminLogin");
if (adminLogin) {
    const ADMIN_PASSWORD = "admin123";
    adminLogin.addEventListener("click", () => {
        const pass = document.getElementById("adminPassword").value;
        if (!pass) return alert("Enter password.");
        if (pass === ADMIN_PASSWORD) {
            isAdmin = true;
            currentUser = null;
            saveAll();
            alert("Admin logged in.");
            location.href = "directory.html";
        } else alert("Wrong admin password.");
    });
}

// =================== User Register/Login ===================
const registerUser = document.getElementById("registerUser");
if (registerUser) {
    registerUser.addEventListener("click", () => {
        const name = document.getElementById("userName").value.trim();
        const email = document.getElementById("userEmail").value
            .trim()
            .toLowerCase();
        const pass = document.getElementById("userPassword").value;
        if (!name || !email || !pass) return alert("Fill all fields.");
        if (users.some((u) => u.email === email)) return alert("User already exists.");
        users.push({ name, email, password: pass });
        saveAll();
        alert("Registered successfully. Please log in.");
    });
}

const loginUser = document.getElementById("loginUser");
if (loginUser) {
    loginUser.addEventListener("click", () => {
        const email = document.getElementById("userEmail").value
            .trim()
            .toLowerCase();
        const pass = document.getElementById("userPassword").value;
        const user = users.find((u) => u.email === email && u.password === pass);
        if (!user) return alert("Invalid credentials.");
        currentUser = { name: user.name, email: user.email };
        isAdmin = false;
        saveAll();
        alert(`Welcome, ${user.name}`);
        location.href = "upload.html";
    });
}

// =================== Upload (Data URL persistence) ===================
const uploadForm = document.getElementById("uploadForm");
if (uploadForm) {
    uploadForm.addEventListener("submit", async(e) => {
        e.preventDefault();
        if (!currentUser && !isAdmin) return alert("You must be logged in to upload.");

        const file = document.getElementById("certificate").files[0];
        if (!file) return alert("Attach a certificate file.");
        if (file.size > 2 * 1024 * 1024) {
            return alert("Certificate too large. Please upload a file under 2 MB.");
        }

        const toDataURL = (f) =>
            new Promise((resolve, reject) => {
                const r = new FileReader();
                r.onload = () => resolve(r.result);
                r.onerror = reject;
                r.readAsDataURL(f);
            });

        const dataURL = await toDataURL(file);

        const entry = {
            name: document.getElementById("name").value.trim(),
            product: document.getElementById("product").value.trim(),
            productDetails: document.getElementById("productDetails").value.trim(),
            price: document.getElementById("price").value.trim(),
            address: document.getElementById("address").value.trim(),
            mobile: document.getElementById("mobile").value.trim(),
            certificateURL: dataURL, // persistent across sessions
            certificateName: file.name,
            certificateType: file.type || "application/octet-stream",
            verified: false,
            userEmail: currentUser ? currentUser.email : "admin",
        };

        farmers.push(entry);
        saveAll();
        uploadForm.reset();
        alert("Product uploaded successfully.");
    });
}

// Helper to build a reliable certificate link
function certificateAnchor(f) {
    const safeName = escapeHtml(f.certificateName || "certificate");
    return `
    <a href="${f.certificateURL}" target="_blank" rel="noopener" download="${safeName}">
      View Certificate
    </a>
  `;
}

// =================== Search ===================
const searchBtn = document.getElementById("searchBtn");
if (searchBtn) {
    searchBtn.addEventListener("click", () => {
        const q = document.getElementById("searchQuery").value.trim().toLowerCase();
        const results = farmers.filter(
            (f) =>
            !q ||
            f.name.toLowerCase().includes(q) ||
            f.product.toLowerCase().includes(q)
        );
        const container = document.getElementById("searchResults");
        container.innerHTML = "";
        if (results.length === 0) {
            container.innerHTML = "<p>No results found.</p>";
            return;
        }
        results.forEach((f) => {
            const div = document.createElement("div");
            div.className = "farmer-card";
            div.innerHTML = `
        <h3>${escapeHtml(f.product)} – ${escapeHtml(f.name)}</h3>
        <p><strong>Price:</strong> ₹${escapeHtml(f.price)}</p>
        <p><strong>Verified:</strong> ${f.verified ? "✅" : "❌"}</p>
        <p><strong>Contact:</strong> ${escapeHtml(f.mobile)}</p>
        ${certificateAnchor(f)}
      `;
            container.appendChild(div);
        });
    });
}

// Auto-run search if a prefill value exists (used by homepage)
(function autoPrefillSearch() {
    const field = document.getElementById("searchQuery");
    const btn = document.getElementById("searchBtn");
    if (!field || !btn) return;
    const prefill = localStorage.getItem("gg_prefillSearch");
    if (prefill) {
        field.value = prefill;
        localStorage.removeItem("gg_prefillSearch");
        // Trigger the existing search flow
        btn.click();
    }
})();


// =================== Directory (Admin) ===================
function renderDirectory() {
    const list = document.getElementById("directoryList");
    if (!list) return;

    if (!isAdmin) {
        alert("Access denied. Admins only.");
        location.href = "adminlogin.html";
        return;
    }

    list.innerHTML = "";
    if (!farmers.length) {
        list.innerHTML = "<p>No farmer entries yet.</p>";
        return;
    }

    farmers.forEach((f, i) => {
        const div = document.createElement("div");
        div.className = "farmer-card";
        div.innerHTML = `
      <h3>${escapeHtml(f.product)} – ${escapeHtml(f.name)}</h3>
      <p>${escapeHtml(f.productDetails)}</p>
      <p><strong>Price:</strong> ₹${escapeHtml(f.price)}</p>
      <p><strong>Contact:</strong> ${escapeHtml(f.mobile)}</p>
      <p><strong>Verified:</strong> ${f.verified ? "✅" : "❌"}</p>
      ${certificateAnchor(f)}
      <div style="margin-top:8px;">
        <button class="small-btn verify-btn ${f.verified ? "verified" : ""}" data-index="${i}">
          ${f.verified ? "Verified" : "Mark Verified"}
        </button>
        <button class="small-btn delete-btn" data-del="${i}">Delete</button>
      </div>
    `;
        list.appendChild(div);
    });

    list.querySelectorAll(".verify-btn").forEach((btn) =>
        btn.addEventListener("click", (e) => {
            const i = Number(e.currentTarget.getAttribute("data-index"));
            farmers[i].verified = !farmers[i].verified;
            saveAll();
            renderDirectory();
        })
    );
    list.querySelectorAll(".delete-btn").forEach((btn) =>
        btn.addEventListener("click", (e) => {
            const i = Number(e.currentTarget.getAttribute("data-del"));
            if (confirm("Delete this entry?")) {
                farmers.splice(i, 1);
                saveAll();
                renderDirectory();
            }
        })
    );
}