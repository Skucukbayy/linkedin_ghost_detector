var GHOST_STALE_DAYS = 30;
var GHOST_HIGH_APPLICANT = 200;
var GHOST_KEYWORDS = ["always hiring","ongoing","continuous","talent pool","pipeline","evergreen","future opportunities"];
var ghostFlagged = [];
var ghostTimer = null;

function ghostLog(msg) {
  console.log("[GhostDetector] " + msg);
}

function ghostShowStatus(text) {
  var el = document.getElementById("ghost-detector-status");
  if (!el) {
    el = document.createElement("div");
    el.id = "ghost-detector-status";
    document.body.appendChild(el);
  }
  el.textContent = text;
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
  if ((m = s.match(/(\d+)\s*(day|gün|d\b)/))) return parseInt(m[1]);
  if (s.indexOf("repost") !== -1 || s.indexOf("yeniden") !== -1) return -1;
  return null;
}

function ghostFindCards() {
  var all = document.querySelectorAll("a[href*='jobs']");
  var cards = [];
  var seen = new Set();

  for (var i = 0; i < all.length; i++) {
    var a = all[i];
    var href = a.getAttribute("href") || "";
    if (href.indexOf("/jobs/view/") === -1 && href.indexOf("/jobs/collections/") === -1) continue;

    var card = a.closest("li") || a.closest("div[data-job-id]") || a.closest("[class*='card']") || a.parentElement.parentElement;
    if (!card || seen.has(card)) continue;
    seen.add(card);
    cards.push({ el: card, link: a, href: href });
  }

  if (cards.length === 0) {
    all = document.querySelectorAll("a");
    for (var j = 0; j < all.length; j++) {
      var a2 = all[j];
      var h = a2.getAttribute("href") || "";
      if (h.indexOf("/jobs/view/") === -1) continue;
      var c = a2.closest("li") || a2.parentElement.parentElement;
      if (!c || seen.has(c)) continue;
      seen.add(c);
      cards.push({ el: c, link: a2, href: h });
    }
  }

  return cards;
}

function ghostAnalyze(card) {
  var flags = [];
  var score = 0;
  var text = card.el.textContent || "";
  var lower = text.toLowerCase();

  var title = "";
  var strong = card.link.querySelector("strong") || card.link.querySelector("span");
  if (strong) title = strong.textContent.trim();
  if (!title) title = card.link.textContent.trim().split("\n")[0].trim();

  var company = "";
  var spans = card.el.querySelectorAll("span");
  for (var i = 0; i < spans.length; i++) {
    var st = spans[i].textContent.trim();
    if (st.length > 2 && st.length < 60 && st !== title && !st.match(/^\d/) && st.indexOf("Easy Apply") === -1 && st.indexOf("Promoted") === -1) {
      company = st;
      break;
    }
  }

  var timeEl = card.el.querySelector("time");
  var days = null;
  if (timeEl) {
    days = ghostParseDays(timeEl.textContent);
    if (!days && timeEl.getAttribute("datetime")) {
      var d = new Date(timeEl.getAttribute("datetime"));
      if (!isNaN(d.getTime())) days = Math.floor((Date.now() - d.getTime()) / 86400000);
    }
  }
  if (!days) {
    var tm = text.match(/(\d+\s*(gün|day|hafta|week|ay|month|mo|d|w)\w*\s*(önce|ago)?)/i);
    if (tm) days = ghostParseDays(tm[0]);
  }
  if (days === null && (lower.indexOf("repost") !== -1 || lower.indexOf("yeniden") !== -1)) days = -1;

  if (days !== null && days > GHOST_STALE_DAYS) {
    flags.push(days + " gundur yayinda (>" + GHOST_STALE_DAYS + " gun)");
    score += 30;
  }
  if (days === -1 || lower.indexOf("repost") !== -1 || lower.indexOf("yeniden yayın") !== -1) {
    flags.push("Yeniden yayinlanmis ilan");
    score += 20;
  }

  var appM = lower.match(/(\d[\d,\.]*)\+?\s*(basvur|applicant|aday|people clicked|applied)/i);
  if (appM) {
    var n = parseInt(appM[1].replace(/[,\.]/g, ""));
    if (n >= GHOST_HIGH_APPLICANT) { flags.push(n + "+ basvuru (hala acik)"); score += 15; }
  }

  for (var k = 0; k < GHOST_KEYWORDS.length; k++) {
    if (lower.indexOf(GHOST_KEYWORDS[k]) !== -1) { flags.push('"' + GHOST_KEYWORDS[k] + '" ifadesi'); score += 10; }
  }

  if (lower.indexOf("promoted") !== -1 || lower.indexOf("sponsorlu") !== -1) { flags.push("Sponsorlu ilan"); score += 5; }
  if (!company || company.length < 2) { flags.push("Sirket bilgisi eksik"); score += 15; }

  if ((lower.indexOf("easy apply") !== -1 || lower.indexOf("kolay basvur") !== -1) && days !== null && days > GHOST_STALE_DAYS) {
    flags.push("Easy Apply + uzun suredir acik");
    score += 10;
  }

  return { title: title, company: company, flags: flags, score: score };
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
  if (location.href.indexOf("/jobs") === -1) return;

  var cards = ghostFindCards();
  ghostLog("Bulunan kart: " + cards.length + " | URL: " + location.href);

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
        riskLevel: r.score >= 40 ? "high-risk" : r.score >= 20 ? "medium-risk" : "low-risk"
      });
    }
  }

  ghostShowStatus("Tarama: " + cards.length + " ilan, " + ghostFlagged.length + " supheli");
  ghostLog("Supheli: " + ghostFlagged.length);

  try {
    chrome.storage.local.set({ flaggedJobs: ghostFlagged });
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
