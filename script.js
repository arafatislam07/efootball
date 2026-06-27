// ==========================================================================
// ১. গ্লোবাল কনফিগারেশন এবং পাসওয়ার্ড সেটআপ
// ==========================================================================
const ADMIN_PASSWORD = "@Arafat@#100yt@";
let currentLanguage = localStorage.getItem("lang") || "bn"; // লোকাল স্টোরেজ থেকে ভাষা মনে রাখবে

let playersRules = [];
let tournamentSystems = [];

// পেজ লোড হওয়ার সাথে সাথে ফায়ারবেস থেকে লাইভ ডেটা লিসেন করা শুরু হবে
window.onload = function() {
    checkAdminStatus();
    updateInputFields();
    updateButtonText();
    updateHeadings();
    
    // ফায়ারবেস থেকে ডেটা রিয়েল-টাইমে লোড করার মূল ফাংশনগুলো কল করা হলো
    listenToFirebaseData();
};

// ==========================================================================
// ১.৫. ফায়ারবেস লাইভ ডেটা লিসেনার (নতুন যোগ করা হয়েছে)
// ==========================================================================
function listenToFirebaseData() {
    // ফায়ারবেস ডেটাবেজ রেফারেন্স চেক করা (HTML ফাইলে উইন্ডো অবজেক্টে সেট করা হয়েছিল)
    if (!window.fbDatabase || !window.fbOnValue || !window.fbRef) {
        console.error("Firebase কনফিগারেশন এখনো লোড হয়নি।");
        return;
    }

    // ১. প্লেয়ারদের নিয়মের লাইভ ডেটা টেনে আনা
    const rulesRef = window.fbRef(window.fbDatabase, 'rules/players');
    window.fbOnValue(rulesRef, (snapshot) => {
        const data = snapshot.val();
        playersRules = [];
        if (data) {
            // ফায়ারবেসের অবজেক্ট কী (ID) গুলোকে অ্যারেতে কনভার্ট করা ডিলিটের সুবিধার্থে
            Object.keys(data).forEach(key => {
                playersRules.push({ id: key, bn: data[key].bn, en: data[key].en });
            });
        }
        renderRules(); // ডেটা আসার সাথে সাথে স্ক্রিন রেন্ডার হবে
    });

    // ২. টুর্নামেন্ট সিস্টেমের লাইভ ডেটা টেনে আনা
    const systemRef = window.fbRef(window.fbDatabase, 'rules/system');
    window.fbOnValue(systemRef, (snapshot) => {
        const data = snapshot.val();
        tournamentSystems = [];
        if (data) {
            Object.keys(data).forEach(key => {
                tournamentSystems.push({ id: key, bn: data[key].bn, en: data[key].en });
            });
        }
        renderRules(); // ডেটা আসার সাথে সাথে স্ক্রিন রেন্ডার হবে
    });
}

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
// ৪. নতুন নিয়ম যোগ এবং ফায়ারবেস অনলাইন সেভ লজিক (আপডেট করা হয়েছে)
// ==========================================================================
async function addNewRule(type) {
    let inputId = (type === 'players') ? "new-rule-bn" : "new-sys-bn";
    const bnInput = document.getElementById(inputId).value.trim();
    if (bnInput === "") { alert("দয়া করে বাংলায় লিখুন!"); return; }

    try {
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(bnInput)}&langpair=bn|en`);
        const data = await res.json();
        let enTranslation = data.responseData.translatedText;

        // ফায়ারবেসের ইউনিক কি (Key) পুশ করার মাধ্যমে তৈরি করা
        const newRef = window.fbPush(window.fbRef(window.fbDatabase, `rules/${type}`));
        
        // ফায়ারবেস অনলাইনে ডেটা সেভ করা
        window.fbSet(newRef, {
            bn: bnInput,
            en: enTranslation
        }).then(() => {
            document.getElementById(inputId).value = "";
        }).catch((err) => {
            alert("ফায়ারবেসে ডেটা সেভ করতে সমস্যা হয়েছে!");
        });

    } catch (error) {
        alert("ট্রান্সলেশন করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    }
}

// ==========================================================================
// ৪.৫. ফায়ারবেস ক্লাউড থেকে ডিলিট করার লজিক (আপনার নোট অনুযায়ী আপডেট করা হয়েছে)
// ==========================================================================
function deleteRule(type, id) {
    if (confirm("আপনি কি এটি ফায়ারবেস ডাটাবেজ এবং ওয়েবসাইট থেকে চিরতরে মুছে ফেলতে চান?")) {
        // ফায়ারবেস থেকে আইডি ধরে রিমুভ করা হচ্ছে
        window.fbRemove(window.fbRef(window.fbDatabase, `rules/${type}/${id}`))
        .then(() => {
            console.log("সফলভাবে অনলাইন থেকে ডিলিট করা হয়েছে।");
        })
        .catch((error) => {
            alert("অনলাইন থেকে ডিলিট করতে সমস্যা হয়েছে: " + error.message);
        });
    }
}

// ==========================================================================
// ৫. রেন্ডারিং ফাংশন (অনলাইন আইডি অনুযায়ী জেনারেট হবে)
// ==========================================================================
function renderRules() {
    const playersListUl = document.getElementById("players-rules-list");
    const systemListUl = document.getElementById("tour-system-list");
    const isAdmin = localStorage.getItem("isAdminLoggedIn") === "true";

    if(!playersListUl || !systemListUl) return;

    playersListUl.innerHTML = "";
    systemListUl.innerHTML = "";

    // প্লেয়ার রুল রেন্ডার
    playersRules.forEach((rule) => {
        const li = document.createElement("li");
        li.textContent = currentLanguage === "bn" ? rule.bn : rule.en;
        if (isAdmin) {
            // এখানে ডিলিট ফাংশনে এখন ইনডেক্সের বদলে ইউনিক ফায়ারবেস আইডি (`rule.id`) পাঠানো হচ্ছে
            li.innerHTML += ` <button class="delete-rule-btn" onclick="deleteRule('players', '${rule.id}')"><i class="fas fa-trash"></i></button>`;
        }
        playersListUl.appendChild(li);
    });

    // টুর্নামেন্ট সিস্টেম রেন্ডার
    tournamentSystems.forEach((sys) => {
        const li = document.createElement("li");
        li.textContent = currentLanguage === "bn" ? sys.bn : sys.en;
        if (isAdmin) {
            // ইউনিক ফায়ারবেস আইডি (`sys.id`) পাঠানো হচ্ছে
            li.innerHTML += ` <button class="delete-rule-btn" onclick="deleteRule('system', '${sys.id}')"><i class="fas fa-trash"></i></button>`;
        }
        systemListUl.appendChild(li);
    });
}

// গ্লোবাল স্কোপে ফাংশন দুটি রাখার জন্য উইন্ডোতে ডিক্লেয়ার করা হলো যেন HTML থেকে বাটন ট্রিপ করতে পারে
window.addNewRule = addNewRule;
window.deleteRule = deleteRule;
window.toggleLanguage = toggleLanguage;
window.handleAdminAuth = handleAdminAuth;