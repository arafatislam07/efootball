// ==========================================================================
// ১. গ্লোবাল কনফিগারেশন এবং পাসওয়ার্ড সেটআপ
// ==========================================================================
const ADMIN_PASSWORD = "@Arafat@#100yt@";
let currentLanguage = localStorage.getItem("lang") || "bn"; // লোকাল স্টোরেজ থেকে ভাষা মনে রাখবে

let playersRules = JSON.parse(localStorage.getItem("playersRules")) || [];
let tournamentSystems = JSON.parse(localStorage.getItem("tournamentSystems")) || [];

// পেজ লোড হওয়ার সাথে সাথে সব ফাংশন রান করা
window.onload = function() {
    renderRules();
    checkAdminStatus();
    updateInputFields();
    updateButtonText();
    updateHeadings(); // হেডিং আপডেট করার জন্য নতুন ফাংশন
};

// ==========================================================================
// ২. ভাষা ও হেডিং আপডেট লজিক
// ==========================================================================
function updateButtonText() {
    const langBtn = document.getElementById("lang-toggle-btn");
    if (langBtn) {
        langBtn.innerHTML = currentLanguage === "bn" ? '<i class="fas fa-language"></i> English' : '<i class="fas fa-language"></i> বাংলা';
    }
}

function updateHeadings() {
    const pTitle = document.getElementById("title-players-rules");
    const tTitle = document.getElementById("title-tour-system");
    
    if (currentLanguage === "bn") {
        if (pTitle) pTitle.innerHTML = '<i class="fas fa-users"></i> প্লেয়ারদের জন্য নিয়মাবলী';
        if (tTitle) tTitle.innerHTML = '<i class="fas fa-cogs"></i> টুর্নামেন্ট সিস্টেম';
    } else {
        if (pTitle) pTitle.innerHTML = '<i class="fas fa-users"></i> Players Rules';
        if (tTitle) tTitle.innerHTML = '<i class="fas fa-cogs"></i> Tournament System';
    }
}

function toggleLanguage() {
    currentLanguage = (currentLanguage === "bn") ? "en" : "bn";
    localStorage.setItem("lang", currentLanguage);
    
    updateButtonText();
    updateHeadings();
    renderRules();
}

// ==========================================================================
// ৩. অ্যাডমিন লগইন এবং অথেন্টিকেশন
// ==========================================================================
function handleAdminAuth() {
    const isLoggedIn = localStorage.getItem("isAdminLoggedIn") === "true";

    if (isLoggedIn) {
        localStorage.setItem("isAdminLoggedIn", "false");
        alert("অ্যাডমিন লগআউট সফল হয়েছে!");
        window.location.reload();
    } else {
        const passwordInput = prompt("আপনার গোপন অ্যাডমিন পাসওয়ার্ডটি দিন:");
        if (passwordInput === ADMIN_PASSWORD) {
            localStorage.setItem("isAdminLoggedIn", "true");
            alert("সফলভাবে অ্যাডমিন প্যানেলে প্রবেশ করেছেন!");
            window.location.reload();
        } else if (passwordInput !== null) {
            alert("ভুল পাসওয়ার্ড! আবার চেষ্টা করুন।");
        }
    }
}

function checkAdminStatus() {
    const isLoggedIn = localStorage.getItem("isAdminLoggedIn") === "true";
    const loginBtn = document.getElementById("admin-login-btn");
    const adminRulesControls = document.getElementById("admin-rules-controls");
    const adminSystemControls = document.getElementById("admin-system-controls");

    if (isLoggedIn) {
        if(loginBtn) {
            loginBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout Admin';
            loginBtn.style.backgroundColor = "#f85149";
        }
        if(adminRulesControls) adminRulesControls.style.display = "flex";
        if(adminSystemControls) adminSystemControls.style.display = "flex";
    } else {
        if(loginBtn) loginBtn.innerHTML = '<i class="fas fa-lock"></i> Admin Login';
        if(adminRulesControls) adminRulesControls.style.display = "none";
        if(adminSystemControls) adminSystemControls.style.display = "none";
    }
}

function updateInputFields() {
    const adminRulesControls = document.getElementById("admin-rules-controls");
    const adminSystemControls = document.getElementById("admin-system-controls");
    
    if(adminRulesControls) {
        adminRulesControls.innerHTML = `
            <input type="text" id="new-rule-bn" placeholder="এখানে বাংলায় নিয়মটি লিখুন...">
            <button onclick="addNewRule('players')"><i class="fas fa-plus"></i> Add Rules</button>
        `;
    }
    if(adminSystemControls) {
        adminSystemControls.innerHTML = `
            <input type="text" id="new-sys-bn" placeholder="এখানে বাংলায় সিস্টেম গাইডটি লিখুন...">
            <button onclick="addNewRule('system')"><i class="fas fa-plus"></i> Add System</button>
        `;
    }
}

// ==========================================================================
// ৪. নতুন নিয়ম যোগ এবং অটো-ট্রান্সলেশন লজিক
// ==========================================================================
async function addNewRule(type) {
    let inputId = (type === 'players') ? "new-rule-bn" : "new-sys-bn";
    const bnInput = document.getElementById(inputId).value.trim();
    if (bnInput === "") { alert("দয়া করে বাংলায় লিখুন!"); return; }

    try {
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(bnInput)}&langpair=bn|en`);
        const data = await res.json();
        let enTranslation = data.responseData.translatedText;

        if (type === 'players') {
            playersRules.push({ bn: bnInput, en: enTranslation });
            localStorage.setItem("playersRules", JSON.stringify(playersRules));
        } else {
            tournamentSystems.push({ bn: bnInput, en: enTranslation });
            localStorage.setItem("tournamentSystems", JSON.stringify(tournamentSystems));
        }
        document.getElementById(inputId).value = "";
        renderRules();
    } catch (error) {
        alert("ট্রান্সলেশন করতে সমস্যা হয়েছে, অফলাইনে যোগ করা হচ্ছে।");
    }
}

function deleteRule(type, index) {
    if (confirm("আপনি কি এটি মুছে ফেলতে চান?")) {
        if (type === 'players') playersRules.splice(index, 1);
        else tournamentSystems.splice(index, 1);
        
        localStorage.setItem("playersRules", JSON.stringify(playersRules));
        localStorage.setItem("tournamentSystems", JSON.stringify(tournamentSystems));
        renderRules();
    }
}

// ==========================================================================
// ৫. রেন্ডারিং ফাংশন
// ==========================================================================
function renderRules() {
    const playersListUl = document.getElementById("players-rules-list");
    const systemListUl = document.getElementById("tour-system-list");
    const isAdmin = localStorage.getItem("isAdminLoggedIn") === "true";

    if(!playersListUl || !systemListUl) return;

    playersListUl.innerHTML = "";
    systemListUl.innerHTML = "";

    playersRules.forEach((rule, index) => {
        const li = document.createElement("li");
        li.textContent = currentLanguage === "bn" ? rule.bn : rule.en;
        if (isAdmin) {
            li.innerHTML += ` <button class="delete-rule-btn" onclick="deleteRule('players', ${index})"><i class="fas fa-trash"></i></button>`;
        }
        playersListUl.appendChild(li);
    });

    tournamentSystems.forEach((sys, index) => {
        const li = document.createElement("li");
        li.textContent = currentLanguage === "bn" ? sys.bn : sys.en;
        if (isAdmin) {
            li.innerHTML += ` <button class="delete-rule-btn" onclick="deleteRule('system', ${index})"><i class="fas fa-trash"></i></button>`;
        }
        systemListUl.appendChild(li);
    });
}