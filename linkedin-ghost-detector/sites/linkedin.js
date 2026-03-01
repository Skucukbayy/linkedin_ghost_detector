var GHOST_SITE = {
  name: "LinkedIn",
  jobPagePattern: "/jobs",

  findCards: function() {
    var all = document.querySelectorAll("a[href*='jobs']");
    var cards = [];
    var seen = new Set();

    for (var i = 0; i < all.length; i++) {
      var a = all[i];
      var href = a.getAttribute("href") || "";
      if (href.indexOf("/jobs/view/") === -1 && href.indexOf("/jobs/collections/") === -1) continue;
      var card = a.closest("li") || a.closest("div[data-job-id]") || a.parentElement.parentElement;
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
  },

  extractInfo: function(card) {
    var text = card.el.textContent || "";
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
    var timeText = timeEl ? timeEl.textContent.trim() : "";
    var datetime = timeEl ? timeEl.getAttribute("datetime") : null;

    return { title: title, company: company, text: text, timeText: timeText, datetime: datetime };
  }
};
