(function () {
  const payload = window.PRIVATE_TRIP_PAYLOAD;
  const form = document.querySelector(".js-private-form");
  const passphraseInput = document.querySelector(".js-private-passphrase");
  const status = document.querySelector(".js-private-status");
  const content = document.querySelector(".js-private-content");

  if (!payload || !form || !passphraseInput || !status || !content) {
    return;
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

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

  function bytesFromBase64(value) {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }

  async function decryptPrivateTrip(passphrase) {
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(passphrase),
      "PBKDF2",
      false,
      ["deriveKey"]
    );
    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: bytesFromBase64(payload.kdf.salt),
        iterations: payload.kdf.iterations,
        hash: payload.kdf.hash
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );
    const plain = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: bytesFromBase64(payload.cipher.iv)
      },
      key,
      bytesFromBase64(payload.data)
    );

    return JSON.parse(decoder.decode(plain));
  }

  function dateKeyFromDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function parseDayDate(value) {
    const match = text(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
      return null;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    return new Date(year, month - 1, day);
  }

  function parsePlanTime(value, fallbackIndex) {
    const timeText = text(value).trim();
    const direct = timeText.match(/^(\d{1,2})[:：](\d{2})/);

    if (direct) {
      return {
        hours: Number(direct[1]),
        minutes: Number(direct[2])
      };
    }

    if (/[\u671d]|\u5348\u524d/.test(timeText)) {
      return { hours: 9, minutes: 0 };
    }

    if (/\u663c/.test(timeText)) {
      return { hours: 12, minutes: 0 };
    }

    if (/\u5915\u65b9/.test(timeText)) {
      return { hours: 16, minutes: 0 };
    }

    if (/\u591c/.test(timeText)) {
      return { hours: 20, minutes: 0 };
    }

    const fallbackHour = Math.min(23, 8 + fallbackIndex);
    return { hours: fallbackHour, minutes: 0 };
  }

  function planDateTime(day, plan, planIndex) {
    const dayDate = parseDayDate(day.date);
    if (!dayDate) {
      return null;
    }

    const time = parsePlanTime(plan.time, planIndex);
    return new Date(
      dayDate.getFullYear(),
      dayDate.getMonth(),
      dayDate.getDate(),
      time.hours,
      time.minutes,
      0,
      0
    );
  }

  function planKey(dayIndex, planIndex) {
    return `${dayIndex}:${planIndex}`;
  }

  function buildPlanStatus(trip) {
    const now = new Date();
    const todayDate = dateKeyFromDate(now);
    const planStatuses = new Map();
    const datedPlans = [];

    trip.days.forEach((day, dayIndex) => {
      day.plans.forEach((plan, planIndex) => {
        const dateTime = planDateTime(day, plan, planIndex);
        if (!dateTime) {
          return;
        }

        datedPlans.push({
          dateTime,
          dayIndex,
          planIndex,
          key: planKey(dayIndex, planIndex)
        });
      });
    });

    datedPlans.sort((left, right) => {
      const dateDelta = left.dateTime.getTime() - right.dateTime.getTime();
      if (dateDelta !== 0) {
        return dateDelta;
      }

      return left.dayIndex - right.dayIndex || left.planIndex - right.planIndex;
    });

    const nextPlan = datedPlans.find((plan) => plan.dateTime.getTime() >= now.getTime());
    if (nextPlan) {
      planStatuses.set(nextPlan.key, "is-next");
    }

    return { todayDate, planStatuses };
  }

  function renderPlan(plan, dayIndex, planIndex, planStatus) {
    const statusClass = planStatus.planStatuses.get(planKey(dayIndex, planIndex));
    const className = ["plan-item", statusClass].filter(Boolean).join(" ");
    const statusPill = statusClass === "is-next"
      ? `<span class="status-pill">&#27425;&#12398;&#20104;&#23450;</span>`
      : "";
    const link = plan.url
      ? `<a class="plan-link" href="${escapeHtml(plan.url)}" target="_blank" rel="noopener">関連リンクを開く</a>`
      : "";

    return `
      <li class="${className}">
        <div class="plan-time">${escapeHtml(plan.time)}</div>
        <div>
          <div class="plan-title-row">
            <h3>${escapeHtml(plan.title)}</h3>
            ${statusPill}
          </div>
          <div class="plan-place">${escapeHtml(plan.placeLabel)}</div>
          ${plan.memo ? `<p>${escapeHtml(plan.memo)}</p>` : ""}
          ${link}
        </div>
      </li>
    `;
  }

  function renderDay(day, dayIndex, planStatus) {
    const className = ["day-block", day.date === planStatus.todayDate ? "is-today" : ""]
      .filter(Boolean)
      .join(" ");

    return `
      <article class="${className}">
        <div class="day-heading">
          <div>
            <h2>${escapeHtml(day.label)}</h2>
            <span>${escapeHtml(day.theme)}</span>
          </div>
        </div>
        <ol class="timeline">
          ${day.plans.map((plan, planIndex) => renderPlan(plan, dayIndex, planIndex, planStatus)).join("")}
        </ol>
      </article>
    `;
  }

  function renderMap(map) {
    if (!map || !map.url) {
      return "";
    }

    return `
      <section class="map-panel" aria-label="Google Maps">
        <div class="map-panel-copy">
          <p class="map-kicker">Google Maps</p>
          <h2>${escapeHtml(map.title || "地図")}</h2>
          ${map.memo ? `<p>${escapeHtml(map.memo)}</p>` : ""}
        </div>
        <a class="button map-button" href="${escapeHtml(map.url)}" target="_blank" rel="noopener">
          &#22320;&#22259;&#12434;&#38283;&#12367;
        </a>
      </section>
    `;
  }

  function renderPrivateTrip(trip) {
    const planStatus = buildPlanStatus(trip);

    content.hidden = false;
    content.innerHTML = `
      <div class="section-header">
        <div>
          <h2>${escapeHtml(trip.title)}</h2>
          <p>${escapeHtml(trip.subtitle)}</p>
        </div>
      </div>
      <div class="grid private-summary">
        <article class="card">
          <h3>日程</h3>
          <p>${escapeHtml(trip.dates)}</p>
        </article>
        <article class="card">
          <h3>メンバー</h3>
          <p>${escapeHtml(trip.companions)}</p>
        </article>
        <article class="card">
          <h3>元データ</h3>
          <p>${escapeHtml(trip.source)}</p>
        </article>
      </div>
      ${renderMap(trip.map)}
      <div class="private-days">
        ${trip.days.map((day, dayIndex) => renderDay(day, dayIndex, planStatus)).join("")}
      </div>
      <aside class="note-panel">
        <h2>旅程の扱い</h2>
        <ul class="note-list">
          ${trip.notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}
        </ul>
      </aside>
    `;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const passphrase = passphraseInput.value;

    if (!passphrase) {
      status.textContent = "パスフレーズを入力してください。";
      return;
    }

      status.textContent = "旅程を確認中です...";
    form.querySelector("button").disabled = true;

    try {
      const trip = await decryptPrivateTrip(passphrase);
      renderPrivateTrip(trip);
      const lockSection = form.closest(".private-lock");
      if (lockSection) {
        lockSection.hidden = true;
      }
      status.textContent = "旅程を開きました。";
      passphraseInput.value = "";
    } catch (_error) {
      content.hidden = true;
      content.innerHTML = "";
      status.textContent = "旅程を開けませんでした。パスフレーズを確認してください。";
    } finally {
      form.querySelector("button").disabled = false;
    }
  });
})();
