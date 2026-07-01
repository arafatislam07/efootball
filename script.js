// ==========================================================================
// ১. পাসওয়ার্ড, স্টেট ম্যানেজমেন্ট এবং লজিক লকিং
// ==========================================================================
const ADMIN_PASSWORD = "@Arafat@#100yt@";
let currentLanguage = localStorage.getItem("lang") || "bn"; 

let playersRules = [];
let tournamentSystems = [];
let newsBanners = [];
let sliderInterval = null;

window.onload = function() {
    checkAdminStatus();
    updateInputFields();
    updateButtonText();
    updateHeadings();
    listenToFirebaseData();
};

// ==========================================================================
// ১.৫. ফায়ারবেস লাইভ ডেটা লিসেনার (১০০% ইনট্যাক্ট লজিক)
// ==========================================================================
function listenToFirebaseData() {
    if (!window.fbDatabase || !window.fbOnValue || !window.fbRef) {
        console.error("Firebase কনফিগারেশন লোড হয়নি।");
        return;
    }

    const rulesRef = window.fbRef(window.fbDatabase, 'rules/players');
    window.fbOnValue(rulesRef, (snapshot) => {
        const data = snapshot.val();
        playersRules = [];
        if (data) {
            Object.keys(data).forEach(key => {
                playersRules.push({ id: key, bn: data[key].bn, en: data[key].en });
            });
        }
        renderRules();
    });

    const systemRef = window.fbRef(window.fbDatabase, 'rules/system');
    window.fbOnValue(systemRef, (snapshot) => {
        const data = snapshot.val();
        tournamentSystems = [];
        if (data) {
            Object.keys(data).forEach(key => {
                tournamentSystems.push({ id: key, bn: data[key].bn, en: data[key].en });
            });
        }
        renderRules();
    });

    const newsRef = window.fbRef(window.fbDatabase, 'news');
    window.fbOnValue(newsRef, (snapshot) => {
        const data = snapshot.val();
        newsBanners = [];
        if (data) {
            Object.keys(data).forEach(key => {
                newsBanners.push({ id: key, imgUrl: data[key].imgUrl, caption: data[key].caption });
            });
        }
        renderNewsSlider();
    });
}

// ==========================================================================
// 📱 বটম নেভিগেশন কন্ট্রোলার
// ==========================================================================
function switchAppView(viewName) {
    const homeSection = document.getElementById("home-news-section");
    const eventSection = document.getElementById("event-tournament-section");
    const rulesSection = document.getElementById("rules-board-section");
    const tabs = document.querySelectorAll(".nav-tab-node");
    
    tabs.forEach(tab => tab.classList.remove("active-tab"));
    if(homeSection) homeSection.classList.remove("active-page");
    if(eventSection) eventSection.classList.remove("active-page");
    if(rulesSection) rulesSection.classList.remove("active-page");

    if (viewName === 'home') {
        if(homeSection) homeSection.classList.add("active-page");
        tabs[0].classList.add("active-tab");
    } else if (viewName === 'event') {
        if(eventSection) eventSection.classList.add("active-page");
        tabs[1].classList.add("active-tab");
    } else if (viewName === 'rules') {
        if(rulesSection) rulesSection.classList.add("active-page");
        tabs[2].classList.add("active-tab");
    } else if (viewName === 'ranking') {
        tabs[3].classList.add("active-tab");
        alert(currentLanguage === "bn" ? "র‍্যাঙ্কিং সিস্টেমটি নিয়ে পরবর্তীতে আলাদা ফাইলে কাজ করা হবে!" : "Ranking System will be implemented later in a separate file!");
        switchAppView('home');
    }
    closeHamburgerMenuReal();
}

// ==========================================================================
// ☰ ৩-বার সাইড মেনু কন্ট্রোল লজিক
// ==========================================================================
function toggleHamburgerMenu() {
    const dropdown = document.getElementById("hamburger-dropdown");
    const overlay = document.getElementById("hamburger-overlay");
    if(dropdown && overlay) {
        dropdown.classList.toggle("show");
        overlay.classList.toggle("show");
    }
}

// ৩-বার মেনু বন্ধ করার জন্য ডেডিকেটেড মেকানিজম
function closeHamburgerMenuReal() {
    const dropdown = document.getElementById("hamburger-dropdown");
    const overlay = document.getElementById("hamburger-overlay");
    if(dropdown && overlay) {
        dropdown.classList.remove("show");
        overlay.classList.remove("show");
    }
}

function handleClubMembersClick() {
    alert(currentLanguage === "bn" ? "ক্লাব মেম্বার প্যানেলটি নিয়ে পরবর্তীতে আলাদা ফাইলে কাজ করা হবে!" : "Club Member Option will be implemented later in a separate file!");
    closeHamburgerMenuReal();
}

// 📤 ব্যানার আপলোডের জন্য ডেডিকেটেড মিনি ওভারলে উইন্ডো ওপেন/ক্লোজ ফিক্স
function openAdminNewsModal() {
    const modal = document.getElementById("admin-news-modal");
    if(modal) {
        modal.style.display = "flex";
    }
    closeHamburgerMenuReal();
}

function closeAdminNewsModal() {
    const modal = document.getElementById("admin-news-modal");
    if(modal) {
        modal.style.display = "none";
    }
}

function openPlayerRegistration() {
    const modal = document.getElementById("player-reg-modal");
    if(modal) {
        modal.style.display = "flex";
    }
    closeHamburgerMenuReal();
}

function closePlayerRegistration() {
    const modal = document.getElementById("player-reg-modal");
    if(modal) {
        modal.style.display = "none";
    }
}

// ==========================================================================
// 📸 নিউজ ব্যানার স্লাইডার ইঞ্জিন (সেম-টু-সেম ৫ সেকেন্ড মেকানিজম)
// ==========================================================================
function renderNewsSlider() {
    const track = document.getElementById("news-slider-container");
    const dotsContainer = document.getElementById("slider-dots-indicator");
    if (!track || !dotsContainer) return;

    track.innerHTML = "";
    dotsContainer.innerHTML = "";

    if (sliderInterval) clearInterval(sliderInterval);

    if (newsBanners.length === 0) {
        track.innerHTML = `
            <div class="slide-node">
                <div class="placeholder-banner">
                    <h3 class="neon-text-blue">Welcome to Blades of Vengeance Tournament Platform</h3>
                    <p>Stay tuned for live updates, scores, and upcoming match schedules!</p>
                </div>
            </div>
        `;
        return;
    }

    newsBanners.forEach((news, idx) => {
        const slide = document.createElement("div");
        slide.className = "slide-node";
        
        const isAdmin = localStorage.getItem("isAdminLoggedIn") === "true";
        const deleteBtnHtml = isAdmin ? `<button class="delete-rule-btn" style="position:absolute; top:15px; right:15px; background:rgba(0,0,0,0.8); padding:6px 12px; border-radius:6px; z-index:10; font-size:0.8rem;" onclick="deleteNewsBanner('${news.id}')"><i class="fas fa-trash"></i> Delete</button>` : '';

        slide.innerHTML = `
            ${deleteBtnHtml}
            <img src="${news.imgUrl}" alt="News Banner" onerror="this.src='https://via.placeholder.com/800x450/050505/ffffff?text=Image+Loaded+Success'">
            ${news.caption ? `<div class="slide-caption-bar">${news.caption}</div>` : ''}
        `;
        track.appendChild(slide);

        const dot = document.createElement("div");
        dot.className = `dot-node ${idx === 0 ? 'active-dot' : ''}`;
        dot.onclick = () => {
            track.scrollTo({ left: track.offsetWidth * idx, behavior: 'smooth' });
        };
        dotsContainer.appendChild(dot);
    });

    let currentSlideIndex = 0;
    sliderInterval = setInterval(() => {
        currentSlideIndex++;
        if (currentSlideIndex >= newsBanners.length) currentSlideIndex = 0;
        track.scrollTo({ left: track.offsetWidth * currentSlideIndex, behavior: 'smooth' });
    }, 5000);

    track.onscroll = () => {
        const index = Math.round(track.scrollLeft / track.offsetWidth);
        const dots = dotsContainer.querySelectorAll(".dot-node");
        dots.forEach((d, i) => {
            if (i === index) d.classList.add("active-dot");
            else d.classList.remove("active-dot");
        });
        currentSlideIndex = index;
    };
}

// সরাসরি ফাইল/পিকচার হ্যান্ডলিং ডেমো ইন্টিগ্রেশন (লিংক ব্যাকআপ সহ লজিক প্রটেকশন)
function submitNewBannerData() {
    const fileInput = document.getElementById("news-file-input");
    let urlInput = document.getElementById("news-img-url-input").value.trim();
    const captionInput = document.getElementById("news-caption-input").value.trim();

    // যদি ফাইল আপলোড করা থাকে তবে ফায়ারবেসে টেস্ট করার জন্য ডেমো প্লেসহোল্ডার ইমেজিং রিড করা হবে
    if (fileInput && fileInput.files.length > 0) {
        urlInput = URL.createObjectURL(fileInput.files[0]); 
    }

    if (urlInput === "") { alert("দয়া করে একটি ছবি ফাইল সিলেক্ট করুন অথবা ইমেজ লিংক দিন!"); return; }

    const newNewsRef = window.fbPush(window.fbRef(window.fbDatabase, 'news'));
    window.fbSet(newNewsRef, {
        imgUrl: urlInput,
        caption: captionInput
    }).then(() => {
        alert("নিউজ ব্যানারটি সফলভাবে পাবলিশ হয়েছে!");
        if(fileInput) fileInput.value = "";
        document.getElementById("news-img-url-input").value = "";
        document.getElementById("news-caption-input").value = "";
        closeAdminNewsModal();
    }).catch((err) => {
        alert("নিউজ আপলোড করতে সমস্যা হয়েছে: " + err.message);
    });
}

function deleteNewsBanner(id) {
    if (confirm("আপনি কি এই ব্যানার নোটিশটি ওয়েবসাইট থেকে মুছে ফেলতে চান?")) {
        window.fbRemove(window.fbRef(window.fbDatabase, `news/${id}`));
    }
}

// ==========================================================================
// ২. ভাষা ও হেডিং নো-লিমিট আপডেট লজিক
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
    const mainTitle = document.getElementById("main-section-title");
    
    if (currentLanguage === "bn") {
        if (pTitle) pTitle.innerHTML = '<i class="fas fa-users"></i> প্লেয়ারদের জন্য নিয়মাবলী';
        if (tTitle) tTitle.innerHTML = '<i class="fas fa-cogs"></i> টুর্নামেন্ট সিস্টেম';
        if (mainTitle) mainTitle.textContent = "টুর্নামেন্ট মোড সিলেক্ট করুন";
    } else {
        if (pTitle) pTitle.innerHTML = '<i class="fas fa-users"></i> Players Rules';
        if (tTitle) tTitle.innerHTML = '<i class="fas fa-cogs"></i> Tournament System';
        if (mainTitle) mainTitle.textContent = "CHOOSE A GAME MODE";
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
// ৩. অ্যাডমিন লগইন এবং অথেন্টিকেশন (আপডেটেড প্যারালাল বাটন ইন্টারফেস ফিক্স)
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
    const actionBtn = document.getElementById("admin-action-toggle-btn");
    const modeBadge = document.getElementById("admin-mode-badge");
    const newsTrigger = document.getElementById("admin-news-upload-trigger");
    const adminRulesControls = document.getElementById("admin-rules-controls");
    const adminSystemControls = document.getElementById("admin-system-controls");
    const adminViews = document.querySelectorAll(".admin-only-view");

    if (isLoggedIn) {
        if(actionBtn) {
            actionBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
            actionBtn.style.backgroundColor = "#ff5252";
        }
        if(modeBadge) {
            modeBadge.textContent = "Admin Mode";
            modeBadge.style.backgroundColor = "#238636";
        }
        if(newsTrigger) newsTrigger.style.display = "flex";
        if(adminRulesControls) adminRulesControls.style.display = "flex";
        if(adminSystemControls) adminSystemControls.style.display = "flex";
        adminViews.forEach(el => el.style.display = "flex");
    } else {
        if(actionBtn) {
            actionBtn.innerHTML = '<i class="fas fa-lock"></i> Admin Login';
            actionBtn.style.backgroundColor = "#238636";
        }
        if(modeBadge) {
            modeBadge.textContent = "Viewer Mode";
            modeBadge.style.backgroundColor = "#111";
        }
        if(newsTrigger) newsTrigger.style.display = "none";
        if(adminRulesControls) adminRulesControls.style.display = "none";
        if(adminSystemControls) adminSystemControls.style.display = "none";
        adminViews.forEach(el => el.style.display = "none");
    }
}

function updateInputFields() {
    const adminRulesControls = document.getElementById("admin-rules-controls");
    const adminSystemControls = document.getElementById("admin-system-controls");
    
    if(adminRulesControls) {
        adminRulesControls.innerHTML = `
            <textarea id="new-rule-bn" placeholder="এখানে বড় নিয়মের আনলিমিটেড লেখা লিখুন..." rows="2" style="width:100%; background:#000; color:#fff; padding:8px; border:1px solid #1a1a1a; border-radius:6px;"></textarea>
            <button onclick="addNewRule('players')"><i class="fas fa-plus"></i> Add Rules</button>
        `;
    }
    if(adminSystemControls) {
        adminSystemControls.innerHTML = `
            <textarea id="new-sys-bn" placeholder="এখানে বড় সিস্টেম গাইডের আনলিমিটেড লেখা লিখুন..." rows="2" style="width:100%; background:#000; color:#fff; padding:8px; border:1px solid #1a1a1a; border-radius:6px;"></textarea>
            <button onclick="addNewRule('system')"><i class="fas fa-plus"></i> Add System</button>
        `;
    }
}

async function addNewRule(type) {
    let inputId = (type === 'players') ? "new-rule-bn" : "new-sys-bn";
    const bnInput = document.getElementById(inputId).value.trim();
    if (bnInput === "") { alert("দয়া করে কিছু লিখুন!"); return; }

    try {
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(bnInput)}&langpair=bn|en`);
        const data = await res.json();
        let enTranslation = data.responseData.translatedText;

        const newRef = window.fbPush(window.fbRef(window.fbDatabase, `rules/${type}`));
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

function deleteRule(type, id) {
    if (confirm("আপনি কি এটি ফায়ারবেস ডাটাবেজ এবং ওয়েবসাইট থেকে চিরতরে মুছে ফেলতে চান?")) {
        window.fbRemove(window.fbRef(window.fbDatabase, `rules/${type}/${id}`));
    }
}

function renderRules() {
    const playersListUl = document.getElementById("players-rules-list");
    const systemListUl = document.getElementById("tour-system-list");
    const isAdmin = localStorage.getItem("isAdminLoggedIn") === "true";

    if(!playersListUl || !systemListUl) return;

    playersListUl.innerHTML = "";
    systemListUl.innerHTML = "";

    playersRules.forEach((rule) => {
        const li = document.createElement("li");
        li.textContent = currentLanguage === "bn" ? rule.bn : rule.en;
        if (isAdmin) {
            li.innerHTML += ` <button class="delete-rule-btn" onclick="deleteRule('players', '${rule.id}')"><i class="fas fa-trash"></i></button>`;
        }
        playersListUl.appendChild(li);
    });

    tournamentSystems.forEach((sys) => {
        const li = document.createElement("li");
        li.textContent = currentLanguage === "bn" ? sys.bn : sys.en;
        if (isAdmin) {
            li.innerHTML += ` <button class="delete-rule-btn" onclick="deleteRule('system', '${sys.id}')"><i class="fas fa-trash"></i></button>`;
        }
        systemListUl.appendChild(li);
    });
}

// গ্লোবাল অবজেক্ট বাইন্ডিং
window.addNewRule = addNewRule;
window.deleteRule = deleteRule;
window.toggleLanguage = toggleLanguage;
window.handleAdminAuth = handleAdminAuth;
window.switchAppView = switchAppView;
window.toggleHamburgerMenu = toggleHamburgerMenu;
window.handleClubMembersClick = handleClubMembersClick;
window.openAdminNewsModal = openAdminNewsModal;
window.closeAdminNewsModal = closeAdminNewsModal;
window.submitNewBannerData = submitNewBannerData;
window.deleteNewsBanner = deleteNewsBanner;
window.openPlayerRegistration = openPlayerRegistration;
window.closePlayerRegistration = closePlayerRegistration;