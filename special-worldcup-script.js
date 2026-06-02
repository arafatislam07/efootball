// ==========================================================================
// ১. গ্লোবাল স্টেট এবং ওয়ার্ল্ড কাপ ডাটা স্ট্রাকচার
// ==========================================================================
let wcTournaments = JSON.parse(localStorage.getItem("efootballSpecialWorldCups")) || [];
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
    }
}

// ==========================================================================
// ২. ৪৮ দল ফিফা ২০ ২৬ ফরম্যাট জেনারেশন ENGINE (দিনে সর্বোচ্চ ৮টি ম্যাচ)
// ==========================================================================
function generateSpecialWorldCup() {
    const name = document.getElementById("wc-name-input").value.trim();
    const messenger = document.getElementById("messenger-link-input").value.trim();
    const pEntry = document.getElementById("prize-entry").value.trim() || "Free";
    const pTotal = document.getElementById("prize-total").value || "0";
    const p1st = document.getElementById("prize-1st").value || "0";
    const p2nd = document.getElementById("prize-2nd").value || "0";
    const pScorer = document.getElementById("prize-scorer").value || "0";
    
    const checkedDays = Array.from(document.querySelectorAll('input[name="wc-days"]:checked')).map(cb => parseInt(cb.value));
    const bulkText = document.getElementById("players-bulk-input").value.trim();

    if (!name) { alert("দয়া করে বিশ্বকাপের নাম লিখুন!"); return; }
    if (checkedDays.length === 0) { alert("সপ্তাহে কমপক্ষে ১টি খেলার দিন সিলেক্ট করুন!"); return; }
    
    let players = bulkText.split('\n').map(p => p.replace(/^\d+[\.\s\-)]*/, '').trim()).filter(p => p !== "");
    const totalP = players.length;

    if (totalP !== 48) {
        alert("ভুল প্লেয়ার সংখ্যা! স্পেশাল ফিফা ২০২৬ টুর্নামেন্ট ফরম্যাটের জন্য অবশ্যই ঠিক ৪৮ জন প্লেয়ার লাগবে। বর্তমানে আছে: " + totalP + " জন।");
        return;
    }

    players.sort(() => Math.random() - 0.5);
    let shuffledNations = [...NAT_TEAMS_LIST].sort(() => Math.random() - 0.5);

    let playerNations = { "TBD": "TBD" };
    players.forEach((p, idx) => {
        playerNations[p] = shuffledNations[idx % shuffledNations.length];
    });

    let groups = {};
    const numGroups = 12; 
    for(let i=0; i<numGroups; i++) {
        let groupLetter = String.fromCharCode(65 + i); 
        groups[groupLetter] = players.slice(i * 4, (i + 1) * 4);
    }

    let fixtures = [];
    let currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 1);

    let displayRoundCounter = 1;

    for (let round = 0; round < 3; round++) {
        let tempAllMatches = [];

        Object.keys(groups).forEach(gLetter => {
            let gp = groups[gLetter];
            let pairs = [];
            if (round === 0) pairs = [[0, 1], [2, 3]];
            else if (round === 1) pairs = [[0, 2], [1, 3]];
            else if (round === 2) pairs = [[0, 3], [1, 2]];

            pairs.forEach(pair => {
                tempAllMatches.push({
                    id: `sp-m-${round}-${gLetter}-${Date.now()}-${Math.random()}`,
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

    let koStagesConfig = ["Round of 32", "Round of 16", "Quarter-Finals", "Semi-Finals", "Final"];

    koStagesConfig.forEach(stageName => {
        let matchesInStage = 0;
        if (stageName === "Round of 32") matchesInStage = 16;
        else if (stageName === "Round of 16") matchesInStage = 8;
        else if (stageName === "Quarter-Finals") matchesInStage = 4;
        else if (stageName === "Semi-Finals") matchesInStage = 2;
        else if (stageName === "Final") matchesInStage = 1;

        let stageMatches = [];
        for (let i = 0; i < matchesInStage; i++) {
            stageMatches.push({
                id: `sp-ko-${stageName}-${i}-${Date.now()}`,
                group: "KO",
                stage: stageName,
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
                stage: stageName,
                matches: daySlice
            });
            displayRoundCounter++;
            currentDate.setDate(currentDate.getDate() + 1);
        }
    });

    const newWc = {
        id: 'spwc-' + Date.now(),
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
    localStorage.setItem("efootballSpecialWorldCups", JSON.stringify(wcTournaments));
    toggleCreateForm();
    renderWcList();
}

// ==========================================================================
// ৩. ফ্রন্ট-এন্ড টুর্নামেন্ট কার্ড রেন্ডারার
// ==========================================================================
function renderWcList() {
    const grid = document.getElementById("active-leagues-grid");
    if (!grid) return;
    grid.innerHTML = "";

    if (wcTournaments.length === 0) {
        grid.innerHTML = "<p style='color: #8b949e; grid-column: 1/-1;'>কোনো স্পেশাল বিশ্বকাপ টুর্নামেন্ট সচল নেই।</p>";
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
                <h3><i class="fas fa-trophy" style="color: #ffd700;"></i> ${wc.name}</h3>
                <div class="league-card-meta">
                    <p><i class="fas fa-users" style="color: #58a6ff;"></i> Total Players: <strong>${wc.players.length} (48 Teams)</strong></p>
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
                if(confirm("এই স্পেশাল বিশ্বকাপটি ডিলিট করতে চান?")) {
                    wcTournaments = wcTournaments.filter(w => w.id !== wc.id);
                    localStorage.setItem("efootballSpecialWorldCups", JSON.stringify(wcTournaments));
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

// ==========================================================================
// ৪. গ্রুপ টেবিল ক্যালকুলেটর (১২টি গ্রুপ কোয়ালিফায়ার ইঞ্জিন)
// ==========================================================================
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
            <h3 style="color: #00ffcc; margin-bottom: 10px;"><i class="fas fa-users-cog"></i> GROUP ${gLetter}</h3>
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

    checkAndPopulateSpecialKnockouts(wc);
}

// ==========================================================================
// ৫. ফিক্সচার লেআউট রেন্ডারিং (গোল্ডেন ডেট বক্স ও নো দেশের নাম রুল)
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
        block.style.marginBottom = "30px";
        
        block.innerHTML = `
            <div class="matchday-header-bar" style="display:flex; justify-content:space-between; align-items:center; padding:10px 15px; background:#161b22; border-radius:6px; margin-bottom:15px; border:1px solid #21262d;">
                <span style="font-weight:bold; color:#00ffcc; font-size:1rem;"><i class="fas fa-futbol"></i> ${f.stage === 'Group Stage' ? 'Matchday ' + f.matchday : f.stage}</span>
                <span class="selected-days-badge" style="background:#21262d; border:1px solid #30363d; padding:5px 12px; border-radius:4px; font-size:0.85rem; color:#ffd700; font-weight:600;"><i class="far fa-calendar-alt"></i> ${f.date}</span>
            </div>
            <div class="matches-grid" id="round-grid-${f.matchday}" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(48%, 1fr)); gap:15px;"></div>
        `;
        container.appendChild(block);

        const grid = document.getElementById(`round-grid-${f.matchday}`);
        f.matches.forEach(m => {
            const card = document.createElement("div");
            card.className = "match-card"; 
            card.style.background = "#161b22";
            card.style.padding = "15px";
            card.style.borderRadius = "8px";
            card.style.border = m.played ? "1px solid #238636" : "1px solid #21262d";
            card.style.display = "flex";
            card.style.justifyContent = "space-between";
            card.style.alignItems = "center";

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
                            <i class="fas fa-tshirt" style="color: ${jHome.color} !important; text-shadow: ${jHome.textShadow} !important; font-size:1.1rem;"></i>
                            <span class="team-player-name" style="font-weight:600; color:${m.home === 'TBD' ? '#8b949e' : '#c9d1d9'}">${m.home}</span>
                        </div>
                        <div class="team-score-wrapper" style="display:flex; gap:15px; align-items:center;">
                            <span class="team-poss-pct" style="font-size:0.75rem; color:#8b949e; min-width:35px; text-align:right;">${pA}</span>
                            <span class="team-goals-num" style="font-weight:bold; font-size:1.1rem; color:#58a6ff; min-width:15px; text-align:right;">${hScoreText}</span>
                        </div>
                    </div>
                    <div class="team-row-node" style="display:flex; justify-content:space-between; align-items:center;">
                        <div class="team-identity-wrapper" style="display:flex; align-items:center; gap:10px;">
                            <i class="fas fa-tshirt" style="color: ${jAway.color} !important; text-shadow: ${jAway.textShadow} !important; font-size:1.1rem;"></i>
                            <span class="team-player-name" style="font-weight:600; color:${m.away === 'TBD' ? '#8b949e' : '#c9d1d9'}">${m.away}</span>
                        </div>
                        <div class="team-score-wrapper" style="display:flex; gap:15px; align-items:center;">
                            <span class="team-poss-pct" style="font-size:0.75rem; color:#8b949e; min-width:35px; text-align:right;">${pB}</span>
                            <span class="team-goals-num" style="font-weight:bold; font-size:1.1rem; color:#58a6ff; min-width:15px; text-align:right;">${aScoreText}</span>
                        </div>
                    </div>
                </div>
                <div class="match-status-action-box" style="display:flex; flex-direction:column; align-items:flex-end; gap:6px; margin-left:15px; border-left:1px solid #21262d; padding-left:15px; min-width:80px;">
                    <span class="match-time-status" style="font-weight:bold; color: ${m.played ? '#ff7b72' : '#58a6ff'}; font-size:0.85rem;">${m.played ? 'FT' : m.timeSlot}</span>
                    ${isAdminLoggedIn && m.home !== "TBD" && m.away !== "TBD" ? `<button class="update-score-btn" onclick="openWcScoreModal('${m.id}')" style="padding:4px 8px; background:#21262d; border:1px solid #30363d; color:#c9d1d9; border-radius:4px; cursor:pointer; font-size:0.75rem;"><i class="fas fa-edit"></i> Score</button>` : `<span class="match-status-label" style="font-size:0.75rem; color:#8b949e;">${m.played ? 'Finished' : 'Scheduled'}</span>`}
                </div>
            `;
            grid.appendChild(card);
        });
    });
}

// ==========================================================================
// 💡 ৬. ২০২৬ ফিফা অফিশিয়াল লজিক: ২৪ কোয়ালিফায়ার + সেরা ৮টি ৩য় স্থান সিলেক্টর ENGINE
//    [টাইব্রেকার কন্ডিশন: ১. Pts -> ২. GD -> ৩. GF -> ৪. কম গোল খাওয়া (GA) -> ৫. বল পজিশন]
// ==========================================================================
function checkAndPopulateSpecialKnockouts(wc) {
    if (!wc) return;

    // ১. সব গ্রুপ ম্যাচ শেষ কি না তা যাচাই করা
    let allGroupMatchesPlayed = true;
    wc.fixtures.forEach(f => {
        if (f.stage === "Group Stage") {
            f.matches.forEach(m => { if (!m.played) allGroupMatchesPlayed = false; });
        }
    });

    if (!allGroupMatchesPlayed) return;

    let groupWinners = {}; 
    let thirdPlacedPlayers = []; 
    const letters = ['A','B','C','D','E','F','G','H','I','J','K','L'];

    // ২. প্রতিটি গ্রুপের পারফরম্যান্স বিশ্লেষণ
    letters.forEach(gLetter => {
        let gPlayers = wc.groups[gLetter];
        if(!gPlayers) return;
        let stats = {};
        gPlayers.forEach(p => { stats[p] = { name: p, pts: 0, gf: 0, ga: 0, gd: 0, totalPoss: 0, playedWithPoss: 0 }; });

        wc.fixtures.forEach(f => {
            if (f.stage === "Group Stage") {
                f.matches.forEach(m => {
                    if (m.group === gLetter && m.played) {
                        stats[m.home].gf += m.homeScore; stats[m.home].ga += m.awayScore;
                        stats[m.away].gf += m.awayScore; stats[m.away].ga += m.homeScore;
                        
                        // বল পজিশন ক্যালকুলেশন
                        let hp = parseFloat(m.homePoss || 0); let ap = parseFloat(m.awayPoss || 0);
                        if (hp > 0 || ap > 0) {
                            stats[m.home].totalPoss += hp; stats[m.home].playedWithPoss++;
                            stats[m.away].totalPoss += ap; stats[m.away].playedWithPoss++;
                        }

                        if (m.homeScore > m.awayScore) stats[m.home].pts += 3;
                        else if (m.homeScore < m.awayScore) stats[m.away].pts += 3;
                        else { stats[m.home].pts += 1; stats[m.away].pts += 1; }
                    }
                });
            }
        });

        Object.values(stats).forEach(p => { p.gd = p.gf - p.ga; });

        // গ্রুপ টেবিল সর্টিং
        let sorted = Object.values(stats).sort((a,b) => {
            if(b.pts !== a.pts) return b.pts - a.pts;
            if(b.gd !== a.gd) return b.gd - a.gd;
            if(b.gf !== a.gf) return b.gf - a.gf;
            return a.ga - b.ga; // GA কম হলে আগে
        });

        groupWinners[gLetter] = [sorted[0].name, sorted[1].name]; 
        if(sorted[2]) thirdPlacedPlayers.push(sorted[2]); 
    });

    // ৩. ১২টি গ্রুপের সেরা ৮টি ৩য় স্থান অর্জনকারী বাছাই
    thirdPlacedPlayers.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.ga - b.ga);
    let best8Thirds = thirdPlacedPlayers.slice(0, 8).map(p => p.name);

    // ৪. নকআউট কোয়ালিফায়ার তালিকা তৈরি (২৪ + ৮ = ৩২ জন)
    let qualified32 = [];
    letters.forEach(g => { if(groupWinners[g]) { qualified32.push(groupWinners[g][0]); qualified32.push(groupWinners[g][1]); }});
    best8Thirds.forEach(p => { qualified32.push(p); });

    // ৫. রাউন্ড অফ ৩২ এর ব্র্যাকেট পপুলেশন
    wc.fixtures.forEach(f => {
        if (f.stage === "Round of 32") {
            f.matches.forEach((m, i) => {
                if (m.home === "TBD" && qualified32[i * 2]) {
                    m.home = qualified32[i * 2];
                    m.away = qualified32[i * 2 + 1] || "TBD";
                }
            });
        }
    });

    // ৬. পরবর্তী রাউন্ডগুলোর (সেমি/ফাইনাল) জন্য প্রমোশন কল করা
    promoteKnockoutWinners(wc);
    localStorage.setItem("efootballSpecialWorldCups", JSON.stringify(wcTournaments));
    updateKnockoutUI(wc);
}

// ==========================================================================
// ৭. অ্যাডমিন স্কোর মডাল কন্ট্রোল
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

    if (currentEditingWcMatch.stage !== "Group Stage" && currentEditingWcMatch.homeScore === currentEditingWcMatch.awayScore) {
        let pA = prompt(`${currentEditingWcMatch.home} এর পেনাল্টি গোল সংখ্যা লিখুন:`, "0");
        let pB = prompt(`${currentEditingWcMatch.away} এর পেনাল্টি গোল সংখ্যা লিখুন:`, "0");
        currentEditingWcMatch.homePenalty = parseInt(pA || 0);
        currentEditingWcMatch.awayPenalty = parseInt(pB || 0);
    }

    localStorage.setItem("efootballSpecialWorldCups", JSON.stringify(wcTournaments));
    closeScoreModal();
    
    const grid = document.getElementById("tab-table-content");
    if (grid && grid.style.display === "block") calculateWcGroups();
    else renderWcFixtures();
}

// ==========================================================================
// ৬. অ্যাডমিন স্কোর মডাল পপ-আপ কন্ট্রোল (Special World Cup - ফায়ারবেস সহ আপডেটেড)
// ==========================================================================
function openScoreModal(matchId) {
    // এখানে আপনার স্পেশাল ওয়ার্ল্ড কাপের গ্লোবাল ভ্যারিয়েবলের নাম অনুযায়ী (ধরি specialWorldCups বা worldCups) চেঞ্জ হতে পারে। 
    // যদি ভ্যারিয়েবলের নাম শুধু leagues-ই রেখে থাকেন, তবে যা আছে তাই থাকবে।
    const league = leagues.find(l => l.id === currentLeagueId);
    let foundMatch = null;
    league.fixtures.forEach(f => {
        let m = f.matches.find(match => match.id === matchId);
        if (m) foundMatch = m;
    });

    if (!foundMatch) return;
    currentEditingMatch = foundMatch;

    document.getElementById("modal-teamA-name").textContent = foundMatch.home;
    document.getElementById("modal-teamB-name").textContent = foundMatch.away;
    document.getElementById("modal-teamA-score").value = foundMatch.homeScore !== null ? foundMatch.homeScore : "";
    document.getElementById("modal-teamB-score").value = foundMatch.awayScore !== null ? foundMatch.awayScore : "";
    document.getElementById("modal-teamA-poss").value = foundMatch.homePoss !== null ? foundMatch.homePoss : "";
    document.getElementById("modal-teamB-poss").value = foundMatch.awayPoss !== null ? foundMatch.awayPoss : "";

    document.getElementById("score-modal").style.display = "flex";
}

function closeScoreModal() {
    document.getElementById("score-modal").style.display = "none";
    currentEditingMatch = null;
}

function saveMatchResult() {
    if (!currentEditingMatch) return;

    const hs = document.getElementById("modal-teamA-score").value;
    const as = document.getElementById("modal-teamB-score").value;
    const hp = document.getElementById("modal-teamA-poss").value;
    const ap = document.getElementById("modal-teamB-poss").value;

    if (hs === "" || as === "") { alert("দয়া করে দুই দলেরই গোল সংখ্যা ইনপুট দিন!"); return; }
    if (hp !== "" || ap !== "") {
        if (parseInt(hp) + parseInt(ap) !== 100) {
            alert("ভুল ইনপুট! দুই দলের বল পজিশন যোগ করলে অবশ্যই ১০০% হতে হবে।");
            return;
        }
    }

    currentEditingMatch.homeScore = parseInt(hs);
    currentEditingMatch.awayScore = parseInt(as);
    currentEditingMatch.homePoss = hp !== "" ? parseInt(hp) : 0;
    currentEditingMatch.awayPoss = ap !== "" ? parseInt(ap) : 0;
    currentEditingMatch.played = true;

    // ১. লোকাল স্টোরেজে স্পেশাল ওয়ার্ল্ড কাপের আলাদা কি (Key) তে সেভ রাখা হলো
    localStorage.setItem("efootballSpecialWorldCup", JSON.stringify(leagues));

    // ২. ফায়ারবেস রিয়েল-টাইম ডাটাবেজে ক্লাউড আপডেট পুশ (পাথ পরিবর্তন করা হয়েছে)
    if (window.fbSet && window.fbRef && window.fbDatabase) {
        // 'leagues' এর পরিবর্তে এখানে 'special_worldcup' পাথে ডেটা সেভ হবে যেন লীগের ডেটা ডিলিট না হয়
        window.fbSet(window.fbRef(window.fbDatabase, 'special_worldcup'), leagues)
        .then(() => {
            console.log("স্পেশাল ওয়ার্ল্ড কাপের স্কোর ফায়ারবেসে সফলভাবে সিঙ্ক হয়েছে!");
        })
        .catch((err) => {
            console.error("ফায়ারবেস আপডেট এরর:", err);
        });
    }

    closeScoreModal();
    renderFixtures();
}
