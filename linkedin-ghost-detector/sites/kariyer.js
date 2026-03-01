var GHOST_SITE = {
  name: "Kariyer.net",
  jobPagePattern: "/is-ilan",

  findCards: function() {
    var cards = [];
    var seen = new Set();

    var links = document.querySelectorAll("a[href*='/is-ilani/']");
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var card = a.closest(".listing-item") || a.closest(".job-card") || a.closest(".job-listing") ||
                 a.closest("[data-job-id]") || a.closest("li") || a.closest("div.k-ad") ||
                 a.closest(".k-list-item") || a.parentElement.parentElement;
      if (!card || seen.has(card)) continue;
      seen.add(card);
      cards.push({ el: card, link: a, href: a.getAttribute("href") || "" });
    }
    return cards;
  },

  extractInfo: function(card) {
    var text = card.el.textContent || "";

    var title = "";
    var titleEl = card.el.querySelector(".job-title, .position-title, h2, h3");
    if (titleEl) title = titleEl.textContent.trim();
    if (!title) title = card.link.textContent.trim().split("\n")[0].trim();

    var company = "";
    var compEl = card.el.querySelector(".company-name, .employer-name, .company-title");
    if (compEl) {
      company = compEl.textContent.trim();
    } else {
      var spans = card.el.querySelectorAll("span, a");
      for (var i = 0; i < spans.length; i++) {
        var st = spans[i].textContent.trim();
        if (st.length > 2 && st.length < 60 && st !== title && !st.match(/^\d/)) {
          company = st;
          break;
        }
      }
    }

    var timeText = "";
    var dateEl = card.el.querySelector(".posting-date, .job-date, .update-time, [data-date], time");
    if (dateEl) {
      timeText = dateEl.textContent.trim();
    } else {
      var dateMatch = text.match(/(\d{1,2}[\.\/-]\d{1,2}[\.\/-]\d{2,4})/);
      if (dateMatch) timeText = dateMatch[0];
    }

    var datetime = null;
    if (dateEl && dateEl.getAttribute("datetime")) datetime = dateEl.getAttribute("datetime");
    if (dateEl && dateEl.getAttribute("data-date")) datetime = dateEl.getAttribute("data-date");

    return { title: title, company: company, text: text, timeText: timeText, datetime: datetime };
  }
};
