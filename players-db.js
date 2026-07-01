// ==========================================================================
// ⚽ Blades of Vengeance - Global Player Database & Core Engine
// ==========================================================================
let allRegisteredPlayers = {};

// পেজ লোড হওয়ার পর প্লেয়ার ডাটা লিসেনিং শুরু হবে
window.addEventListener('DOMContentLoaded', () => {
    listenToFirebasePlayers();
});

// ==========================================================================
// ১. ফায়ারবেস থেকে প্লেয়ার ডাটা রিয়েল-টাইম ট্র্যাকিং (১০০% ইনট্যাক্ট লজিক)
// ==========================================================================
function listenToFirebasePlayers() {
    if (!window.fbDatabase || !window.fbOnValue || !window.fbRef) {
        console.error("Firebase কনফিগারেশন এখনো লোড হয়নি।");
        return;
    }

    const playersRef = window.fbRef(window.fbDatabase, 'players_database');
    window.fbOnValue(playersRef, (snapshot) => {
        allRegisteredPlayers = snapshot.val() || {};
        renderAllTeamsGrids();
    });
}

// ==========================================================================
// 📂 ছোট টিম বারগুলোর কলাপসিবল (Open/Close) টগল ইঞ্জিন
// ==========================================================================
function toggleTeamCollapse(contentId) {
    const content = document.getElementById(contentId);
    const header = content.parentElement.querySelector('.team-bar-header');
    const arrow = header.querySelector('.arrow-icon');
    
    if(content) {
        content.classList.toggle("show-content");
        if(content.classList.contains("show-content")) {
            arrow.style.transform = "rotate(180deg)";
        } else {
            arrow.style.transform = "rotate(0deg)";
        }
    }
}

// ==========================================================================
// 🆔 ২. রিয়েল প্লেয়ার রেজিস্ট্রেশন মেকানিজম (নতুন ৩টি ফিল্ড সহ)
// ==========================================================================
function handleRealPlayerRegistration() {
    const name = document.getElementById("reg-player-name").value.trim();
    const efootballId = document.getElementById("reg-efootball-id").value.trim();
    const device = document.getElementById("reg-device-name").value.trim();
    const fbLink = document.getElementById("reg-fb-link").value.trim();
    const fileInput = document.getElementById("reg-player-pic-file");
    let picUrl = document.getElementById("reg-player-pic-url").value.trim();

    if (name === "" || efootballId === "" || device === "") {
        alert("দয়া করে Player Name, eFootball ID এবং Device Name বাধ্যতামূলকভাবে পূরণ করুন!");
        return;
    }

    // লোকাল ফাইল সিলেক্ট করা থাকলে ওটার অবজেক্ট ইউআরএল তৈরি করবে
    if (fileInput && fileInput.files.length > 0) {
        picUrl = URL.createObjectURL(fileInput.files[0]);
    }
    if (picUrl === "") {
        picUrl = "https://via.placeholder.com/150/050505/ffffff?text=BOV+Player";
    }

    // ফায়ারবেস পাথ সেফটির জন্য eFootball ID-র স্পেশাল ক্যারেক্টার স্যানিটাইজেশন
    const sanitizedId = efootballId.replace(/[\.#\$\[\]]/g, "-");
    const playerNodeRef = window.fbRef(window.fbDatabase, `players_database/${sanitizedId}`);
    
    // যেকোনো নতুন প্লেয়ার রেজিস্টার্ড হলে ডিফল্টভাবে Worldwide-এ ট্রু (True) থাকবে
    window.fbSet(playerNodeRef, {
        name: name,
        efootballId: efootballId,
        device: device,
        fbLink: fbLink || "#",
        picUrl: picUrl,
        isMainTeam: false,
        isAcademyTeam: false,
        isWorldwide: true
    }).then(() => {
        alert(`প্লেয়ার সফলভাবে রেজিস্টার্ড হয়েছে!\nMain ID: ${efootballId}`);
        closePlayerRegistration();
        
        // ফর্ম ইনপুট রিসেট
        document.getElementById("reg-player-name").value = "";
        document.getElementById("reg-efootball-id").value = "";
        document.getElementById("reg-device-name").value = "";
        document.getElementById("reg-fb-link").value = "";
        document.getElementById("reg-player-pic-url").value = "";
        if(fileInput) fileInput.value = "";
    }).catch(err => {
        alert("ডাটা সেভ করতে প্রবলেম হয়েছে: " + err.message);
    });
}

// ==========================================================================
// 🪪 ৩. স্মল মিনি আইডি কার্ড (Mini ID Cards) রেন্ডারিং ইঞ্জিন
// ==========================================================================
function renderAllTeamsGrids() {
    const mainGrid = document.getElementById("main-team-cards-grid");
    const academyGrid = document.getElementById("academy-team-cards-grid");
    const worldwideGrid = document.getElementById("worldwide-team-cards-grid");

    if (!mainGrid || !academyGrid || !worldwideGrid) return;

    mainGrid.innerHTML = "";
    academyGrid.innerHTML = "";
    worldwideGrid.innerHTML = "";

    Object.keys(allRegisteredPlayers).forEach(key => {
        const player = allRegisteredPlayers[key];
        
        // ছোট মিনি আইডি কার্ড লেআউট (পিক, নাম এবং ই-ফুটবল আইডি শো করবে)
        const miniCardHtml = `
            <div class="mini-player-id-card" onclick="openPlayerDetailsCard('${key}')">
                <img src="${player.picUrl}" class="mini-avatar-node" alt="Avatar">
                <div class="mini-card-name">${player.name}</div>
                <div class="mini-card-uid">ID: ${player.efootballId}</div>
            </div>
        `;

        // কন্ডিশনাল ম্যাপিং লজিক: একটি প্লেয়ার একই সাথে ৩ ক্যাটাগরিতেই শো করতে পারবে
        if (player.isMainTeam) mainGrid.innerHTML += miniCardHtml;
        if (player.isAcademyTeam) academyGrid.innerHTML += miniCardHtml;
        if (player.isWorldwide) worldwideGrid.innerHTML += miniCardHtml;
    });

    // ডাটা না থাকলে এম্পটি প্লেসহোল্ডার মেসেজ সেট
    if (mainGrid.innerHTML === "") mainGrid.innerHTML = "<p style='color:#555; font-size:0.85rem; padding:10px;'>No players in Main Team.</p>";
    if (academyGrid.innerHTML === "") academyGrid.innerHTML = "<p style='color:#555; font-size:0.85rem; padding:10px;'>No players in Academy Team.</p>";
    if (worldwideGrid.innerHTML === "") worldwideGrid.innerHTML = "<p style='color:#555; font-size:0.85rem; padding:10px;'>No players registered yet.</p>";
}

// ==========================================================================
// 🔍 ৪. আইডি সার্চ ফিল্টার এবং মেইন/একাডেমি টিমে প্লেয়ার অ্যাড করার ইঞ্জিন
// ==========================================================================
function addPlayerToTeam(teamType) {
    const inputId = teamType === 'main' ? "search-main-input" : "search-academy-input";
    const searchId = document.getElementById(inputId).value.trim();
    if (searchId === "") return;

    // eFootball ID-কে পাথ কি (Key) তে রূপান্তর
    const sanitizedKey = searchId.replace(/[\.#\$\[\]]/g, "-");
    
    if (!allRegisteredPlayers[sanitizedKey]) {
        alert("এই eFootball ID-র কোনো প্লেয়ার ডাটাবেজে রেজিস্টার্ড নেই!\nদয়া করে আগে ৩-বার মেনু থেকে প্লেয়ারটিকে রেজিস্টার করুন।");
        return;
    }

    const pathNode = teamType === 'main' ? 'isMainTeam' : 'isAcademyTeam';
    const targetRef = window.fbRef(window.fbDatabase, `players_database/${sanitizedKey}/${pathNode}`);
    
    window.fbSet(targetRef, true).then(() => {
        alert(`প্লেয়ারকে সফলভাবে ${teamType === 'main' ? 'Main Team' : 'Academy Team'}-এ যুক্ত করা হয়েছে!`);
        document.getElementById(inputId).value = "";
    }).catch(err => alert("অ্যাড করতে প্রবলেম হয়েছে: " + err.message));
}

// ==========================================================================
// ℹ️ ৫. মিনি কার্ডে ক্লিক করলে প্রোফাইল মডাল ভিউ (উইন্ডো ডিটেইলস পপআপ)
// ==========================================================================
function openPlayerDetailsCard(playerKey) {
    const player = allRegisteredPlayers[playerKey];
    if (!player) return;

    const modal = document.getElementById("player-details-modal");
    const container = document.getElementById("player-details-view-target");
    const isAdmin = localStorage.getItem("isAdminLoggedIn") === "true";

    // অ্যাডমিন অ্যাকশন কন্ট্রোল বোতাম (Add/Remove & Permanent Delete Worldwide)
    let adminButtons = "";
    if (isAdmin) {
        adminButtons = `
            <div class="card-admin-action-row">
                ${player.isMainTeam ? `<button class="btn-remove-action" style="background:#ffa657;" onclick="removePlayerFromSpecificTeam('${playerKey}', 'main')">Remove Main</button>` : ''}
                ${player.isAcademyTeam ? `<button class="btn-remove-action" style="background:#ffa657;" onclick="removePlayerFromSpecificTeam('${playerKey}', 'academy')">Remove Academy</button>` : ''}
                <button class="btn-remove-action" onclick="permanentDeletePlayer('${playerKey}')"><i class="fas fa-trash-alt"></i> Delete Worldwide</button>
            </div>
        `;
    }

    // প্রোফাইল মডালের ভেতরের ইন্টারেক্টিভ লেআউট (ফেসবুক আইকন সহ)
    container.innerHTML = `
        <img src="${player.picUrl}" class="details-avatar-frame" alt="Avatar">
        <h2 style="font-size:1.3rem; margin-top:5px;" class="neon-text-blue">${player.name}</h2>
        
        <div class="details-info-table">
            <div class="info-row-item"><span>eFootball ID (Main):</span> <span>${player.efootballId}</span></div>
            <div class="info-row-item"><span>Device Model:</span> <span>${player.device}</span></div>
            <div class="info-row-item">
                <span>Facebook Link:</span> 
                <span>
                    <a href="${player.fbLink}" target="_blank" class="fb-link-icon-btn">
                        <i class="fab fa-facebook-f"></i>
                    </a>
                </span>
            </div>
        </div>
        ${adminButtons}
    `;
    
    if (modal) modal.style.display = "flex";
}

function closePlayerDetailsModal() {
    const modal = document.getElementById("player-details-modal");
    if (modal) modal.style.display = "none";
}

// নির্দিষ্ট টিম থেকে প্লেয়ার বাদ দেওয়া (ফায়ারবেস স্টেট আপডেট)
function removePlayerFromSpecificTeam(playerKey, teamType) {
    if (confirm(`আপনি কি এই প্লেয়ারকে এই নির্দিষ্ট টিম থেকে রিমুভ করতে চান?`)) {
        const pathNode = teamType === 'main' ? 'isMainTeam' : 'isAcademyTeam';
        const targetRef = window.fbRef(window.fbDatabase, `players_database/${playerKey}/${pathNode}`);
        
        window.fbSet(targetRef, false).then(() => {
            closePlayerDetailsModal();
        });
    }
}

// ৬. ওয়ার্ল্ডওয়াইড গ্লোবাল তালিকা থেকে প্লেয়ারকে চিরতরে ডিলিট করার মেকানিজম
function permanentDeletePlayer(playerKey) {
    if (confirm("🚨 সাবধান!\nআপনি কি এই প্লেয়ারকে ওয়ার্ল্ডওয়াইড ডাটাবেজ এবং ওয়েবসাইট থেকে সম্পূর্ণ মুছে ফেলতে চান?")) {
        const playerRef = window.fbRef(window.fbDatabase, `players_database/${playerKey}`);
        window.fbRemove(playerRef).then(() => {
            alert("প্লেয়ার ডাটাবেজ থেকে চিরতরে ডিলিট করা হয়েছে।");
            closePlayerDetailsModal();
        }).catch(err => alert("মুছে ফেলতে সমস্যা হয়েছে: " + err.message));
    }
}

// ==========================================================================
// 🚀 গ্লোবাল স্কোপ উইন্ডো ম্যাপিং
// ==========================================================================
window.toggleTeamCollapse = toggleTeamCollapse;
window.handleRealPlayerRegistration = handleRealPlayerRegistration;
window.addPlayerToTeam = addPlayerToTeam;
window.openPlayerDetailsCard = openPlayerDetailsCard;
window.closePlayerDetailsModal = closePlayerDetailsModal;
window.removePlayerFromSpecificTeam = removePlayerFromSpecificTeam;
window.permanentDeletePlayer = permanentDeletePlayer;