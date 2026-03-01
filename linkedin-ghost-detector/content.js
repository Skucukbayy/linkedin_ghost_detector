var GHOST_STALE_DAYS = 30;
var GHOST_HIGH_APPLICANT = 200;
var GHOST_KEYWORDS = ["always hiring","ongoing","continuous","talent pool","pipeline","evergreen","future opportunities","surekli alim","havuz"];
var ghostFlagged = [];
var ghostTimer = null;

function ghostLog(msg) {
  console.log("[GhostDetector][" + GHOST_SITE.name + "] " + msg);
}

function ghostShowStatus(text) {
  var el = document.getElementById("ghost-detector-status");
  if (!el) {
    el = document.createElement("div");
    el.id = "ghost-detector-status";
    document.body.appendChild(el);
  }
  el.textContent = GHOST_SITE.name + " | " + text;
  clearTimeout(el._hide);
  el._hide = setTimeout(function() { el.style.opacity = "0"; }, 5000);
  el.style.opacity = "0.9";
}

function ghostParseDays(text) {
  if (!text) return null;
  var s = text.toLowerCase();
  var m;
  if ((m = s.match(/(\d+)\s*(month|ay|mo)/))) return parseInt(m[1]) * 30;
  if ((m = s.match(/(\d+)\s*(week|hafta|w\b)/))) return parseInt(m[1]) * 7;
  if ((m = s.match(/(\d+)\s*(day|gün|gun|d\b)/))) return parseInt(m[1]);
  if (s.indexOf("repost") !== -1 || s.indexOf("yeniden") !== -1) return -1;

  var dateMatch = s.match(/(\d{1,2})[\.\/\-](\d{1,2})[\.\/\-](\d{2,4})/);
  if (dateMatch) {
    var day = parseInt(dateMatch[1]);
    var month = parseInt(dateMatch[2]) - 1;
    var year = parseInt(dateMatch[3]);
    if (year < 100) year += 2000;
    var posted = new Date(year, month, day);
    if (!isNaN(posted.getTime())) {
      return Math.floor((Date.now() - posted.getTime()) / 86400000);
    }
  }

  return null;
}

function ghostAnalyze(card) {
  var info = GHOST_SITE.extractInfo(card);
  var flags = [];
  var score = 0;
  var lower = (info.text || "").toLowerCase();

  var days = ghostParseDays(info.timeText);
  if (!days && info.datetime) {
    var d = new Date(info.datetime);
    if (!isNaN(d.getTime())) days = Math.floor((Date.now() - d.getTime()) / 86400000);
  }
  if (days === null) {
    var tm = (info.text || "").match(/(\d+\s*(gün|gun|day|hafta|week|ay|month|mo|d|w)\w*\s*(önce|once|ago)?)/i);
    if (tm) days = ghostParseDays(tm[0]);
  }

  if (days !== null && days > GHOST_STALE_DAYS) {
    flags.push(days + " gundur yayinda (>" + GHOST_STALE_DAYS + " gun)");
    score += 30;
  }
  if (days === -1 || lower.indexOf("repost") !== -1 || lower.indexOf("yeniden yayın") !== -1 || lower.indexOf("yeniden yayin") !== -1) {
    flags.push("Yeniden yayinlanmis ilan");
    score += 20;
  }

  var appM = lower.match(/(\d[\d,\.]*)\+?\s*(basvur|applicant|aday|people clicked|applied|kisi)/i);
  if (appM) {
    var n = parseInt(appM[1].replace(/[,\.]/g, ""));
    if (n >= GHOST_HIGH_APPLICANT) { flags.push(n + "+ basvuru (hala acik)"); score += 15; }
  }

  for (var k = 0; k < GHOST_KEYWORDS.length; k++) {
    if (lower.indexOf(GHOST_KEYWORDS[k]) !== -1) { flags.push('"' + GHOST_KEYWORDS[k] + '" ifadesi'); score += 10; }
  }

  if (lower.indexOf("promoted") !== -1 || lower.indexOf("sponsorlu") !== -1 || lower.indexOf("öne çıkan") !== -1 || lower.indexOf("one cikan") !== -1) {
    flags.push("Sponsorlu ilan");
    score += 5;
  }

  if (!info.company || info.company.length < 2) { flags.push("Sirket bilgisi eksik"); score += 15; }

  if ((lower.indexOf("easy apply") !== -1 || lower.indexOf("kolay basvur") !== -1 || lower.indexOf("hemen basvur") !== -1) && days !== null && days > GHOST_STALE_DAYS) {
    flags.push("Kolay Basvuru + uzun suredir acik");
    score += 10;
  }

  return { title: info.title, company: info.company, flags: flags, score: score };
}

function ghostAddBadge(card, result) {
  if (card.el.querySelector(".ghost-badge")) return;
  var level = result.score >= 40 ? "high" : result.score >= 20 ? "medium" : "low";
  var label = level === "high" ? "Yuksek Risk" : level === "medium" ? "Orta Risk" : "Dusuk Risk";
  var badge = document.createElement("span");
  badge.className = "ghost-badge " + level;
  badge.textContent = "\uD83D\uDC7B " + label;
  badge.title = result.flags.join("\n") + "\nSkor: " + result.score;
  card.link.after(badge);
}

function ghostScan() {
  if (location.href.indexOf(GHOST_SITE.jobPagePattern) === -1) return;

  var cards = GHOST_SITE.findCards();
  ghostLog("Bulunan kart: " + cards.length);

  ghostFlagged = [];
  for (var i = 0; i < cards.length; i++) {
    var r = ghostAnalyze(cards[i]);
    if (r.flags.length > 0) {
      ghostAddBadge(cards[i], r);
      ghostFlagged.push({
        title: r.title,
        company: r.company,
        flags: r.flags,
        riskScore: r.score,
        riskLevel: r.score >= 40 ? "high-risk" : r.score >= 20 ? "medium-risk" : "low-risk",
        site: GHOST_SITE.name
      });
    }
  }

  ghostShowStatus(cards.length + " ilan tarandı, " + ghostFlagged.length + " supheli");
  ghostLog("Supheli: " + ghostFlagged.length);

  try {
    chrome.storage.local.set({ flaggedJobs: ghostFlagged, lastSite: GHOST_SITE.name });
  } catch(e) {
    ghostLog("Storage hatasi - durduruluyor");
    ghostStop();
    return;
  }

  if (ghostFlagged.length > 0) {
    try {
      chrome.runtime.sendMessage({ type: "GHOST_JOBS_FOUND", count: ghostFlagged.length });
    } catch(e) {}
  }
}

function ghostStop() {
  if (ghostTimer) { clearInterval(ghostTimer); ghostTimer = null; }
}

function ghostStart() {
  ghostStop();
  ghostLog("Baslatiliyor...");
  ghostShowStatus("Ghost Detector aktif");
  setTimeout(ghostScan, 2000);
  setTimeout(ghostScan, 6000);
  ghostTimer = setInterval(ghostScan, 15000);
}

ghostStart();

try {
  chrome.runtime.onMessage.addListener(function(msg, sender, resp) {
    if (msg.type === "RESCAN") {
      ghostScan();
      resp({ count: ghostFlagged.length });
    }
  });
} catch(e) {}
