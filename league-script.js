// ==========================================================================
// ১. গ্লোবাল স্টেট এবং ভেরিয়বলসমূহ
// ==========================================================================
let leagues = JSON.parse(localStorage.getItem("efootballLeagues")) || [];
let currentLeagueId = null; 
let currentEditingMatch = null; 
let isAdminLoggedIn = localStorage.getItem("isAdminLoggedIn") === "true"; 

const JERSEY_STYLES = [
    { color: "#388bfd", textShadow: "1px 1px #ffffff" }, 
    { color: "#ffcc00", textShadow: "1px 1px #008000" }, 
    { color: "#ff3333", textShadow: "1px 1px #ffffff" }, 
    { color: "#ffffff", textShadow: "1px 1px #000000" }, 
    { color: "#ff00ff", textShadow: "1px 1px #ffffff" }, 
    { color: "#00ffcc", textShadow: "1px 1px #000000" }, 
    { color: "#ff9933", textShadow: "1px 1px #ffffff" }, 
    { color: "#9933ff", textShadow: "1px 1px #ffffff" }  
];

const WEEK_DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEK_DAYS_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

window.onload = function() {
    renderLeagueList(); 
    updateAdminUI();    
};

function updateAdminUI() {
    const indicator = document.getElementById("admin-indicator");
    const createBtn = document.getElementById("show-create-form-btn");
    if (isAdminLoggedIn) {
        if(indicator) indicator.textContent = "Admin Mode";
        if(createBtn) createBtn.style.display = "block"; 
    } else {
        if(indicator) indicator.textContent = "Viewer Mode";
        if(createBtn) createBtn.style.display = "none"; 
    }
}

function toggleCreateForm() {
    const listSection = document.getElementById("league-list-section");
    const createSection = document.getElementById("create-league-section");
    if (createSection.style.display === "none") {
        createSection.style.display = "block";
        listSection.style.display = "none";
    } else {
        createSection.style.display = "none";
        listSection.style.display = "block";
    }
}

// ==========================================================================
// ২. রাউন্ড রবিন ফিক্সচার জেনারেশন এবং ডাইনামিক ডেট ইঞ্জিন
// ==========================================================================
function generateNewLeague() {
    const name = document.getElementById("league-name-input").value.trim();
    const messenger = document.getElementById("messenger-link-input").value.trim();
    const pEntry = document.getElementById("prize-entry").value.trim() || "Free"; 
    const pTotal = document.getElementById("prize-total").value || "0";
    const p1st = document.getElementById("prize-1st").value || "0";
    const p2nd = document.getElementById("prize-2nd").value || "0";
    const pScorer = document.getElementById("prize-scorer").value || "0";
    
    const checkedDays = Array.from(document.querySelectorAll('input[name="league-days"]:checked')).map(cb => parseInt(cb.value));
    const bulkText = document.getElementById("players-bulk-input").value.trim();

    if (!name) { alert("দয়া করে টুর্নামেন্টের নাম লিখুন!"); return; }
    if (checkedDays.length === 0) { alert("দয়া করে সপ্তাহে কমপক্ষে ১টি খেলার দিন সিলেক্ট করুন!"); return; }
    if (!bulkText) { alert("প্লেয়ারদের নামের তালিকা পেস্ট করুন!"); return; }

    let players = bulkText.split('\n')
        .map(p => p.replace(/^\d+[\.\s\-)]*/, '').trim()) 
        .filter(p => p !== ""); 

    if (players.length < 2) { alert("টুর্নামেন্ট শুরু করতে কমপক্ষে ২ জন প্লেয়ার লাগবে!"); return; }
    
    players.sort(() => Math.random() - 0.5);

    let playerJerseys = {};
    players.forEach((player, index) => {
        playerJerseys[player] = JERSEY_STYLES[index % JERSEY_STYLES.length];
    });

    let tempPlayers = [...players];
    if (tempPlayers.length % 2 !== 0) {
        tempPlayers.push("BYE");
    }

    const numPlayers = tempPlayers.length;
    const totalRounds = numPlayers - 1; 
    const matchesPerRound = numPlayers / 2; 
    let rawRounds = [];

    const TIME_SLOTS = ["10:30 PM", "11:00 PM", "11:30 PM", "12:00 AM"];

    for (let round = 0; round < totalRounds; round++) {
        let roundMatches = [];
        let activeMatchCount = 0; 

        for (let match = 0; match < matchesPerRound; match++) {
            let home = tempPlayers[(round + match) % (numPlayers - 1)];
            let away = tempPlayers[(numPlayers - 1 - match + round) % (numPlayers - 1)];
            if (match === 0) {
                home = tempPlayers[numPlayers - 1];
            }
            
            if (home !== "BYE" && away !== "BYE") {
                let slotTime = TIME_SLOTS[activeMatchCount % TIME_SLOTS.length];
                activeMatchCount++;

                roundMatches.push({
                    id: 'm-' + round + '-' + match + '-' + Date.now(), 
                    home: home,
                    away: away,
                    homeScore: null,
                    awayScore: null,
                    homePoss: null,
                    awayPoss: null,
                    timeSlot: slotTime, 
                    played: false 
                });
            }
        }
        if(roundMatches.length > 0) {
            rawRounds.push(roundMatches);
        }
    }

    let matchdayDates = [];
    let currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 1); 

    let roundIndex = 0;
    while (roundIndex < rawRounds.length) {
        let dayOfWeek = currentDate.getDay(); 
        if (checkedDays.includes(dayOfWeek)) {
            let dayNameShort = WEEK_DAYS_SHORT[dayOfWeek]; 
            let options = { month: 'short', day: 'numeric', year: 'numeric' };
            let coreDate = currentDate.toLocaleDateString('en-US', options); 
            
            let finalFullDateStr = dayNameShort + ", " + coreDate; 
            matchdayDates.push(finalFullDateStr);
            roundIndex++;
        }
        currentDate.setDate(currentDate.getDate() + 1); 
    }

    let finalFixtures = rawRounds.map((matches, idx) => {
        return {
            matchday: idx + 1,
            date: matchdayDates[idx],
            matches: matches
        };
    });

    const newLeague = {
        id: 'league-' + Date.now(), 
        name: name,
        messenger: messenger || "#",
        prizes: { entryFee: pEntry, total: pTotal, first: p1st, second: p2nd, scorer: pScorer },
        players: players,
        playerJerseys: playerJerseys, 
        selectedDays: checkedDays, 
        fixtures: finalFixtures
    };

    leagues.push(newLeague);
    localStorage.setItem("efootballLeagues", JSON.stringify(leagues));
    
    document.getElementById("league-name-input").value = "";
    document.getElementById("messenger-link-input").value = "";
    document.getElementById("prize-entry").value = "";
    document.getElementById("prize-total").value = "";
    document.getElementById("prize-1st").value = "";
    document.getElementById("prize-2nd").value = "";
    document.getElementById("prize-scorer").value = "";
    document.getElementById("players-bulk-input").value = "";
    document.querySelectorAll('input[name="league-days"]').forEach(cb => cb.checked = false);
    
    toggleCreateForm(); 
    renderLeagueList(); 
}

// ==========================================================================
// ৩. ডাইনামিক টুর্নামেন্ট ড্যাশবোর্ড কন্ট্রোল (কার্ড প্যানেল)
// ==========================================================================
function renderLeagueList() {
    const grid = document.getElementById("active-leagues-grid");
    if (!grid) return;
    grid.innerHTML = "";

    if (leagues.length === 0) {
        grid.innerHTML = "<p style='color: #8b949e; grid-column: 1/-1;'>বর্তমানে কোনো টুর্নামেন্ট সচল নেই। একটি নতুন লিগ তৈরি করুন!</p>";
        return;
    }

    leagues.forEach(league => {
        const card = document.createElement("div");
        card.className = "league-card";
        card.setAttribute("onclick", `openLeague('${league.id}')`); 
        
        let cardDaysLabel = "Not Set";
        if (league.selectedDays && league.selectedDays.length > 0) {
            cardDaysLabel = league.selectedDays.map(d => WEEK_DAYS_SHORT[d]).join(", ");
        }

        let entryFeeDisplay = league.prizes.entryFee || "Free";
        if (!isNaN(entryFeeDisplay) && entryFeeDisplay !== "") {
            entryFeeDisplay = "৳" + entryFeeDisplay;
        }

        card.innerHTML = `
            <div>
                <h3><i class="fas fa-trophy" style="color: #ffd700;"></i> ${league.name}</h3>
                <div class="league-card-meta">
                    <p><i class="fas fa-users" style="color: #58a6ff;"></i> Total Members: <strong>${league.players.length}</strong></p>
                    <p><i class="fas fa-ticket-alt" style="color: #ffaa47;"></i> Entry Fee: <strong>${entryFeeDisplay}</strong></p>
                    <p><i class="fas fa-calendar-alt" style="color: #00ffcc;"></i> Days: <strong>${cardDaysLabel}</strong></p>
                    <p><i class="fas fa-wallet" style="color: #238636;"></i> Total Prize: <strong>৳${league.prizes.total}</strong></p>
                </div>
            </div>
            <div class="card-prize-highlight">
                <div style="color: #ffd700; margin-bottom: 2px;"><i class="fas fa-crown"></i> Champion: ৳${league.prizes.first}</div>
                <div style="color: #c0c0c0; margin-bottom: 2px;"><i class="fas fa-medal"></i> Runner-up: ৳${league.prizes.second}</div>
                <div style="color: #ff7b72;"><i class="fas fa-shoe-prints"></i> Top Scorer: ৳${league.prizes.scorer || 0}</div>
            </div>
        `;

        if (isAdminLoggedIn) {
            const delBtn = document.createElement("button");
            delBtn.className = "delete-tournament-btn";
            delBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
            delBtn.onclick = function(e) {
                e.stopPropagation(); 
                deleteLeague(league.id);
            };
            card.appendChild(delBtn);
        }
        grid.appendChild(card);
    });
}

function deleteLeague(id) {
    if (confirm("আপনি কি নিশ্চিতভাবে এই পুরো টুর্নামেন্টটি ফিক্সচারসহ ডিলিট করতে চান?")) {
        leagues = leagues.filter(l => l.id !== id);
        localStorage.setItem("efootballLeagues", JSON.stringify(leagues));
        renderLeagueList();
        backToLeagueList();
    }
}

function openLeague(id) {
    currentLeagueId = id;
    const league = leagues.find(l => l.id === id);
    if (!league) return;

    document.getElementById("league-list-section").style.display = "none";
    document.getElementById("league-view-section").style.display = "block";

    document.getElementById("current-active-league-name").textContent = league.name;
    document.getElementById("messenger-join-btn").href = league.messenger;
    
    let entryFeeDisplay = league.prizes.entryFee || "Free";
    if (!isNaN(entryFeeDisplay) && entryFeeDisplay !== "") {
        entryFeeDisplay = "৳" + entryFeeDisplay;
    }
    document.getElementById('view-prize-entry').textContent = entryFeeDisplay;

    document.getElementById("view-prize-total").textContent = "৳" + league.prizes.total;
    document.getElementById("view-prize-1st").textContent = "৳" + league.prizes.first;
    document.getElementById("view-prize-2nd").textContent = "৳" + league.prizes.second;
    document.getElementById("view-prize-scorer").textContent = "৳" + league.prizes.scorer;

    switchTab('table'); 
}

function backToLeagueList() {
    document.getElementById("league-list-section").style.display = "block";
    document.getElementById("league-view-section").style.display = "none";
    currentLeagueId = null;
}

// ৩টি ট্যাব সুইচিং কন্ট্রোল
function switchTab(tab) {
    const tableBtn = document.getElementById("tab-table-btn");
    const matchesBtn = document.getElementById("tab-matches-btn");
    const resultBtn = document.getElementById("tab-result-btn");
    
    const tableContent = document.getElementById("tab-table-content");
    const matchesContent = document.getElementById("tab-matches-content");
    const resultContent = document.getElementById("tab-result-content");

    tableBtn.classList.remove("active");
    matchesBtn.classList.remove("active");
    resultBtn.classList.remove("active");
    
    tableContent.style.display = "none";
    matchesContent.style.display = "none";
    resultContent.style.display = "none";

    if (tab === 'table') {
        tableBtn.classList.add("active");
        tableContent.style.display = "block";
        calculateStandings(); 
    } else if (tab === 'matches') {
        matchesBtn.classList.add("active");
        matchesContent.style.display = "block";
        renderFixtures();    
    } else if (tab === 'result') {
        resultBtn.classList.add("active");
        resultContent.style.display = "block";
        calculateLiveResults(); 
    }
}

// ==========================================================================
// ৪. পয়েন্ট টেবিল ইঞ্জিন এবং গ্লোবাল স্ট্যান্ডিংস ডেটা রিটার্নার
// ==========================================================================
function getCalculatedStandings() {
    const league = leagues.find(l => l.id === currentLeagueId);
    if (!league) return { standings: [], totalPlayedMatches: 0 };

    let stats = {};
    league.players.forEach(p => {
        stats[p] = { name: p, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, totalPoss: 0, matchesWithPoss: 0 };
    });

    let totalPlayedMatches = 0;

    league.fixtures.forEach(f => {
        f.matches.forEach(m => {
            if (m.played) { 
                totalPlayedMatches++;
                let h = m.home; let a = m.away;
                let hs = parseInt(m.homeScore); let as = parseInt(m.awayScore);
                let hp = parseFloat(m.homePoss || 0); let ap = parseFloat(m.awayPoss || 0);

                stats[h].p++; stats[a].p++;
                stats[h].gf += hs; stats[h].ga += as;
                stats[a].gf += as; stats[a].ga += hs;

                if (hp > 0 || ap > 0) {
                    stats[h].totalPoss += hp; stats[h].matchesWithPoss++;
                    stats[a].totalPoss += ap; stats[a].matchesWithPoss++;
                }

                if (hs > as) {
                    stats[h].w++; stats[h].pts += 3; stats[a].l++;
                } else if (hs < as) {
                    stats[a].w++; stats[a].pts += 3; stats[h].l++;
                } else {
                    stats[h].d++; stats[h].pts += 1; stats[a].d++; stats[a].pts += 1;
                }
            }
        });
    });

    let standings = Object.values(stats).map(p => {
        p.gd = p.gf - p.ga;
        p.avgPoss = p.matchesWithPoss > 0 ? (p.totalPoss / p.matchesWithPoss).toFixed(1) : "0.0";
        return p;
    });

    standings.sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts; 
        if (b.gd !== a.gd) return b.gd - a.gd;   
        if (a.ga !== b.ga) return a.ga - b.ga;   
        return parseFloat(b.avgPoss) - parseFloat(a.avgPoss); 
    });

    return { standings, totalPlayedMatches };
}

function calculateStandings() {
    const league = leagues.find(l => l.id === currentLeagueId);
    if (!league) return;

    const { standings } = getCalculatedStandings();
    const tbody = document.getElementById("standings-tbody");
    tbody.innerHTML = "";

    standings.forEach((p, idx) => {
        let jStyle = (league.playerJerseys && league.playerJerseys[p.name]) ? league.playerJerseys[p.name] : JERSEY_STYLES[0];

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${idx + 1}</td>
            <td style="text-align: left; font-weight: 600; color: #fff; display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-tshirt dynamic-jersey-icon" style="color: ${jStyle.color} !important; text-shadow: ${jStyle.textShadow} !important;"></i> 
                <span>${p.name}</span>
            </td>
            <td>${p.p}</td><td>${p.w}</td><td>${p.d}</td><td>${p.l}</td>
            <td>${p.gf}</td><td>${p.ga}</td>
            <td style="color: ${p.gd > 0 ? '#58a6ff' : p.gd < 0 ? '#f85149' : '#c9d1d9'}">${p.gd > 0 ? '+' + p.gd : p.gd}</td>
            <td>${p.avgPoss}%</td>
            <td style="font-weight: bold; color: #58a6ff;">${p.pts}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ==========================================================================
// ৪.৩ লাইভ টুর্নামেন্ট রেজাল্ট জেনারেটর (Champion, Runner-up, Top Scorer)
// ==========================================================================
function calculateLiveResults() {
    const league = leagues.find(l => l.id === currentLeagueId);
    if (!league) return;

    document.getElementById("live-champ-prize").textContent = "Prize: ৳" + league.prizes.first;
    document.getElementById("live-runner-prize").textContent = "Prize: ৳" + league.prizes.second;
    document.getElementById("live-scorer-prize").textContent = "Prize: ৳" + (league.prizes.scorer || 0);

    const { standings, totalPlayedMatches } = getCalculatedStandings();

    const champBox = document.getElementById("live-champion-box");
    const runnerBox = document.getElementById("live-runnerup-box");
    const scorerBox = document.getElementById("live-topscorer-box");

    if (totalPlayedMatches === 0) {
        let emptyState = `<span class="no-data-text"><i class="fas fa-hourglass-start"></i> No matches played yet</span>`;
        champBox.innerHTML = emptyState;
        runnerBox.innerHTML = emptyState;
        scorerBox.innerHTML = emptyState;
        return;
    }

    // ১. চ্যাম্পিয়ন এবং রানার্স আপ ডিক্লেয়ারেশন (স্ট্যান্ডিংস অনুযায়ী অটো)
    let champ = standings[0];
    let runner = standings[1] || champ; 

    let champJersey = league.playerJerseys[champ.name] || JERSEY_STYLES[0];
    champBox.innerHTML = `
        <div class="result-identity-row">
            <i class="fas fa-tshirt" style="color: ${champJersey.color}; font-size: 1.5rem;"></i>
            <span class="winner-name">${champ.name}</span>
        </div>
        <div class="winner-meta-sub">${champ.pts} Pts | ${champ.gf} Goals</div>
    `;

    let runnerJersey = league.playerJerseys[runner.name] || JERSEY_STYLES[1];
    runnerBox.innerHTML = `
        <div class="result-identity-row">
            <i class="fas fa-tshirt" style="color: ${runnerJersey.color}; font-size: 1.5rem;"></i>
            <span class="winner-name">${runner.name}</span>
        </div>
        <div class="winner-meta-sub">${runner.pts} Pts | ${runner.gf} Goals</div>
    `;

    // ২. টপ স্কোরার লজিক (যে সবচেয়ে বেশি গোল (GF) দিয়েছে)
    let highestGoals = -1;
    let topScorersList = [];

    standings.forEach(p => {
        if (p.gf > highestGoals) {
            highestGoals = p.gf;
            topScorersList = [p];
        } else if (p.gf === highestGoals && highestGoals > 0) {
            topScorersList.push(p); 
        }
    });

    if (highestGoals <= 0) {
        scorerBox.innerHTML = `<span class="no-data-text"><i class="fas fa-exclamation-circle"></i> No goals scored yet</span>`;
    } else {
        scorerBox.innerHTML = "";
        topScorersList.forEach(scorer => {
            let scorerJersey = league.playerJerseys[scorer.name] || JERSEY_STYLES[0];
            let item = document.createElement("div");
            item.style.marginBottom = "8px";
            item.innerHTML = `
                <div class="result-identity-row">
                    <i class="fas fa-tshirt" style="color: ${scorerJersey.color}; font-size: 1.2rem;"></i>
                    <span class="winner-name" style="font-size: 1.1rem;">${scorer.name}</span>
                </div>
                <div class="winner-meta-sub" style="color: #ff7b72; font-weight: bold;"><i class="fas fa-futbol"></i> Total Goals: ${scorer.gf}</div>
            `;
            scorerBox.appendChild(item);
        });
    }
}

// ==========================================================================
// ৫. ফিক্সচার ইঞ্জিন
// ==========================================================================
function renderFixtures() {
    const container = document.getElementById("matchdays-container");
    if (!container) return;
    container.innerHTML = "";

    const league = leagues.find(l => l.id === currentLeagueId);
    if (!league) return;

    const totalMatchdaysCount = league.fixtures.length;

    let daysLables = "";
    if (league.selectedDays && league.selectedDays.length > 0) {
        daysLables = league.selectedDays.map(d => WEEK_DAYS_NAMES[d].substring(0, 3)).join(", ");
    }

    league.fixtures.forEach(f => {
        const block = document.createElement("div");
        block.className = "matchday-container-box"; 
        
        block.innerHTML = `
            <div class="matchday-header-bar">
                <span>Matchday ${f.matchday} of ${totalMatchdaysCount}</span>
                ${daysLables ? `<span class="selected-days-badge"><i class="far fa-clock"></i> Days: ${daysLables}</span>` : ''}
            </div>
            <div class="google-matches-grid" id="round-grid-${f.matchday}"></div>
        `;
        container.appendChild(block);

        const grid = document.getElementById(`round-grid-${f.matchday}`);
        f.matches.forEach(m => {
            const row = document.createElement("div");
            row.className = "google-match-row"; 
            
            let homeJersey = (league.playerJerseys && league.playerJerseys[m.home]) ? league.playerJerseys[m.home] : JERSEY_STYLES[0];
            let awayJersey = (league.playerJerseys && league.playerJerseys[m.away]) ? league.playerJerseys[m.away] : JERSEY_STYLES[1];

            let sA = m.played ? m.homeScore : "-";
            let sB = m.played ? m.awayScore : "-";
            let pA = m.played ? m.homePoss + "% Poss" : "";
            let pB = m.played ? m.awayPoss + "% Poss" : "";

            row.innerHTML = `
                <div class="teams-vertical-stack">
                    <div class="player-line-node">
                        <div class="player-identity">
                            <i class="fas fa-tshirt dynamic-jersey-icon" style="color: ${homeJersey.color} !important; text-shadow: ${homeJersey.textShadow} !important;"></i>
                            <span class="player-display-name">${m.home}</span>
                        </div>
                        <div class="score-poss-block">
                            <span class="node-score">${sA}</span>
                            <span class="node-poss">${pA}</span>
                        </div>
                    </div>
                    <div class="player-line-node">
                        <div class="player-identity">
                            <i class="fas fa-tshirt dynamic-jersey-icon" style="color: ${awayJersey.color} !important; text-shadow: ${awayJersey.textShadow} !important;"></i>
                            <span class="player-display-name">${m.away}</span>
                        </div>
                        <div class="score-poss-block">
                            <span class="node-score">${sB}</span>
                            <span class="node-poss">${pB}</span>
                        </div>
                    </div>
                </div>
                
                <div class="match-meta-status">
                    <span class="slot-time">${m.played ? 'FT' : m.timeSlot}</span>
                    <span class="slot-date"><i class="far fa-calendar-alt"></i> ${f.date}</span>
                    ${isAdminLoggedIn ? `<button class="update-score-btn" onclick="openScoreModal('${m.id}')"><i class="fas fa-edit"></i> Score</button>` : `<span class="viewer-status-text">${m.played ? 'Finished' : 'Scheduled'}</span>`}
                </div>
            `;
            grid.appendChild(row);
        });
    });
}

// ==========================================================================
// ৬. অ্যাডমিন স্কোর মডাল পপ-আপ কন্ট্রোল
// ==========================================================================
function openScoreModal(matchId) {
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

    localStorage.setItem("efootballLeagues", JSON.stringify(leagues));
    closeScoreModal();
    renderFixtures();
}