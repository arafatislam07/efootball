// ==========================================================================
// ১. গ্লোবাল স্টেট এবং ইউসিএল ডাটা স্ট্রাকচার
// ==========================================================================
let wcTournaments = JSON.parse(localStorage.getItem("efootballUclTournaments")) || [];
let currentWcId = null;
let currentEditingWcMatch = null;
let isAdminLoggedIn = localStorage.getItem("isAdminLoggedIn") === "true";

// 👕 [ইন্টারন্যাশনাল জার্সি কালার থিম]
const NAT_JERSEY_STYLES = {
    "Argentina": { color: "#388bfd", textShadow: "1px 1px #ffffff" },
    "Brazil": { color: "#ffcc00", textShadow: "1px 1px #008000" },
    "France": { color: "#000080", textShadow: "1px 1px #ffffff" },
    "Portugal": { color: "#ff3333", textShadow: "1px 1px #008000" },
    "Germany": { color: "#ffffff", textShadow: "1px 1px #000000" },
    "Spain": { color: "#cc0000", textShadow: "1px 1px #ffcc00" },
    "Italy": { color: "#0055ff", textShadow: "1px 1px #ffffff" },
    "England": { color: "#ffffff", textShadow: "1px 1px #cc0000" },
    "Croatia": { color: "#ff3333", textShadow: "2px 2px #ffffff" },
    "Morocco": { color: "#006633", textShadow: "1px 1px #cc0000" },
    "Japan": { color: "#002266", textShadow: "1px 1px #ff3333" },
    "Uruguay": { color: "#75b2dd", textShadow: "1px 1px #ffffff" },
    "TBD": { color: "#8b949e", textShadow: "none" }
};

const NAT_TEAMS_LIST = Object.keys(NAT_JERSEY_STYLES).filter(k => k !== "TBD");
const TIME_SLOTS = ["10:30 PM", "11:00 PM", "11:30 PM", "12:00 AM"];
const WEEK_DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

window.onload = function() {
    renderWcList();
    updateWcAdminUI();
};

function updateWcAdminUI() {
    const indicator = document.getElementById("admin-indicator");
    const createBtn = document.getElementById("show-create-form-btn");
    if (indicator) indicator.textContent = isAdminLoggedIn ? "Admin Mode" : "Viewer Mode";
    if (createBtn) createBtn.style.display = isAdminLoggedIn ? "block" : "none";
}

function toggleCreateForm() {
    const createSec = document.getElementById("create-wc-section");
    if (!createSec) return;

    if (createSec.style.display === "none" || createSec.style.display === "") {
        createSec.style.position = "fixed";
        createSec.style.top = "0";
        createSec.style.left = "0";
        createSec.style.width = "100vw";
        createSec.style.height = "100vh";
        createSec.style.zIndex = "9999";
        createSec.style.backgroundColor = "rgba(10, 14, 20, 0.85)"; 
        createSec.style.backdropFilter = "blur(4px)";
        createSec.style.display = "flex";
        createSec.style.justifyContent = "center";
        createSec.style.alignItems = "stretch";
        createSec.style.padding = "0px";
        createSec.style.boxSizing = "border-box";

        createSec.style.width = "100%";
        createSec.style.maxWidth = "1100px"; 
        createSec.style.height = "100vh";    
        createSec.style.maxHeight = "100vh";
        createSec.style.overflowY = "auto";  
        createSec.style.backgroundColor = "#151922"; 
        createSec.style.padding = "35px 40px"; 
        createSec.style.borderRadius = "0px";  
        createSec.style.borderLeft = "1px solid #21262d"; 
        createSec.style.borderRight = "1px solid #21262d"; 
        createSec.style.boxShadow = "0 0 40px rgba(0, 0, 0, 0.7)";
        createSec.style.flexDirection = "column";
        createSec.style.justifyContent = "flex-start";
        createSec.style.margin = "0 auto";

        const secHeader = createSec.querySelector('.section-header');
        if (secHeader) {
            secHeader.style.display = "flex";
            secHeader.style.justifyContent = "space-between";
            secHeader.style.alignItems = "center";
            secHeader.style.width = "100%";
            secHeader.style.marginBottom = "25px";
            secHeader.style.borderBottom = "1px solid #21262d";
            secHeader.style.paddingBottom = "15px";
        }
    } else {
        createSec.style.display = "none";
        clearWcFormInputs();
    }
}

function clearWcFormInputs() {
    document.getElementById("wc-name-input").value = "";
    document.getElementById("messenger-link-input").value = "";
    document.getElementById("prize-entry").value = "";
    document.getElementById("prize-total").value = "";
    document.getElementById("prize-1st").value = "";
    document.getElementById("prize-2nd").value = "";
    document.getElementById("prize-scorer").value = "";
    document.getElementById("players-bulk-input").value = "";
    Array.from(document.querySelectorAll('input[name="wc-days"]')).forEach(cb => cb.checked = false);
}

// ==========================================================================
// ২. UCL ডাবল রাউন্ড রবিন হোম-অ্যাওয়ে জেনারেশন ENGINE
// ==========================================================================
function generateUclTournament() {
    const name = document.getElementById("wc-name-input").value.trim();
    const messenger = document.getElementById("messenger-link-input").value.trim();
    const pEntry = document.getElementById("prize-entry").value.trim() || "Free";
    const pTotal = document.getElementById("prize-total").value || "0";
    const p1st = document.getElementById("prize-1st").value || "0";
    const p2nd = document.getElementById("prize-2nd").value || "0";
    const pScorer = document.getElementById("prize-scorer").value || "0";
    
    const checkedDays = Array.from(document.querySelectorAll('input[name="wc-days"]:checked')).map(cb => parseInt(cb.value));
    const bulkText = document.getElementById("players-bulk-input").value.trim();

    if (!name) { alert("দয়া করে টুর্নামেন্টের নাম লিখুন!"); return; }
    if (checkedDays.length === 0) { alert("সপ্তাহে কমপক্ষে ১টি খেলার দিন সিলেক্ট করুন!"); return; }
    
    let players = bulkText.split('\n').map(p => p.replace(/^\d+[\.\s\-)]*/, '').trim()).filter(p => p !== "");
    const totalP = players.length;

    if (totalP % 4 !== 0 || totalP < 4) {
        alert("ভুল প্লেয়ার সংখ্যা! UCL মোড শুরু করতে প্লেয়ার সংখ্যা অবশ্যই ৪ এর গুণিতক হতে হবে।");
        return;
    }

    players.sort(() => Math.random() - 0.5);
    let shuffledNations = [...NAT_TEAMS_LIST].sort(() => Math.random() - 0.5);

    let playerNations = { "TBD": "TBD" };
    players.forEach((p, idx) => {
        playerNations[p] = shuffledNations[idx % shuffledNations.length];
    });

    let groups = {};
    const numGroups = totalP / 4;
    for(let i=0; i<numGroups; i++) {
        let groupLetter = String.fromCharCode(65 + i);
        groups[groupLetter] = players.slice(i * 4, (i + 1) * 4);
    }

    let fixtures = [];
    let currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 1);

    let displayRoundCounter = 1;

    // UCL গ্রুপ পর্ব - ডাবল রাউন্ড রবিন (৬টি লেগ)
    for (let round = 0; round < 6; round++) {
        let tempAllMatches = [];

        Object.keys(groups).forEach(gLetter => {
            let gp = groups[gLetter];
            let pairs = [];
            if (round === 0) pairs = [[0, 1], [2, 3]];
            else if (round === 1) pairs = [[0, 2], [1, 3]];
            else if (round === 2) pairs = [[0, 3], [1, 2]];
            else if (round === 3) pairs = [[1, 0], [3, 2]]; 
            else if (round === 4) pairs = [[2, 0], [3, 1]];
            else if (round === 5) pairs = [[3, 0], [2, 1]];

            pairs.forEach(pair => {
                tempAllMatches.push({
                    id: `ucl-m-${round}-${gLetter}-${Date.now()}-${Math.random()}`,
                    group: gLetter,
                    stage: "Group Stage",
                    home: gp[pair[0]],
                    away: gp[pair[1]],
                    homeScore: null, awayScore: null,
                    homePoss: null, awayPoss: null,
                    homePenalty: null, awayPenalty: null,
                    played: false
                });
            });
        });

        const matchesPerDay = 8;
        for (let k = 0; k < tempAllMatches.length; k += matchesPerDay) {
            let daySlice = tempAllMatches.slice(k, k + matchesPerDay);
            
            while (!checkedDays.includes(currentDate.getDay())) {
                currentDate.setDate(currentDate.getDate() + 1);
            }
            let dateStr = WEEK_DAYS_SHORT[currentDate.getDay()] + ", " + currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            daySlice.forEach((m, slotIdx) => {
                m.timeSlot = TIME_SLOTS[slotIdx % TIME_SLOTS.length];
            });

            fixtures.push({
                matchday: displayRoundCounter,
                date: dateStr,
                stage: "Group Stage",
                matches: daySlice
            });
            displayRoundCounter++;
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }

    // UCL নকআউট ব্র্যাকেট প্রি-জেনারেশন ইঞ্জিন
    let qualifiedCount = numGroups * 2; 
    let koStagesConfig = [];

    if (qualifiedCount === 16) koStagesConfig = ["Round of 16", "Quarter-Finals", "Semi-Finals", "Final"];
    else if (qualifiedCount === 8) koStagesConfig = ["Quarter-Finals", "Semi-Finals", "Final"];
    else if (qualifiedCount === 4) koStagesConfig = ["Semi-Finals", "Final"];
    else if (qualifiedCount === 2) koStagesConfig = ["Final"];

    koStagesConfig.forEach(stageName => {
        let matchesInStage = 0;
        if (stageName === "Round of 16") matchesInStage = 8;
        else if (stageName === "Quarter-Finals") matchesInStage = 4;
        else if (stageName === "Semi-Finals") matchesInStage = 2;
        else if (stageName === "Final") matchesInStage = 1;

        let loopLegs = (stageName === "Final") ? 1 : 2;

        for (let leg = 1; leg <= loopLegs; leg++) {
            let stageMatches = [];
            let currentStageTitle = (stageName === "Final") ? "Final" : `${stageName} - Leg ${leg}`;

            for (let i = 0; i < matchesInStage; i++) {
                stageMatches.push({
                    id: `ucl-ko-${stageName}-${leg}-${i}-${Date.now()}`,
                    group: "KO",
                    stage: currentStageTitle,
                    home: "TBD",
                    away: "TBD",
                    homeScore: null, awayScore: null,
                    homePoss: null, awayPoss: null,
                    homePenalty: null, awayPenalty: null,
                    played: false
                });
            }

            const matchesPerDay = 8;
            for (let k = 0; k < stageMatches.length; k += matchesPerDay) {
                let daySlice = stageMatches.slice(k, k + matchesPerDay);

                while (!checkedDays.includes(currentDate.getDay())) {
                    currentDate.setDate(currentDate.getDate() + 1);
                }
                let dateStr = WEEK_DAYS_SHORT[currentDate.getDay()] + ", " + currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                daySlice.forEach((m, slotIdx) => {
                    m.timeSlot = TIME_SLOTS[slotIdx % TIME_SLOTS.length];
                });

                fixtures.push({
                    matchday: displayRoundCounter,
                    date: dateStr,
                    stage: currentStageTitle,
                    matches: daySlice
                });
                displayRoundCounter++;
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
    });

    const newWc = {
        id: 'ucl-' + Date.now(),
        name: name,
        messenger: messenger || "#",
        prizes: { entryFee: pEntry, total: pTotal, first: p1st, second: p2nd, scorer: pScorer },
        players: players,
        playerNations: playerNations,
        selectedDays: checkedDays,
        currentStage: "Group Stage",
        groups: groups,
        fixtures: fixtures
    };

    wcTournaments.push(newWc);
    localStorage.setItem("efootballUclTournaments", JSON.stringify(wcTournaments));
    toggleCreateForm();
    renderWcList();
}

// ==========================================================================
// ৩. টুর্নামেন্ট কার্ড রেন্ডারার
// ==========================================================================
function renderWcList() {
    const grid = document.getElementById("active-leagues-grid");
    if (!grid) return;
    grid.innerHTML = "";

    if (wcTournaments.length === 0) {
        grid.innerHTML = "<p style='color: #8b949e; grid-column: 1/-1;'>কোনো UCL টুর্নামেন্ট সচল নেই।</p>";
        return;
    }

    wcTournaments.forEach(wc => {
        const card = document.createElement("div");
        card.className = "league-card";
        card.setAttribute("onclick", `openWc('${wc.id}')`);

        let daysLabel = wc.selectedDays.map(d => WEEK_DAYS_SHORT[d]).join(", ");
        let fee = wc.prizes.entryFee === "Free" || isNaN(wc.prizes.entryFee) ? wc.prizes.entryFee : "৳" + wc.prizes.entryFee;

        card.innerHTML = `
            <div>
                <h3><i class="fas fa-star" style="color: #f2ca22;"></i> ${wc.name}</h3>
                <div class="league-card-meta">
                    <p><i class="fas fa-users" style="color: #58a6ff;"></i> Total Players: <strong>${wc.players.length}</strong></p>
                    <p><i class="fas fa-ticket-alt" style="color: #ffaa47;"></i> Entry Fee: <strong>${fee}</strong></p>
                    <p><i class="fas fa-calendar-alt" style="color: #ff7b72;"></i> Days: <strong>${daysLabel}</strong></p>
                    <p><i class="fas fa-wallet" style="color: #238636;"></i> Total Prize: <strong>৳${wc.prizes.total}</strong></p>
                </div>
            </div>
            <div class="card-prize-highlight">
                <div style="color: #ffd700; margin-bottom: 2px;"><i class="fas fa-crown"></i> Champion: ৳${wc.prizes.first}</div>
                <div style="color: #c0c0c0; margin-bottom: 2px;"><i class="fas fa-medal"></i> Runner-up: ৳${wc.prizes.second}</div>
                <div style="color: #ff7b72;"><i class="fas fa-shoe-prints"></i> Top Scorer: ৳${wc.prizes.scorer}</div>
            </div>
        `;

        if (isAdminLoggedIn) {
            const delBtn = document.createElement("button");
            delBtn.className = "delete-tournament-btn";
            delBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
            delBtn.onclick = function(e) {
                e.stopPropagation();
                if(confirm("এই UCL টুর্নামেন্টটি ডিলিট করতে চান?")) {
                    wcTournaments = wcTournaments.filter(w => w.id !== wc.id);
                    localStorage.setItem("efootballUclTournaments", JSON.stringify(wcTournaments));
                    renderWcList();
                }
            };
            card.appendChild(delBtn);
        }
        grid.appendChild(card);
    });
}

function openWc(id) {
    currentWcId = id;
    const wc = wcTournaments.find(w => w.id === id);
    if (!wc) return;

    document.getElementById("league-list-section").style.display = "none";
    document.getElementById("league-view-section").style.display = "block";
    document.getElementById("current-active-league-name").textContent = wc.name;
    document.getElementById("messenger-join-btn").href = wc.messenger;

    let fee = wc.prizes.entryFee === "Free" || isNaN(wc.prizes.entryFee) ? wc.prizes.entryFee : "৳" + wc.prizes.entryFee;
    document.getElementById("view-prize-entry").textContent = fee;
    document.getElementById("view-prize-total").textContent = "৳" + wc.prizes.total;
    document.getElementById("view-prize-1st").textContent = "৳" + wc.prizes.first;
    document.getElementById("view-prize-2nd").textContent = "৳" + wc.prizes.second;
    document.getElementById("view-prize-scorer").textContent = "৳" + wc.prizes.scorer;

    switchWcTab('table');
}

function backToLeagueList() {
    document.getElementById("league-list-section").style.display = "block";
    document.getElementById("league-view-section").style.display = "none";
    currentWcId = null;
}

function switchWcTab(tab) {
    const tableBtn = document.getElementById("tab-table-btn");
    const matchesBtn = document.getElementById("tab-matches-btn");
    const resultBtn = document.getElementById("tab-result-btn");
    
    const tableContent = document.getElementById("tab-table-content");
    const matchesContent = document.getElementById("tab-matches-content");
    const resultContent = document.getElementById("tab-result-content");

    tableBtn.classList.remove("active"); matchesBtn.classList.remove("active"); resultBtn.classList.remove("active");
    tableContent.style.display = "none"; matchesContent.style.display = "none"; resultContent.style.display = "none";

    if (tab === 'table') {
        tableBtn.classList.add("active"); tableContent.style.display = "block";
        calculateWcGroups();
    } else if (tab === 'matches') {
        matchesBtn.classList.add("active"); matchesContent.style.display = "block";
        renderWcFixtures();
    } else {
        resultBtn.classList.add("active"); resultContent.style.display = "block";
        calculateWcLiveResults();
    }
}

function calculateWcGroups() {
    const wc = wcTournaments.find(w => w.id === currentWcId);
    if (!wc) return;

    const container = document.getElementById("tab-table-content");
    container.innerHTML = "";

    Object.keys(wc.groups).forEach(gLetter => {
        let gPlayers = wc.groups[gLetter];
        let stats = {};
        gPlayers.forEach(p => { stats[p] = { name: p, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, totalPoss: 0, playedWithPoss: 0 }; });

        wc.fixtures.forEach(f => {
            if (f.stage === "Group Stage") {
                f.matches.forEach(m => {
                    if (m.group === gLetter && m.played) {
                        let h = m.home; let a = m.away;
                        let hs = parseInt(m.homeScore); let as = parseInt(m.awayScore);
                        let hp = parseFloat(m.homePoss || 0); let ap = parseFloat(m.awayPoss || 0);

                        stats[h].p++; stats[a].p++;
                        stats[h].gf += hs; stats[h].ga += as;
                        stats[a].gf += as; stats[a].ga += hs;

                        if (hp > 0 || ap > 0) {
                            stats[h].totalPoss += hp; stats[h].playedWithPoss++;
                            stats[a].totalPoss += ap; stats[a].playedWithPoss++;
                        }

                        if (hs > as) { stats[h].w++; stats[h].pts += 3; stats[a].l++; }
                        else if (hs < as) { stats[a].w++; stats[a].pts += 3; stats[h].l++; }
                        else { stats[h].d++; stats[h].pts += 1; stats[a].d++; stats[a].pts += 1; }
                    }
                });
            }
        });

        let sortedGroup = Object.values(stats).sort((a,b) => {
            if(b.pts !== a.pts) return b.pts - a.pts;
            let gdA = a.gf - a.ga; let gdB = b.gf - b.ga;
            if(gdB !== gdA) return gdB - gdA;
            return b.gf - a.gf;
        });

        let tableWrapper = document.createElement("div");
        tableWrapper.className = "table-responsive";
        tableWrapper.style.marginBottom = "30px";
        
        let html = `
            <h3 style="color: #00ffcc; margin-bottom: 10px;"><i class="fas fa-star"></i> UCL GROUP ${gLetter}</h3>
            <table class="standings-table">
                <thead>
                    <tr>
                        <th>Pos</th><th>Player</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Poss %</th><th>Pts</th>
                    </tr>
                </thead>
                <tbody>
        `;

        sortedGroup.forEach((p, idx) => {
            let nation = wc.playerNations[p.name] || "TBD";
            let jStyle = NAT_JERSEY_STYLES[nation] || { color: "#fff", textShadow: "none" };
            let avgP = p.playedWithPoss > 0 ? (p.totalPoss / p.playedWithPoss).toFixed(1) + "%" : "0.0%";
            let gd = p.gf - p.ga;

            html += `
                <tr>
                    <td>${idx + 1}</td>
                    <td style="text-align: left; font-weight: 600; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-tshirt" style="color: ${jStyle.color} !important; text-shadow: ${jStyle.textShadow} !important; font-size: 1.2rem;"></i>
                        <span>${p.name}</span>
                    </td>
                    <td>${p.p}</td><td>${p.w}</td><td>${p.d}</td><td>${p.l}</td>
                    <td>${p.gf}</td><td>${p.ga}</td>
                    <td style="color: ${gd > 0 ? '#58a6ff' : gd < 0 ? '#f85149' : '#c9d1d9'}">${gd > 0 ? '+' + gd : gd}</td>
                    <td>${avgP}</td>
                    <td style="font-weight: bold; color: #58a6ff;">${p.pts}</td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        tableWrapper.innerHTML = html;
        container.appendChild(tableWrapper);
    });

    checkAndPopulateUclKnockouts(wc);
}

// ==========================================================================
// ৫. ফিক্সচার লেআউট রেন্ডারিং (💡 FIXED: ২ কলাম এবং পাশাপাশি ডাবল বক্স লেআউট)
// ==========================================================================
function renderWcFixtures() {
    const container = document.getElementById("matchdays-container");
    if (!container) return;
    container.innerHTML = "";

    const wc = wcTournaments.find(w => w.id === currentWcId);
    if (!wc) return;

    wc.fixtures.forEach(f => {
        const block = document.createElement("div");
        block.className = "matchday-box";
        block.style.marginBottom = "30px"; // প্রতিটি ম্যাচডে-র মাঝে দূরত্ব
        
        // 💡 [FIXED: matches-grid-wrapper এ গ্রিড লেআউট সেট করা হলো]
        block.innerHTML = `
            <div class="matchday-header-bar" style="display:flex; justify-content:space-between; align-items:center; padding:10px 15px; background:#161b22; border-radius:6px; margin-bottom:15px; border:1px solid #21262d;">
                <span style="font-weight:bold; color:#00ffcc; font-size:1rem;"><i class="fas fa-star"></i> ${f.stage.includes('Leg') || f.stage === 'Final' ? f.stage : 'Group Matchday ' + f.matchday}</span>
                <span class="selected-days-badge" style="background:#21262d; border:1px solid #30363d; padding:5px 12px; border-radius:4px; font-size:0.85rem; color:#ffd700; font-weight:600;"><i class="far fa-calendar-alt"></i> ${f.date}</span>
            </div>
            <div class="matches-grid-wrapper" style="display:grid; grid-template-columns: repeat(2, 1fr); gap: 15px;"></div>
        `;
        container.appendChild(block);

        const grid = block.querySelector('.matches-grid-wrapper');
        f.matches.forEach(m => {
            const card = document.createElement("div");
            card.className = "match-card";
            // 💡 পাশাপাশি বক্সগুলো যেন দেখতে সুন্দর লাগে সেই স্টাইল
            card.style.cssText = `background:#0d1117; border:${m.played ? "1px solid #238636" : "1px solid #21262d"}; border-radius:8px; padding:15px; display:flex; justify-content:space-between; align-items:center; transition:0.3s;`;

            let homeNat = wc.playerNations[m.home] || "TBD";
            let awayNat = wc.playerNations[m.away] || "TBD";
            let jHome = NAT_JERSEY_STYLES[homeNat] || { color: "#fff" };
            let jAway = NAT_JERSEY_STYLES[awayNat] || { color: "#fff" };

            let hScoreText = m.played ? m.homeScore : "-";
            let aScoreText = m.played ? m.awayScore : "-";
            
            if (m.played && m.homePenalty !== null && m.awayPenalty !== null) {
                hScoreText += ` (${m.homePenalty})`;
                aScoreText += ` (${m.awayPenalty})`;
            }

            let pA = m.played ? `${m.homePoss}%` : "";
            let pB = m.played ? `${m.awayPoss}%` : "";

            card.innerHTML = `
                <div class="match-teams-block" style="display:flex; flex-direction:column; gap:12px; flex-grow:1;">
                    <div class="team-row-node" style="display:flex; justify-content:space-between; align-items:center;">
                        <div class="team-identity-wrapper" style="display:flex; align-items:center; gap:10px;">
                            <i class="fas fa-tshirt" style="color: ${jHome.color} !important; font-size:1.1rem;"></i>
                            <span class="team-player-name" style="font-weight:600; color:${m.home === 'TBD' ? '#8b949e' : '#c9d1d9'}">${m.home}</span>
                        </div>
                        <div class="team-score-wrapper" style="display:flex; gap:15px; align-items:center;">
                            <span style="font-size:0.75rem; color:#8b949e;">${pA}</span>
                            <span style="font-weight:bold; font-size:1.1rem; color:#58a6ff;">${hScoreText}</span>
                        </div>
                    </div>
                    <div class="team-row-node" style="display:flex; justify-content:space-between; align-items:center;">
                        <div class="team-identity-wrapper" style="display:flex; align-items:center; gap:10px;">
                            <i class="fas fa-tshirt" style="color: ${jAway.color} !important; font-size:1.1rem;"></i>
                            <span class="team-player-name" style="font-weight:600; color:${m.away === 'TBD' ? '#8b949e' : '#c9d1d9'}">${m.away}</span>
                        </div>
                        <div class="team-score-wrapper" style="display:flex; gap:15px; align-items:center;">
                            <span style="font-size:0.75rem; color:#8b949e;">${pB}</span>
                            <span style="font-weight:bold; font-size:1.1rem; color:#58a6ff;">${aScoreText}</span>
                        </div>
                    </div>
                </div>
                <div class="match-status-action-box" style="display:flex; flex-direction:column; align-items:flex-end; gap:6px; margin-left:15px; border-left:1px solid #21262d; padding-left:15px; min-width:60px;">
                    <span style="font-weight:bold; color: ${m.played ? '#ff7b72' : '#58a6ff'}; font-size:0.85rem;">${m.played ? 'FT' : m.timeSlot}</span>
                    ${isAdminLoggedIn && m.home !== "TBD" && m.away !== "TBD" ? `<button onclick="openWcScoreModal('${m.id}')" style="padding:4px 8px; background:#21262d; border:1px solid #30363d; color:#c9d1d9; border-radius:4px; cursor:pointer; font-size:0.75rem;"><i class="fas fa-edit"></i> Score</button>` : `<span style="font-size:0.75rem; color:#8b949e;">${m.played ? 'Finished' : 'Scheduled'}</span>`}
                </div>
            `;
            grid.appendChild(card);
        });
    });
}
// ==========================================================================
// 💡 ৬. ইউসিএল অফিসিয়াল নকআউট ইঞ্জিন: [ডায়নামিক টিবিডি আপডেট]
// ==========================================================================
function checkAndPopulateUclKnockouts(wc) {
    let allGroupMatchesPlayed = wc.fixtures.filter(f => f.stage === "Group Stage").every(f => f.matches.every(m => m.played));
    if (!allGroupMatchesPlayed) return;

    let groupWinners = {};
    Object.keys(wc.groups).forEach(gLetter => {
        let stats = {};
        wc.groups[gLetter].forEach(p => { stats[p] = { name: p, pts: 0, gf: 0, ga: 0 }; });
        wc.fixtures.forEach(f => {
            if (f.stage === "Group Stage") {
                f.matches.forEach(m => {
                    if (m.group === gLetter && m.played) {
                        stats[m.home].gf += m.homeScore; stats[m.home].ga += m.awayScore;
                        stats[m.away].gf += m.awayScore; stats[m.away].ga += m.homeScore;
                        if (m.homeScore > m.awayScore) stats[m.home].pts += 3;
                        else if (m.homeScore < m.awayScore) stats[m.away].pts += 3;
                        else { stats[m.home].pts += 1; stats[m.away].pts += 1; }
                    }
                });
            }
        });
        let sorted = Object.values(stats).sort((a,b) => (b.pts - a.pts) || ((b.gf - b.ga) - (a.gf - a.ga)));
        groupWinners[gLetter] = [sorted[0].name, sorted[1].name];
    });

    // প্রথম নকআউট রাউন্ড খুঁজে বের করা (ডায়নামিক)
    let firstLeg = wc.fixtures.find(f => f.stage.includes("Leg 1") && f.matches[0].home === "TBD" && f.stage !== "Final");
    if (firstLeg) {
        let gKeys = Object.keys(groupWinners);
        firstLeg.matches.forEach((m1, idx) => {
            let m2 = wc.fixtures.find(f => f.stage === firstLeg.stage.replace("Leg 1", "Leg 2")).matches[idx];
            let g1 = gKeys[idx % gKeys.length]; 
            let g2 = gKeys[(idx + 1) % gKeys.length];
            if (m1 && m2) {
                m1.home = m2.away = groupWinners[g1][0];
                m1.away = m2.home = groupWinners[g2][1];
            }
        });
    }

    promoteUclKnockoutWinners(wc);
    localStorage.setItem("efootballUclTournaments", JSON.stringify(wcTournaments));
    if(typeof updateKnockoutUI === 'function') updateKnockoutUI(wc);
}

function promoteUclKnockoutWinners(wc) {
    const allStages = ["Round of 32", "Round of 16", "Quarter-Finals", "Semi-Finals"];
    const stages = allStages.filter(s => wc.fixtures.some(f => f.stage.startsWith(s)));
    
    stages.forEach((s, index) => {
        let leg1 = wc.fixtures.find(f => f.stage === `${s} - Leg 1`);
        let leg2 = wc.fixtures.find(f => f.stage === `${s} - Leg 2`);
        if (!leg1 || !leg2 || !leg1.matches.every(m => m.played) || !leg2.matches.every(m => m.played)) return;

        leg1.matches.forEach((m1, idx) => {
            let m2 = leg2.matches[idx];
            let hAgg = (m1.homeScore || 0) + (m2.awayScore || 0); 
            let aAgg = (m1.awayScore || 0) + (m2.homeScore || 0);
            
            // পেনাল্টি লজিক: অ্যাগ্রিগেট ড্র হলে যার পেনাল্টি গোল বেশি, সে-ই জয়ী (ডায়নামিক লজিক)
            let winner;
            if (hAgg > aAgg) {
                winner = m1.home;
            } else if (aAgg > hAgg) {
                winner = m1.away;
            } else {
                // এখানে যার পেনাল্টি গোল বেশি সেই বিজয়ী হচ্ছে
                winner = ((m2.homePenalty || 0) > (m2.awayPenalty || 0)) ? m2.home : m2.away;
            }

            if (index === stages.length - 1) {
                let f = wc.fixtures.find(fx => fx.stage === "Final");
                if (f && f.matches[0]) {
                    idx === 0 ? f.matches[0].home = winner : f.matches[0].away = winner;
                }
            } else {
                let nextS = stages[index + 1];
                let n1 = wc.fixtures.find(fx => fx.stage === `${nextS} - Leg 1`);
                let n2 = wc.fixtures.find(fx => fx.stage === `${nextS} - Leg 2`);
                if (n1 && n2) {
                    let tIdx = Math.floor(idx / 2);
                    idx % 2 === 0 ? (n1.matches[tIdx].home = n2.matches[tIdx].away = winner) : 
                                    (n1.matches[tIdx].away = n2.matches[tIdx].home = winner);
                }
            }
        });
    });
}

// ==========================================================================
// 💻 ৭. অ্যাডমিন স্কোর মডাল কন্ট্রোল
// ==========================================================================
function openWcScoreModal(matchId) {
    const wc = wcTournaments.find(w => w.id === currentWcId);
    let match = null;
    wc.fixtures.forEach(f => {
        let m = f.matches.find(x => x.id === matchId);
        if (m) match = m;
    });

    if (!match) return;
    currentEditingWcMatch = match;

    document.getElementById("modal-teamA-name").textContent = match.home;
    document.getElementById("modal-teamB-name").textContent = match.away;
    document.getElementById("modal-teamA-score").value = match.homeScore !== null ? match.homeScore : "";
    document.getElementById("modal-teamB-score").value = match.awayScore !== null ? match.awayScore : "";
    document.getElementById("modal-teamA-poss").value = match.homePoss !== null ? match.homePoss : "";
    document.getElementById("modal-teamB-poss").value = match.awayPoss !== null ? match.awayPoss : "";

    document.getElementById("score-modal").style.display = "flex";
}

function closeScoreModal() {
    document.getElementById("score-modal").style.display = "none";
    currentEditingWcMatch = null;
}

function saveMatchResult() {
    if (!currentEditingWcMatch) return;

    const hs = document.getElementById("modal-teamA-score").value;
    const as = document.getElementById("modal-teamB-score").value;
    const hp = document.getElementById("modal-teamA-poss").value;
    const ap = document.getElementById("modal-teamB-poss").value;

    if (hs === "" || as === "") { alert("দয়া করে গোল সংখ্যা ইনপুট দিন!"); return; }
    if (hp !== "" && ap !== "" && (parseInt(hp) + parseInt(ap) !== 100)) {
        alert("বল পজিশন অবশ্যই ১০০% হতে হবে।"); return;
    }

    currentEditingWcMatch.homeScore = parseInt(hs);
    currentEditingWcMatch.awayScore = parseInt(as);
    currentEditingWcMatch.homePoss = hp !== "" ? parseInt(hp) : 50;
    currentEditingWcMatch.awayPoss = ap !== "" ? parseInt(ap) : 50;
    currentEditingWcMatch.played = true;

    const wc = wcTournaments.find(w => w.id === currentWcId);
    
    if (currentEditingWcMatch.stage !== "Group Stage") {
        let needsPenalty = false;

        if (currentEditingWcMatch.stage === "Final" && currentEditingWcMatch.homeScore === currentEditingWcMatch.awayScore) {
            needsPenalty = true;
        } 
        else if (currentEditingWcMatch.stage.includes("Leg 2")) {
            let leg1StageTitle = currentEditingWcMatch.stage.replace("Leg 2", "Leg 1");
            let leg1Stage = wc.fixtures.find(f => f.stage === leg1StageTitle);
            let m1 = leg1Stage.matches.find(m => m.home === currentEditingWcMatch.away || m.away === currentEditingWcMatch.home);
            
            if (m1 && m1.played) {
                if ((m1.homeScore + currentEditingWcMatch.awayScore) === (m1.awayScore + currentEditingWcMatch.homeScore)) needsPenalty = true;
            }
        }

        if (needsPenalty) {
            let pA = prompt(`${currentEditingWcMatch.home} এর পেনাল্টি গোল সংখ্যা লিখুন:`, "0");
            let pB = prompt(`${currentEditingWcMatch.away} এর পেনাল্টি গোল সংখ্যা লিখুন:`, "0");
            currentEditingWcMatch.homePenalty = parseInt(pA || 0);
            currentEditingWcMatch.awayPenalty = parseInt(pB || 0);
        }
    }

    // এখানে প্রমোশন ও TBD আপডেট ফাংশনটি কল করা হয়েছে
    checkAndPopulateUclKnockouts(wc);

    localStorage.setItem("efootballUclTournaments", JSON.stringify(wcTournaments));
    closeScoreModal();
    
    const grid = document.getElementById("tab-table-content");
    if (grid && grid.style.display === "block") calculateWcGroups();
    else renderWcFixtures();
}

// ==========================================================================
// 🏆 ৮. লাইভ টুর্নামেন্ট রেজাল্ট এবং টপ স্কোরার ENGINE (পেনাল্টি গোল ছাড়া)
// ==========================================================================
function calculateWcLiveResults() {
    const wc = wcTournaments.find(w => w.id === currentWcId);
    if (!wc) return;

    document.getElementById("live-champ-prize").textContent = "Prize: ৳" + wc.prizes.first;
    document.getElementById("live-runner-prize").textContent = "Prize: ৳" + wc.prizes.second;
    document.getElementById("live-scorer-prize").textContent = "Prize: ৳" + wc.prizes.scorer;

    const champBox = document.getElementById("live-champion-box");
    const runnerBox = document.getElementById("live-runnerup-box");
    const scorerBox = document.getElementById("live-topscorer-box");

    let goalStats = {};
    wc.players.forEach(p => goalStats[p] = { name: p, goals: 0 });

    let playedCount = 0;
    let finalMatch = null;

    wc.fixtures.forEach(f => {
        if (f.stage === "Final") finalMatch = f.matches[0];
        f.matches.forEach(m => {
            if (m.played) {
                playedCount++;
                if (goalStats[m.home]) goalStats[m.home].goals += parseInt(m.homeScore);
                if (goalStats[m.away]) goalStats[m.away].goals += parseInt(m.awayScore);
            }
        });
    });

    if (playedCount === 0) {
        let empty = `<span class="no-data-text"><i class="fas fa-hourglass-start"></i> No matches played yet</span>`;
        champBox.innerHTML = empty; runnerBox.innerHTML = empty; scorerBox.innerHTML = empty;
        return;
    }

    if (finalMatch && finalMatch.played) {
        let winner = finalMatch.homeScore > finalMatch.awayScore ? finalMatch.home : finalMatch.away;
        let runner = finalMatch.homeScore > finalMatch.awayScore ? finalMatch.away : finalMatch.home;
        if (finalMatch.homeScore === finalMatch.awayScore) {
            winner = finalMatch.homePenalty > finalMatch.awayPenalty ? finalMatch.home : finalMatch.away;
            runner = finalMatch.homePenalty > finalMatch.awayPenalty ? finalMatch.away : finalMatch.home;
        }

        champBox.innerHTML = `<span class="winner-name" style="color:#ffd700; font-weight:bold;"><i class="fas fa-trophy"></i> ${winner}</span>`;
        runnerBox.innerHTML = `<span class="winner-name" style="color:#c0c0c0; font-weight:bold;"><i class="fas fa-medal"></i> ${runner}</span>`;
    } else {
        champBox.innerHTML = `<span class="winner-name" style="font-size:1.1rem; color:#ffd700;"><i class="fas fa-spinner fa-spin"></i> UCL Live...</span>`;
        runnerBox.innerHTML = `<span class="winner-name" style="font-size:1.1rem; color:#c0c0c0;"><i class="fas fa-spinner fa-spin"></i> UCL Live...</span>`;
    }

    let sortedScorers = Object.values(goalStats).sort((a,b) => b.goals - a.goals);
    let topScorer = sortedScorers[0];

    if (topScorer && topScorer.goals > 0) {
        let nation = wc.playerNations[topScorer.name] || "TBD";
        let jStyle = NAT_JERSEY_STYLES[nation] || { color: "#fff" };
        scorerBox.innerHTML = `
            <div class="result-identity-row" style="display:flex; align-items:center; gap:8px; justify-content:center;">
                <i class="fas fa-tshirt" style="color: ${jStyle.color}; font-size: 1.2rem;"></i>
                <span class="winner-name" style="font-weight:bold;">${topScorer.name}</span>
            </div>
            <div class="winner-meta-sub" style="color:#ff7b72; font-weight:bold; margin-top:5px;"><i class="fas fa-futbol"></i> Total Goals: ${topScorer.goals}</div>
        `;
    } else {
        scorerBox.innerHTML = `<span class="no-data-text">No goals scored yet</span>`;
    }
}