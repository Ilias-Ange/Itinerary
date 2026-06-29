(function () {
  const data = window.TRIP_DATA;
  const page = document.body.dataset.page;
  const storageKey = "travel-booklet-packing";

  if (!data) {
    return;
  }

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function text(value) {
    return value == null ? "" : String(value);
  }

  function escapeHtml(value) {
    return text(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function parseDateTime(date, time) {
    if (!date) {
      return null;
    }

    const cleanTime = time && /^\d{2}:\d{2}$/.test(time) ? time : "00:00";
    const parsed = new Date(`${date}T${cleanTime}:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function todayDateKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatDate(dateString) {
    const parsed = parseDateTime(dateString, "00:00");
    if (!parsed) {
      return dateString;
    }

    return new Intl.DateTimeFormat("ja-JP", {
      month: "numeric",
      day: "numeric",
      weekday: "short"
    }).format(parsed);
  }

  function allPlans() {
    return data.days.flatMap((day) =>
      day.plans.map((plan, index) => ({
        ...plan,
        day,
        index,
        dateTime: parseDateTime(day.date, plan.time)
      }))
    );
  }

  function planStatus(plan) {
    const now = new Date();
    const plans = allPlans().filter((item) => item.dateTime);
    const next = plans.find((item) => item.dateTime >= now);
    const sameDate = plan.day.date === todayDateKey();

    if (sameDate) {
      return { className: "is-current", label: "今日" };
    }

    if (next && next.day.date === plan.day.date && next.time === plan.time && next.title === plan.title) {
      return { className: "is-next", label: "次の予定" };
    }

    return { className: "", label: "" };
  }

  function renderPlan(plan) {
    const status = planStatus(plan);
    const link = plan.url
      ? `<a class="plan-link" href="${escapeHtml(plan.url)}" target="_blank" rel="noopener">リンクを開く</a>`
      : "";
    const pill = status.label ? `<span class="status-pill">${escapeHtml(status.label)}</span>` : "";

    return `
      <li class="plan-item ${status.className}">
        <div class="plan-time">${escapeHtml(plan.time)}</div>
        <div>
          <div class="plan-title-row">
            <h3>${escapeHtml(plan.title)}</h3>
            ${pill}
          </div>
          <div class="plan-place">${escapeHtml(plan.placeLabel)}</div>
          <p>${escapeHtml(plan.memo)}</p>
          ${link}
        </div>
      </li>
    `;
  }

  function renderDay(day) {
    const isToday = day.date === todayDateKey();
    return `
      <article class="day-block ${isToday ? "is-today" : ""}">
        <div class="day-heading">
          <div>
            <h2>${escapeHtml(day.label)}</h2>
            <span>${escapeHtml(formatDate(day.date))} / ${escapeHtml(day.theme)}</span>
          </div>
        </div>
        <ol class="timeline">
          ${day.plans.map((plan) => renderPlan({ ...plan, day })).join("")}
        </ol>
      </article>
    `;
  }

  function renderNotes(root) {
    root.innerHTML = data.notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("");
  }

  function renderHeader() {
    $$(".js-trip-title").forEach((node) => {
      node.textContent = data.title;
    });
    $$(".js-trip-dates").forEach((node) => {
      node.textContent = data.dates;
    });
    $$(".js-trip-destination").forEach((node) => {
      node.textContent = data.destination;
    });
  }

  function renderHome() {
    const meeting = $(".js-meeting");
    const dayPreview = $(".js-day-preview");
    const notes = $(".js-notes");

    if (meeting) {
      meeting.innerHTML = `
        <dl class="meta-list">
          <div><dt>${escapeHtml(data.meeting.label)}</dt><dd>${escapeHtml(formatDate(data.meeting.date))} ${escapeHtml(data.meeting.time)}</dd></div>
          <div><dt>場所</dt><dd>${escapeHtml(data.meeting.placeLabel)}</dd></div>
          <div><dt>メモ</dt><dd>${escapeHtml(data.meeting.memo)}</dd></div>
        </dl>
      `;
    }

    if (dayPreview) {
      dayPreview.innerHTML = data.days.map((day) => `
        <article class="card day-summary">
          <h3>${escapeHtml(day.label)}</h3>
          <p>${escapeHtml(formatDate(day.date))} / ${escapeHtml(day.theme)}</p>
          <a class="mini-link" href="schedule.html#${escapeHtml(day.date)}">予定を見る</a>
        </article>
      `).join("");
    }

    if (notes) {
      renderNotes(notes);
    }
  }

  function renderSchedule() {
    const schedule = $(".js-schedule");
    if (!schedule) {
      return;
    }

    schedule.innerHTML = data.days.map((day) => {
      const markup = renderDay(day);
      return markup.replace("<article", `<article id="${escapeHtml(day.date)}"`);
    }).join("");
  }

  function loadPackingState() {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || {};
    } catch (_error) {
      return {};
    }
  }

  function savePackingState(state) {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }

  function updateProgress() {
    const checks = $$(".js-pack-check");
    const checked = checks.filter((input) => input.checked).length;
    const total = checks.length;
    const percent = total ? Math.round((checked / total) * 100) : 0;

    const label = $(".js-pack-progress-label");
    const bar = $(".js-pack-progress-bar");
    if (label) {
      label.textContent = `${checked}/${total} 完了`;
    }
    if (bar) {
      bar.style.width = `${percent}%`;
    }
  }

  function renderPacking() {
    const packing = $(".js-packing");
    if (!packing) {
      return;
    }

    const state = loadPackingState();
    packing.innerHTML = data.packing.map((group, groupIndex) => `
      <section class="packing-group">
        <h2>${escapeHtml(group.category)}</h2>
        <ul class="check-list">
          ${group.items.map((item, itemIndex) => {
            const id = `pack-${groupIndex}-${itemIndex}`;
            const checked = state[id] ? "checked" : "";
            return `
              <li class="check-item">
                <label for="${id}">
                  <input class="js-pack-check" id="${id}" type="checkbox" ${checked}>
                  <span>${escapeHtml(item)}</span>
                </label>
              </li>
            `;
          }).join("")}
        </ul>
      </section>
    `).join("");

    $$(".js-pack-check").forEach((input) => {
      input.addEventListener("change", () => {
        const currentState = loadPackingState();
        currentState[input.id] = input.checked;
        savePackingState(currentState);
        updateProgress();
      });
    });

    const resetButton = $(".js-reset-packing");
    if (resetButton) {
      resetButton.addEventListener("click", () => {
        localStorage.removeItem(storageKey);
        $$(".js-pack-check").forEach((input) => {
          input.checked = false;
        });
        updateProgress();
      });
    }

    updateProgress();
  }

  function renderLinks() {
    const links = $(".js-links");
    const notes = $(".js-notes");

    if (links) {
      links.innerHTML = data.links.map((link) => `
        <a class="link-card" href="${escapeHtml(link.url)}" target="_blank" rel="noopener">
          <strong>${escapeHtml(link.label)}</strong>
          <span>${escapeHtml(link.memo)}</span>
        </a>
      `).join("");
    }

    if (notes) {
      renderNotes(notes);
    }
  }

  renderHeader();

  if (page === "home") {
    renderHome();
  } else if (page === "schedule") {
    renderSchedule();
  } else if (page === "packing") {
    renderPacking();
  } else if (page === "links") {
    renderLinks();
  }
})();
