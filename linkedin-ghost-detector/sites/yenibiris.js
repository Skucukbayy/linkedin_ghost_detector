var GHOST_SITE = {
  name: "Yenibiris.com",
  jobPagePattern: "/is-ilan",

  findCards: function() {
    var cards = [];
    var seen = new Set();

    var links = document.querySelectorAll("a[href*='/is-ilani/'], a[href*='/ilan/'], a[href*='/is-ilan/']");
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var card = a.closest(".listing-item") || a.closest(".job-card") || a.closest(".job-item") ||
                 a.closest("[data-id]") || a.closest("li") || a.closest("article") ||
                 a.parentElement.parentElement;
      if (!card || seen.has(card)) continue;
      seen.add(card);
      cards.push({ el: card, link: a, href: a.getAttribute("href") || "" });
    }

    if (cards.length === 0) {
      links = document.querySelectorAll("a[href*='ilan']");
      for (var j = 0; j < links.length; j++) {
        var a2 = links[j];
        var href = a2.getAttribute("href") || "";
        if (href.indexOf("ilan") === -1) continue;
        var c = a2.closest("li") || a2.closest("article") || a2.closest("div") || a2.parentElement.parentElement;
        if (!c || seen.has(c) || c === document.body) continue;
        seen.add(c);
        cards.push({ el: c, link: a2, href: href });
      }
    }
    return cards;
  },

  extractInfo: function(card) {
    var text = card.el.textContent || "";

    var title = "";
    var titleEl = card.el.querySelector("h2, h3, .job-title, .position-title, .ilan-title");
    if (titleEl) title = titleEl.textContent.trim();
    if (!title) title = card.link.textContent.trim().split("\n")[0].trim();

    var company = "";
    var compEl = card.el.querySelector(".company-name, .employer-name, .firma, .company");
    if (compEl) {
      company = compEl.textContent.trim();
    } else {
      var spans = card.el.querySelectorAll("span, a, p");
      for (var i = 0; i < spans.length; i++) {
        var st = spans[i].textContent.trim();
        if (st.length > 2 && st.length < 60 && st !== title && !st.match(/^\d/)) {
          company = st;
          break;
        }
      }
    }

    var timeText = "";
    var dateEl = card.el.querySelector(".date, .tarih, time, [data-date], .posting-date");
    if (dateEl) {
      timeText = dateEl.textContent.trim();
    } else {
      var dateMatch = text.match(/(\d{1,2}[\.\/-]\d{1,2}[\.\/-]\d{2,4})/);
      if (dateMatch) timeText = dateMatch[0];
    }

    var datetime = null;
    if (dateEl) {
      datetime = dateEl.getAttribute("datetime") || dateEl.getAttribute("data-date") || null;
    }

    return { title: title, company: company, text: text, timeText: timeText, datetime: datetime };
  }
};
