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

  function renderPlan(plan) {
    const link = plan.url
      ? `<a class="plan-link" href="${escapeHtml(plan.url)}" target="_blank" rel="noopener">関連リンクを開く</a>`
      : "";

    return `
      <li class="plan-item">
        <div class="plan-time">${escapeHtml(plan.time)}</div>
        <div>
          <div class="plan-title-row">
            <h3>${escapeHtml(plan.title)}</h3>
          </div>
          <div class="plan-place">${escapeHtml(plan.placeLabel)}</div>
          ${plan.memo ? `<p>${escapeHtml(plan.memo)}</p>` : ""}
          ${link}
        </div>
      </li>
    `;
  }

  function renderDay(day) {
    return `
      <article class="day-block">
        <div class="day-heading">
          <div>
            <h2>${escapeHtml(day.label)}</h2>
            <span>${escapeHtml(day.theme)}</span>
          </div>
        </div>
        <ol class="timeline">
          ${day.plans.map(renderPlan).join("")}
        </ol>
      </article>
    `;
  }

  function renderPrivateTrip(trip) {
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
      <div class="private-days">
        ${trip.days.map(renderDay).join("")}
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
