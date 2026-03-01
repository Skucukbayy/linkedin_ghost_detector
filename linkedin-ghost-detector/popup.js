function renderJobs(jobs) {
  var list = document.getElementById("jobList");
  var highEl = document.getElementById("highCount");
  var medEl = document.getElementById("medCount");
  var lowEl = document.getElementById("lowCount");

  if (!jobs || jobs.length === 0) {
    list.innerHTML = '<div class="empty"><div class="icon">✅</div>Supheli ilan tespit edilmedi.</div>';
    highEl.textContent = "0";
    medEl.textContent = "0";
    lowEl.textContent = "0";
    return;
  }

  jobs.sort(function(a, b) { return b.riskScore - a.riskScore; });

  var high = 0, med = 0, low = 0;
  for (var i = 0; i < jobs.length; i++) {
    if (jobs[i].riskLevel === "high-risk") high++;
    else if (jobs[i].riskLevel === "medium-risk") med++;
    else low++;
  }

  highEl.textContent = high;
  medEl.textContent = med;
  lowEl.textContent = low;

  var html = "";
  for (var j = 0; j < jobs.length; j++) {
    var job = jobs[j];
    var flagsHtml = "";
    for (var k = 0; k < job.flags.length; k++) {
      flagsHtml += '<span class="flag-tag">' + job.flags[k] + '</span>';
    }
    html += '<div class="job-item ' + job.riskLevel + '">' +
      '<div class="title">' + (job.title || "Baslik yok") + '</div>' +
      '<div class="company">' + (job.company || "Sirket belirtilmemis") + (job.site ? ' <span style="opacity:0.5;font-size:9px">(' + job.site + ')</span>' : '') + '</div>' +
      '<div class="flags">' + flagsHtml + '</div></div>';
  }
  list.innerHTML = html;
}

chrome.storage.local.get("flaggedJobs", function(data) {
  renderJobs(data.flaggedJobs || []);
});

document.getElementById("rescan").addEventListener("click", function() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: "RESCAN" }, function(resp) {
        setTimeout(function() {
          chrome.storage.local.get("flaggedJobs", function(data) {
            renderJobs(data.flaggedJobs || []);
          });
        }, 1000);
      });
    }
  });
});
