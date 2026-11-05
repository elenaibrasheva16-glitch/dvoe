// ============================================================================
// ChibiLove (ЧибиПара) — Main Frontend Application Controller (v12 - Pet Edition)
// Features Cute Selectable Pets, 60fps Cartoon Animations, Petting Physics,
// Feeding, Bathing, Sleeping, Couple Room Bonding & Restore Economy (200 Hearts).
// ============================================================================

(function () {
  "use strict";

  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  if (tg) {
    try {
      tg.ready();
      tg.expand();
    } catch (e) {}
  }

  function detectAuthenticatedUsername() {
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.username) {
      return tg.initDataUnsafe.user.username.toLowerCase();
    }
    if (typeof URLSearchParams !== "undefined" && window.location && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tg_user")) {
        return params.get("tg_user").trim().replace(/^@/, "").toLowerCase();
      }
    }
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user && tg.initDataUnsafe.user.id) {
      return "user_" + tg.initDataUnsafe.user.id;
    }
    return "demo_user";
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  const STATE = {
    username: detectAuthenticatedUsername(),
    activeTab: "care",          // 'care', 'together', 'pet', 'settings'
    showFoodTray: false,
    showHeartsModal: false,
    showSupportModal: false,
    showAnniversaryModal: false,
    activeMilestoneModal: null,
    draftMood: null,
    draftMoodTag: "missing_you",
    buyingStars: false,
    partnerInput: "",
    draftAvatar: null,
    serverData: null,
    loading: true,
  };

  function haptic(type = "light") {
    try {
      if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred(type);
      }
    } catch (e) {}
  }

  function showToast(msg) {
    let el = document.getElementById("toast-box");
    if (!el) {
      el = document.createElement("div");
      el.id = "toast-box";
      el.className = "toast-box";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = "1";
    clearTimeout(el._timer);
    el._timer = setTimeout(() => {
      el.style.opacity = "0";
    }, 2800);
  }

  function spawnParticles(emojis = ["💕", "✨", "🌸"]) {
    const container = document.getElementById("fx-overlay");
    if (!container) return;
    for (let i = 0; i < 7; i++) {
      const span = document.createElement("span");
      span.className = "fx-particle";
      span.textContent = emojis[i % emojis.length];
      const offsetX = (Math.random() - 0.5) * 160;
      const offsetY = (Math.random() - 0.5) * 80;
      span.style.left = `calc(50% + ${offsetX}px)`;
      span.style.top = `calc(50% + ${offsetY}px)`;
      span.style.animationDelay = `${i * 0.08}s`;
      container.appendChild(span);
      setTimeout(() => span.remove(), 1600);
    }
  }

  function applyBackgroundTheme(themeId) {
    const themes = (window.CHIBI_CONFIG && window.CHIBI_CONFIG.pastelThemes) || [];
    const found = themes.find((t) => t.id === themeId) || themes[0];
    if (found && found.bg) {
      document.documentElement.style.setProperty("--bg-gradient", found.bg);
    }
  }

  async function apiGetState(silent = false) {
    try {
      const tgUser = tg && tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user : null;
      let qStr = `username=${encodeURIComponent(STATE.username)}`;
      if (tgUser && tgUser.id) {
        qStr += `&tg_id=${encodeURIComponent(tgUser.id)}`;
        if (tgUser.first_name) qStr += `&name=${encodeURIComponent(tgUser.first_name)}`;
      }
      const res = await fetch(`/api/state?${qStr}`);
      const data = await res.json();
      if (data && data.ok) {
        const prevPartnerMood = STATE.serverData && STATE.serverData.partner && STATE.serverData.partner.mood;
        STATE.serverData = data;
        if (!STATE.draftAvatar) {
          STATE.draftAvatar = window.normalizeAvatar(data.user.avatar || data.user.pet);
        }
        applyBackgroundTheme(data.user.bgColor);
        if (silent && prevPartnerMood && data.partner && prevPartnerMood !== data.partner.mood) {
          // Partner mood changed while app was open!
          const mMeta = window.getMoodMeta(data.partner.mood);
          spawnParticles([mMeta.emoji, "✨", "💕"]);
          showToast(`Половинка обновила настроение: ${mMeta.label}!`);
          renderApp();
        }
      }
    } catch (e) {
      if (!silent) console.error("Failed to fetch state:", e);
    } finally {
      if (!silent) {
        STATE.loading = false;
        renderApp();
      }
    }
  }

  async function apiPost(path, payload = {}) {
    try {
      const body = Object.assign({ username: STATE.username }, payload);
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || data.ok === false) {
        if (data && data.needHearts) {
          STATE.showHeartsModal = true;
          renderApp();
        }
        showToast((data && data.error) || "Ошибка запроса");
        return null;
      }
      if (data.user) {
        STATE.serverData = data;
        applyBackgroundTheme(data.user.bgColor);
        renderApp();
      }
      return data;
    } catch (e) {
      showToast("Ошибка соединения с сервером");
      return null;
    }
  }

  // Hook for Pet Engine: when user strokes/pets pet with finger or mouse (throttled to 1 post per 2.5s)
  let lastPetPostTime = 0;
  window.onPartner3DPetted = function () {
    const now = Date.now();
    if (now - lastPetPostTime > 2500) {
      lastPetPostTime = now;
      apiPost("/api/care/pet", {});
    }
  };

  window.APP = {
    switchTab(tab) {
      haptic("light");
      STATE.activeTab = tab;
      if (tab === "pet" && STATE.serverData) {
        STATE.draftAvatar = window.normalizeAvatar(STATE.serverData.user.avatar || STATE.serverData.user.pet);
      }
      renderApp();
    },

    toggleFoodTray() {
      haptic("light");
      STATE.showFoodTray = !STATE.showFoodTray;
      renderApp();
    },

    async feedPet(foodIcon, foodName) {
      haptic("medium");
      STATE.showFoodTray = false;
      const targetObj = (STATE.serverData && (STATE.serverData.partner || STATE.serverData.user)) || {};
      const c = targetObj.care || {};
      if (c.hungerPercent >= 100) {
        if (window.Chibi2D) {
          window.Chibi2D.showBubble("Я уже так наелся! Животик полный! 😋 Спасибо! 💕", 3200);
        }
        showToast("Питомец уже сыт и доволен (100%)! 😋");
        return;
      }
      if (window.Chibi2D) {
        window.Chibi2D.playCareAction("feed", foodIcon || "🍰");
      }
      const res = await apiPost("/api/care/action", {
        action: "feed",
        itemName: `${foodName} ${foodIcon}`,
      });
      if (res) {
        spawnParticles([foodIcon, "😋", "💖", "✨"]);
        showToast(`Питомец сыт и счастлив: ${foodName}! 🍰`);
      }
    },

    async showerPet() {
      haptic("medium");
      if (window.Chibi2D) {
        window.Chibi2D.playCareAction("shower");
      }
      const res = await apiPost("/api/care/action", { action: "shower" });
      if (res) {
        spawnParticles(["🫧", "🛁", "✨", "⭐", "💧"]);
        showToast("Питомец искупался в пене! Шёрстка чистая и сияет ✨");
      }
    },

    async sleepPet() {
      haptic("medium");
      const targetObj = (STATE.serverData && (STATE.serverData.partner || STATE.serverData.user)) || {};
      const c = targetObj.care || {};
      if (!c.isSleeping && (c.energyPercent >= 100)) {
        if (window.Chibi2D) {
          window.Chibi2D.showBubble("Я совсем не хочу спать, я полон энергии! ⚡ Давай играть! 🐾", 3200);
        }
        showToast("Питомец полон сил (100%) и совсем не хочет спать! ⚡");
        return;
      }
      if (window.Chibi2D) {
        window.Chibi2D.playCareAction("sleep");
      }
      const res = await apiPost("/api/care/action", { action: "sleep" });
      if (res) {
        const target = res.partner || res.user;
        const sleeping = target && target.care && target.care.isSleeping;
        spawnParticles(sleeping ? ["🌙", "💤", "⭐"] : ["☀️", "🌸", "✨"]);
        showToast(sleeping ? "Питомец уютно укутан в одеялко 🌙" : "Питомец проснулся и бодр ☀️");
      }
    },

    petPet() {
      haptic("medium");
      if (window.Chibi2D) {
        window.Chibi2D.playWithPet();
      }
      apiPost("/api/care/action", { action: "pet" });
    },

    async claimDailyReward() {
      haptic("medium");
      const res = await apiPost("/api/claim-daily", {});
      if (res && res.ok) {
        spawnParticles(["🎁", "💕", "✨", "🔥"]);
        showToast("Ежедневная награда +10 💕 получена! 🎁");
        apiGetState();
      }
    },

    async restorePair(useFree = false) {
      haptic("medium");
      const res = await apiPost("/api/restore-streak", { useFree: Boolean(useFree) });
      if (res && res.ok) {
        spawnParticles(["🔥", "💞", "✨", "🎁"]);
        showToast(useFree ? "Бесплатное восстановление успешно! Огонёк снова горит 🔥" : "Пара восстановлена за 200 💕! Огонёк снова горит 🔥");
        apiGetState();
      }
    },

    async restorePartner(useFree = false) {
      return this.restorePair(useFree);
    },

    selectPetSpecies(speciesId) {
      haptic("light");
      if (!STATE.draftAvatar) {
        STATE.draftAvatar = window.normalizeAvatar({});
      }
      STATE.draftAvatar.species = speciesId;
      const petMeta = window.getPetById(speciesId);
      if (petMeta) {
        STATE.draftAvatar.name = petMeta.name;
        if (window.Chibi2D) {
          window.Chibi2D.showBubble(petMeta.quote, 2800);
        }
      }
      renderApp();
    },

    updatePetName(nameVal) {
      if (!STATE.draftAvatar) {
        STATE.draftAvatar = window.normalizeAvatar({});
      }
      STATE.draftAvatar.name = nameVal.trim() || "Зефирка";
    },

    selectTheme(themeId) {
      haptic("light");
      applyBackgroundTheme(themeId);
      apiPost("/api/settings", { bgColor: themeId });
    },

    randomizePet() {
      haptic("medium");
      STATE.draftAvatar = window.randomizeAvatar();
      spawnParticles(["🎲", "🐾", "✨", "💖"]);
      showToast(`Выбран случайный питомец: ${STATE.draftAvatar.name}!`);
      renderApp();
    },

    async savePet() {
      haptic("medium");
      const nameInput = document.getElementById("pet-name-input");
      if (nameInput && nameInput.value.trim()) {
        STATE.draftAvatar.name = nameInput.value.trim();
      }
      const res = await apiPost("/api/avatar", { avatar: STATE.draftAvatar });
      if (res) {
        spawnParticles(["✨", "🐾", "💖", "🌸"]);
        showToast("Твой питомец сохранён и обновлён! 🐾");
      }
    },

    async sendPairRequest() {
      const inp = document.getElementById("partner-username-input");
      const val = inp ? inp.value.trim() : STATE.partnerInput;
      if (!val) {
        showToast("Введи @username партнёра!");
        return;
      }
      haptic("medium");
      STATE.partnerInput = val;
      const res = await apiPost("/api/pair/request", { partnerUsername: val });
      if (res) {
        showToast(`Запрос отправлен пользователю @${val.replace(/^@/, "")}! 💌`);
      }
    },

    async respondPairRequest(reqId, fromUsername, action) {
      haptic("medium");
      const res = await apiPost("/api/pair/respond", { requestId: reqId, fromUsername, action });
      if (res && action === "accept") {
        spawnParticles(["💞", "🔥", "🌸"]);
        showToast("Вы связали пару! Огонёк зажжён 🔥");
      }
    },

    async unlinkPartner() {
      haptic("light");
      if (confirm("Точно отвязать пару? Огонёк погаснет.")) {
        await apiPost("/api/pair/unlink", {});
        showToast("Пара отвязана");
      }
    },

    async copyInviteLink(link) {
      haptic("light");
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(link);
          showToast("Ссылка скопирована в буфер! 📋");
          return;
        }
      } catch (e) {}
      showToast("Ссылка: " + link);
    },

    selectMood(moodId) {
      haptic("light");
      STATE.draftMood = moodId;
      renderApp();
    },

    selectMoodTag(tagId) {
      haptic("light");
      STATE.draftMoodTag = tagId;
      renderApp();
    },

    async saveMoodWithReason() {
      haptic("medium");
      const currentMood = STATE.draftMood || (STATE.serverData && STATE.serverData.user && STATE.serverData.user.mood) || "joyful";
      const currentTag = STATE.draftMoodTag || (STATE.serverData && STATE.serverData.user && STATE.serverData.user.moodTag) || "missing_you";
      const meta = window.getMoodMeta ? window.getMoodMeta(currentMood) : { emoji: "🥰", label: "Радостное" };
      const moodLabel = `${meta.emoji} ${meta.label}`;
      const reasonInput = document.getElementById("mood-reason-input");
      const reason = reasonInput ? reasonInput.value.trim() : "";

      const res = await apiPost("/api/mood", {
        mood: currentMood,
        moodLabel: moodLabel,
        moodTag: currentTag,
        moodReason: reason,
      });
      if (res) {
        spawnParticles([meta.emoji, "💭", "💞", "✨"]);
        showToast("Настроение передано половинке! ✨");
      }
    },

    async reactToPartnerMood(reactionId) {
      haptic("medium");
      const rxMeta = window.getReactionMeta ? window.getReactionMeta(reactionId) : { icon: "🫂", label: "Обнять", soundMsg: "крепко обнимает тебя!" };
      const res = await apiPost("/api/mood/react", { reaction: reactionId });
      if (res) {
        spawnParticles([rxMeta.icon, "💖", "✨", "🌸"]);
        showToast(`Ты отправил(а) реакцию «${rxMeta.label}» половинке! ${rxMeta.icon}`);
      }
    },

    openAnniversaryModal(show = true) {
      haptic("light");
      STATE.showAnniversaryModal = Boolean(show);
      renderApp();
    },

    setQuickAnniversaryPreset(daysAgo) {
      haptic("light");
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const inp = document.getElementById("anniversary-date-input");
      if (inp) inp.value = iso;
    },

    async saveAnniversaryDate() {
      haptic("medium");
      const inp = document.getElementById("anniversary-date-input");
      const val = inp ? inp.value.trim() : "";
      if (!val) {
        showToast("Выбери дату годовщины!");
        return;
      }
      const res = await apiPost("/api/couple/anniversary", { anniversaryDate: val });
      if (res) {
        spawnParticles(["📅", "💕", "✨", "🎉"]);
        showToast("Дата годовщины сохранена для вашей пары! 💕");
        STATE.showAnniversaryModal = false;
        renderApp();
      }
    },

    openMilestoneModal(milestone) {
      haptic("light");
      STATE.activeMilestoneModal = milestone;
      if (milestone) {
        spawnParticles(["🏆", "✨", "🌟", "🎉"]);
      }
      renderApp();
    },

    celebrateMilestone(days) {
      haptic("medium");
      spawnParticles(["🎉", "✨", "💖", "🌟", "🍰", "🎈"]);
      showToast(`Поздравляем с юбилеем любви: ${days} ${window.pluralRu ? window.pluralRu(days, "день", "дня", "дней") : "дней"} вместе! 🎂`);
    },

    openHeartsModal(show = true) {
      haptic("light");
      STATE.showHeartsModal = show;
      renderApp();
    },

    async buyStarsPackage(pkgKey) {
      haptic("medium");
      STATE.buyingStars = true;
      renderApp();
      try {
        const res = await apiPost("/api/stars/invoice", { packageKey: pkgKey });
        if (res && res.invoiceUrl && tg && tg.openInvoice) {
          tg.openInvoice(res.invoiceUrl, (status) => {
            STATE.buyingStars = false;
            if (status === "paid") {
              spawnParticles(["⭐", "💕", "✨"]);
              showToast("Оплата через Telegram Stars прошла успешно! ⭐️");
              apiGetState();
            } else if (status === "failed") {
              showToast("Оплата была отменена или не удалась");
              renderApp();
            } else {
              renderApp();
            }
          });
          return;
        }
        showToast("Счёт создан. Доступно при открытии внутри Telegram");
      } catch (e) {
        showToast("Ошибка при создании счёта");
      } finally {
        STATE.buyingStars = false;
        renderApp();
      }
    },

    openSupportModal(show = true) {
      haptic("light");
      STATE.showSupportModal = show;
      renderApp();
    },

    async sendSupportTicket() {
      const inp = document.getElementById("support-msg-input");
      const text = inp ? inp.value.trim() : "";
      if (!text) {
        showToast("Напиши сообщение для поддержки");
        return;
      }
      haptic("medium");
      const res = await apiPost("/api/support", { message: text });
      if (res) {
        showToast("Сообщение отправлено разработчику! 💌");
        STATE.showSupportModal = false;
        renderApp();
      }
    }
  };

  function getMoodMeta(moodId) {
    const moods = (window.CHIBI_CONFIG && window.CHIBI_CONFIG.moods) || [];
    return moods.find((m) => m.id === moodId) || moods[0];
  }

  function formatDaysWord(d) {
    const num = Math.abs(parseInt(d, 10)) || 1;
    const n10 = num % 10;
    const n100 = num % 100;
    if (n10 === 1 && n100 !== 11) return `${num} день`;
    if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return `${num} дня`;
    return `${num} дней`;
  }

  function renderStageSegments(stage, activeColor) {
    let html = '<div class="stage-segments">';
    for (let i = 1; i <= 4; i++) {
      const bg = i <= stage ? activeColor : "#E5E7EB";
      html += `<div class="stage-seg" style="background:${bg};"></div>`;
    }
    html += "</div>";
    return html;
  }

  function tickLiveAnniversaryClock() {
    if (!STATE.serverData || !STATE.serverData.user) return;
    const user = STATE.serverData.user;
    const partner = STATE.serverData.partner;
    if (!partner) return;

    const annivVal = user.anniversaryDate || partner.anniversaryDate || (user.care && user.care.anniversaryStats && user.care.anniversaryStats.anniversaryDateISO) || (user.care && user.care.pairedDateStr);
    if (!annivVal || !window.calculateRelationshipTime) return;

    const t = window.calculateRelationshipTime(annivVal);
    const elY = document.getElementById("clock-years");
    const elM = document.getElementById("clock-months");
    const elD = document.getElementById("clock-days");
    const elH = document.getElementById("clock-hours");
    const elMin = document.getElementById("clock-mins");
    const elS = document.getElementById("clock-secs");

    if (elY) elY.textContent = String(t.years);
    if (elM) elM.textContent = String(t.months);
    if (elD) elD.textContent = String(t.days);
    if (elH) elH.textContent = String(t.hours).padStart(2, "0");
    if (elMin) elMin.textContent = String(t.minutes).padStart(2, "0");
    if (elS) elS.textContent = String(t.seconds).padStart(2, "0");

    const totalPill = document.getElementById("clock-total-pill");
    if (totalPill) {
      totalPill.innerHTML = `<span>✨</span><span>Всего ${t.totalDays} ${window.pluralRu ? window.pluralRu(t.totalDays, "день", "дня", "дней") : "дней"} вместе 💕</span>`;
    }
  }

  function renderPartnerMoodBanner(partner, currentUser) {
    if (!partner) return "";
    const moodMeta = window.getMoodMeta ? window.getMoodMeta(partner.mood) : { emoji: "🥰", label: "Радостное", badge: "Сияет от счастья ✨", color: "#F59E0B" };
    const tagMeta = window.getMoodTagMeta ? window.getMoodTagMeta(partner.moodTag) : null;
    const relTime = window.formatRelativeTimeRu ? window.formatRelativeTimeRu(partner.moodUpdatedAt) : "";
    const reactions = (window.CHIBI_CONFIG && window.CHIBI_CONFIG.moodReactions) || [
      { id: "hug", icon: "🫂", label: "Обнять" },
      { id: "kiss", icon: "💋", label: "Поцеловать" },
      { id: "tea", icon: "☕", label: "Заварить чай" },
      { id: "cheer", icon: "💖", label: "Подбодрить" }
    ];

    const receivedReaction = currentUser && currentUser.moodReaction;
    const rxMeta = receivedReaction && window.getReactionMeta ? window.getReactionMeta(receivedReaction) : null;
    const rxTime = currentUser && window.formatRelativeTimeRu ? window.formatRelativeTimeRu(currentUser.moodReactionAt) : "";

    return `
      <div class="partner-mood-banner">
        <div class="mood-top-meta">
          <div class="mood-partner-tag">
            <span>💭</span>
            <span>Настроение @${escapeHtml(partner.username)}:</span>
          </div>
          ${relTime ? `<div class="mood-relative-time">${relTime}</div>` : ""}
        </div>

        <div class="mood-main-row">
          <div class="mood-emoji-bubble" style="background:${moodMeta.color || "#F59E0B"}18; border: 2px solid ${moodMeta.color || "#F59E0B"}44;">
            ${moodMeta.emoji}
          </div>
          <div class="mood-details">
            <div class="mood-title-badge-wrap">
              <span class="mood-title-label">${moodMeta.label}</span>
              <span class="mood-status-pill" style="background:${moodMeta.color || "#F59E0B"}22; color:${moodMeta.color || "#B45309"};">
                ${moodMeta.badge || "В настроении"}
              </span>
              ${tagMeta ? `
                <span class="mood-reason-tag-pill">
                  <span>${tagMeta.icon}</span>
                  <span>${tagMeta.label}</span>
                </span>
              ` : ""}
            </div>
            ${partner.moodReason ? `
              <div class="mood-note-quote">
                «${escapeHtml(partner.moodReason)}»
              </div>
            ` : ""}
          </div>
        </div>

        <!-- Quick 1-tap Reciprocal Reaction Bar -->
        <div class="mood-reaction-bar">
          ${reactions.map((r) => `
            <button class="mood-react-btn" onclick="APP.reactToPartnerMood('${r.id}')" title="${r.label}">
              <span>${r.icon}</span>
              <span>${r.label}</span>
            </button>
          `).join("")}
        </div>

        ${receivedReaction && rxMeta ? `
          <div class="reaction-alert-bubble">
            <span>💖 @${escapeHtml(currentUser.moodReactionFrom || partner.username)} ${rxMeta.soundMsg} ${rxMeta.icon}</span>
            ${rxTime ? `<span style="font-size:10px; opacity:0.8;">${rxTime}</span>` : ""}
          </div>
        ` : ""}
      </div>
    `;
  }

  function renderAnniversaryClock(user, partner) {
    if (!partner) return "";
    const annivVal = user.anniversaryDate || partner.anniversaryDate || (user.care && user.care.anniversaryStats && user.care.anniversaryStats.anniversaryDateISO) || (user.care && user.care.pairedDateStr);
    const stats = (window.calculateRelationshipTime && window.calculateRelationshipTime(annivVal)) || (user.care && user.care.anniversaryStats) || {
      years: 0, months: 0, days: 1, hours: 0, minutes: 0, seconds: 0, totalDays: 1,
      anniversaryFormatted: "Сегодня", nextMilestone: { days: 7, daysLeft: 6, progressPct: 14 }
    };
    const nextM = stats.nextMilestone || { days: 100, daysLeft: 10, progressPct: 90 };
    const milestones = stats.milestones || (window.CHIBI_CONFIG && window.CHIBI_CONFIG.milestones) || [];

    return `
      <div class="anniversary-clock-card">
        <div class="clock-header-row">
          <div class="clock-title-group">
            <span style="font-size:20px;">💕</span>
            <span class="clock-main-title">Часики любви & Годовщина</span>
          </div>
          <button class="clock-edit-btn" onclick="APP.openAnniversaryModal(true)">
            <span>✏️</span>
            <span>Изменить дату</span>
          </button>
        </div>

        <div class="anniversary-date-display">
          <span>📅 Дата начала отношений:</span>
          <strong style="color:#9F1239;">${stats.anniversaryFormatted || stats.anniversaryDateISO || "Сегодня"}</strong>
          ${stats.isFuture ? `<span style="color:#D97706; font-size:10.5px;">(До заветного дня)</span>` : ""}
        </div>

        <!-- 6-Unit Precision Live Digits Grid -->
        <div class="clock-digits-grid">
          <div class="clock-digit-unit">
            <div id="clock-years" class="clock-num">${stats.years}</div>
            <div class="clock-label">${window.pluralRu ? window.pluralRu(stats.years, "год", "года", "лет").replace(/^\d+\s*/, "") : "лет"}</div>
          </div>
          <div class="clock-digit-unit">
            <div id="clock-months" class="clock-num">${stats.months}</div>
            <div class="clock-label">${window.pluralRu ? window.pluralRu(stats.months, "мес.", "мес.", "мес.").replace(/^\d+\s*/, "") : "мес."}</div>
          </div>
          <div class="clock-digit-unit">
            <div id="clock-days" class="clock-num">${stats.days}</div>
            <div class="clock-label">${window.pluralRu ? window.pluralRu(stats.days, "день", "дня", "дней").replace(/^\d+\s*/, "") : "дней"}</div>
          </div>
          <div class="clock-digit-unit">
            <div id="clock-hours" class="clock-num">${String(stats.hours).padStart(2, "0")}</div>
            <div class="clock-label">часов</div>
          </div>
          <div class="clock-digit-unit">
            <div id="clock-mins" class="clock-num">${String(stats.minutes).padStart(2, "0")}</div>
            <div class="clock-label">минут</div>
          </div>
          <div class="clock-digit-unit" style="border-color:#F43F5E;">
            <div id="clock-secs" class="clock-num" style="color:#E11D48;">${String(stats.seconds).padStart(2, "0")}</div>
            <div class="clock-label" style="color:#E11D48;">секунд</div>
          </div>
        </div>

        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
          <div id="clock-total-pill" class="clock-total-pill">
            <span>✨</span>
            <span>Всего ${stats.totalDays} ${window.pluralRu ? window.pluralRu(stats.totalDays, "день", "дня", "дней") : "дней"} вместе 💕</span>
          </div>
          <button class="pill-badge-btn" onclick="APP.celebrateMilestone(${stats.totalDays})">
            Праздновать 🎉
          </button>
        </div>

        <!-- Milestones Tracker Section -->
        <div class="milestones-section">
          <div class="milestones-header-row">
            <div class="milestones-title">
              <span>🏆</span>
              <span>Следующая цель: <strong>${escapeHtml(nextM.title || nextM.badge)}</strong></span>
            </div>
            <div class="milestone-target-badge">
              ${nextM.daysLeft > 0 ? `Осталось ${nextM.daysLeft} дн.` : "Достигнуто! 🌟"}
            </div>
          </div>

          <div class="milestone-progress-bar-wrap">
            <div class="milestone-progress-fill" style="width: ${nextM.progressPct || 0}%;"></div>
          </div>

          <!-- Milestones Rail -->
          <div class="milestone-rail">
            ${milestones.map((m) => `
              <div
                class="milestone-chip ${m.completed ? "completed" : (nextM && nextM.days === m.days ? "active-next" : "")}"
                onclick="APP.openMilestoneModal(${JSON.stringify(m).replace(/"/g, '&quot;')})"
                title="${escapeHtml(m.desc || m.title)}"
              >
                <span>${m.completed ? "🌟" : m.icon}</span>
                <span>${escapeHtml(m.badge)}</span>
                ${m.completed ? `<span style="font-size:10px; color:#10B981;">✓</span>` : ""}
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;
  }

  function renderRichMoodSelector(user) {
    const currentMood = STATE.draftMood || user.mood || "joyful";
    const currentTag = STATE.draftMoodTag || user.moodTag || "missing_you";
    const moods = (window.CHIBI_CONFIG && window.CHIBI_CONFIG.moods) || [];
    const tags = (window.CHIBI_CONFIG && window.CHIBI_CONFIG.moodTags) || [];

    return `
      <div class="panel-card" style="margin-top:10px;">
        <div class="panel-title">
          <span>💭 Настроение для половины</span>
          <span style="font-size:11px; color:#6B7280;">Синхронизируется онлайн ✨</span>
        </div>

        <div style="font-size:11.5px; font-weight:800; color:#374151; margin-bottom:6px;">
          Как твоё самочувствие прямо сейчас?
        </div>
        <div class="rich-mood-grid">
          ${moods.map((m) => `
            <div
              class="rich-mood-card ${currentMood === m.id ? "active" : ""}"
              onclick="APP.selectMood('${m.id}')"
              style="${currentMood === m.id ? `border-color:${m.color || '#F43F5E'};` : ""}"
            >
              <div class="rich-mood-emoji">${m.emoji}</div>
              <div class="rich-mood-label">${m.label}</div>
            </div>
          `).join("")}
        </div>

        <div style="font-size:11.5px; font-weight:800; color:#374151; margin-bottom:6px;">
          Что происходит? (выбери тег):
        </div>
        <div class="reason-tags-row">
          ${tags.map((t) => `
            <div
              class="reason-tag-chip ${currentTag === t.id ? "active" : ""}"
              onclick="APP.selectMoodTag('${t.id}')"
            >
              <span>${t.icon}</span>
              <span>${t.label}</span>
            </div>
          `).join("")}
        </div>

        <div style="margin-top:4px;">
          <input
            id="mood-reason-input"
            class="text-input"
            placeholder="Напиши милую записку (например: Люблю тебя! Жду вечера...)"
            value="${escapeHtml(user.moodReason || "")}"
            maxlength="140"
          />
        </div>

        <button class="primary-btn" style="margin-top:8px; padding:11px; font-size:13.5px;" onclick="APP.saveMoodWithReason()">
          Поделиться настроением с половинкой 💕
        </button>
      </div>
    `;
  }

  function renderAnniversaryModal(user, partner) {
    if (!STATE.showAnniversaryModal) return "";
    const currentVal = user.anniversaryDate || (partner && partner.anniversaryDate) || (user.care && user.care.anniversaryStats && user.care.anniversaryStats.anniversaryDateISO) || "";
    return `
      <div class="modal-backdrop" onclick="APP.openAnniversaryModal(false)">
        <div class="modal-box" onclick="event.stopPropagation()">
          <div class="modal-header">
            <span style="font-weight:900; font-size:16px;">📅 Дата годовщины пары</span>
            <span class="food-tray-close" onclick="APP.openAnniversaryModal(false)">✕</span>
          </div>
          <div style="font-size:12px; color:#4B5563; line-height:1.45; margin-bottom:12px;">
            Укажи реальный день начала ваших отношений, чтобы точный счётчик любви считал ваши дни, часы и секунды вместе!
          </div>

          <div style="margin-bottom:12px;">
            <label style="display:block; font-size:11.5px; font-weight:800; color:#374151; margin-bottom:5px;">
              Дата начала отношений:
            </label>
            <input
              id="anniversary-date-input"
              type="date"
              class="text-input"
              value="${currentVal}"
              style="font-size:14px; padding:10px;"
            />
          </div>

          <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:14px;">
            <button class="pill-badge-btn" onclick="APP.setQuickAnniversaryPreset(0)">Сегодня</button>
            <button class="pill-badge-btn" onclick="APP.setQuickAnniversaryPreset(180)">Полгода назад</button>
            <button class="pill-badge-btn" onclick="APP.setQuickAnniversaryPreset(365)">1 год назад</button>
            <button class="pill-badge-btn" onclick="APP.setQuickAnniversaryPreset(730)">2 года назад</button>
          </div>

          <button class="primary-btn" onclick="APP.saveAnniversaryDate()">
            Сохранить дату годовщины 💕
          </button>
        </div>
      </div>
    `;
  }

  function renderMilestoneModal() {
    const m = STATE.activeMilestoneModal;
    if (!m) return "";
    return `
      <div class="modal-backdrop" onclick="APP.openMilestoneModal(null)">
        <div class="modal-box" onclick="event.stopPropagation()">
          <div class="modal-header">
            <span style="font-weight:900; font-size:15px;">🏆 Веха отношений</span>
            <span class="food-tray-close" onclick="APP.openMilestoneModal(null)">✕</span>
          </div>

          <div class="celebrate-badge-hero">${m.icon || "💯"}</div>

          <div class="celebrate-card-box">
            <div class="celebrate-title">${escapeHtml(m.title)}</div>
            <div class="celebrate-desc">${escapeHtml(m.desc || "Прекрасный совместный рубеж вашей пары!")}</div>
            <div style="margin-top:8px; font-size:13px; font-weight:900; color:#E11D48;">
              ${m.completed ? "🌟 Эта веха уже достигнута вашей любовью!" : `⏳ До вехи осталось: ${m.daysLeft} дн.`}
            </div>
          </div>

          <button class="primary-btn" onclick="APP.celebrateMilestone(${m.days})">
            Ура! Отпраздновать салютом 🎉
          </button>
        </div>
      </div>
    `;
  }

  function renderHeader(user, partner) {
    const days = partner && partner.care ? (partner.care.daysTogether || partner.care.streakDays || 1) : 0;
    const isLeft = partner && partner.care && partner.care.partnerLeft;
    return `
      <header class="top-header">
        <div class="brand-box" onclick="APP.switchTab('care')">
          <div class="brand-avatar-wrap">
            <img src="/img/bot_avatar.png" alt="ChibiLove" class="brand-avatar-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="brand-logo-fallback" style="display:none;">🐾</div>
          </div>
          <div style="min-width:0;">
            <div class="brand-title">ChibiLove 💕</div>
            <div class="brand-sub">@${user.username} ${partner ? `❤️ @${partner.username}` : "• Соло питомец"}</div>
          </div>
        </div>
        <div class="header-right">
          ${partner ? `
            <div class="flame-streak-pill ${isLeft ? "extinguished" : ""}" onclick="APP.switchTab('together')" title="Огонёк любви">
              <span>${isLeft ? "💔" : "🔥"}</span>
              <span>${days} дн.</span>
            </div>
          ` : ""}
          <div class="hearts-pill" onclick="APP.openHeartsModal(true)" title="Сердечки для восстановления пары">
            <span>💕</span>
            <span>${user.hearts}</span>
            <span style="font-size:11px; opacity:0.8;">+</span>
          </div>
        </div>
      </header>
    `;
  }

  function renderIncomingRequests(incoming) {
    if (!incoming || incoming.length === 0) return "";
    return incoming
      .map(
        (req) => `
      <div class="incoming-banner">
        <div style="font-weight:800; font-size:13px; margin-bottom:5px;">
          💌 Запрос в пару от <span style="color:#E11D48;">@${req.fromUsername}</span>!
        </div>
        <div style="font-size:11.5px; color:#4B5563; margin-bottom:9px;">
          Прими запрос, чтобы ваш общий питомец и огонёк любви сияли вместе!
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
          <button class="primary-btn" style="padding:9px;" onclick="APP.respondPairRequest(${req.id}, '${req.fromUsername}', 'accept')">
            ✅ Принять 💕
          </button>
          <button class="secondary-btn" style="padding:9px;" onclick="APP.respondPairRequest(${req.id}, '${req.fromUsername}', 'decline')">
            Отклонить
          </button>
        </div>
      </div>
    `
      )
      .join("");
  }

  function renderCareTab(user, partner, outgoing, botUsername) {
    const targetObj = partner || user;
    const c = targetObj.care || {
      hungerStage: 4, hungerLabel: "Сыт",
      cleanStage: 4, cleanLabel: "Чистый",
      energyStage: 4, energyLabel: "Бодр",
      isSleeping: false, partnerLeft: false, streakDays: 1, hoursLeft: 23, minsLeft: 59
    };
    const isSleeping = !!c.isSleeping;
    const isLeft = !!(partner && c.partnerLeft);
    const petMeta = window.getPetById((targetObj.avatar && targetObj.avatar.species) || "kitty_bear");

    if (isLeft) {
      const daysText = formatDaysWord(c.daysTogether || c.streakDays || 1);
      return `
        <div class="streak-bar extinguished">
          <div class="streak-fire-badge">🥀 Огонёк погас (${daysText} вместе)</div>
          <div>24ч без заботы</div>
        </div>
        <div class="stage-card" style="text-align:center; padding:24px 16px;">
          <div id="fx-overlay" class="fx-overlay"></div>
          <div style="font-size:48px; margin-bottom:8px;">💔</div>
          <h2 style="margin:0 0 8px 0; font-size:18px; font-weight:900; color:#991B1B;">
            Огонёк любви погас...
          </h2>
          <p style="font-size:12.5px; color:#4B5563; line-height:1.45; margin:0 0 16px 0;">
            Вы не успели позаботиться о питомце за 24 часа. Восстановите пару, чтобы продолжить дни вместе!
          </p>
          ${user.freeRestoreAvailable ? `
            <button class="primary-btn" style="padding:13px; font-size:14px; background:linear-gradient(135deg, #10B981, #059669); margin-bottom:8px;" onclick="APP.restorePartner(true)">
              🎁 Бесплатное восстановление (1-й раз)
            </button>
          ` : `
            <button class="primary-btn" style="padding:13px; font-size:14px;" onclick="APP.restorePartner(false)">
              Восстановить пару за 200 💕
            </button>
          `}
        </div>
      `;
    }

    const foods = (window.CHIBI_CONFIG && window.CHIBI_CONFIG.foods) || [];

    return `
      ${c.canClaimDaily ? `
        <div class="daily-claim-banner" onclick="APP.claimDailyReward()" style="background:linear-gradient(135deg, #FFF1F2, #FFE4E6); border:1.5px solid #FDA4AF; border-radius:14px; padding:10px 14px; margin-bottom:10px; display:flex; align-items:center; justify-content:space-between; cursor:pointer; box-shadow:0 3px 10px rgba(244,63,94,0.15);">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:22px;">🎁</span>
            <div>
              <div style="font-weight:900; font-size:12.5px; color:#BE123C;">Ежедневная награда готова!</div>
              <div style="font-size:11px; color:#6B7280;">Забери свои +10 💕 за сегодняшний день</div>
            </div>
          </div>
          <button class="primary-btn" style="width:auto; padding:6px 14px; font-size:12px; background:linear-gradient(135deg, #F43F5E, #BE123C);" onclick="event.stopPropagation(); APP.claimDailyReward()">
            +10 💕
          </button>
        </div>
      ` : ""}

      <!-- Streak Banner -->
      <div class="streak-bar">
        <div class="streak-fire-badge">
          <span>🔥</span>
          <span>Огонёк любви: ${formatDaysWord(c.daysTogether || c.streakDays || 1)}</span>
        </div>
        <div style="display:flex; align-items:center; gap:4px; font-size:11px;">
          <span>⏳</span>
          <span>Осталось ${c.hoursLeft || 23}ч ${c.minsLeft || 50}м</span>
        </div>
      </div>

      <!-- Partner Active Mood Widget on Main Screen -->
      ${renderPartnerMoodBanner(partner, user)}

      <!-- Main Room Viewport with Animated Pet -->
      <div class="stage-card ${isSleeping ? "night-mode" : ""}">
        <div id="fx-overlay" class="fx-overlay"></div>
        <div class="stage-header-row">
          <div class="partner-meta-tag">
            <span style="font-size:16px;">${petMeta.icon}</span>
            <span style="font-weight:800; font-size:13px;">${escapeHtml((targetObj.avatar && targetObj.avatar.name) || petMeta.name)}</span>
            <span style="font-size:10.5px; opacity:0.8;">(${petMeta.badge})</span>
          </div>
          <button class="pill-badge-btn" onclick="APP.switchTab('pet')">
            Сменить 🐾
          </button>
        </div>

        <div id="chibi-pet-care-box" class="chibi-3d-mount"></div>

        <div style="text-align:center; margin-top:6px; font-size:11px; color:#9CA3AF; font-weight:700;">
          ✨ Нажми или проведи пальцем по питомцу, чтобы погладить 💕
        </div>
      </div>

      <!-- Quick Action Buttons -->
      <div class="care-action-grid">
        <button class="care-action-btn ${STATE.showFoodTray ? "active" : ""}" onclick="APP.toggleFoodTray()">
          <span class="care-action-icon">🍰</span>
          <span class="care-action-label">Покормить</span>
        </button>
        <button class="care-action-btn" onclick="APP.showerPet()">
          <span class="care-action-icon">🫧</span>
          <span class="care-action-label">Искупать</span>
        </button>
        <button class="care-action-btn ${isSleeping ? "active" : ""}" onclick="APP.sleepPet()">
          <span class="care-action-icon">${isSleeping ? "☀️" : "🌙"}</span>
          <span class="care-action-label">${isSleeping ? "Разбудить" : "Уложить спать"}</span>
        </button>
        <button class="care-action-btn" onclick="APP.petPet()">
          <span class="care-action-icon">💖</span>
          <span class="care-action-label">Погладить</span>
        </button>
      </div>

      <!-- Food Selection Tray Popover -->
      ${STATE.showFoodTray ? `
        <div class="food-tray-box">
          <div class="food-tray-title">
            <span>Выбери лакомство для питомца:</span>
            <span class="food-tray-close" onclick="APP.toggleFoodTray()">✕</span>
          </div>
          <div class="food-tray-scroll">
            ${foods.map((f) => `
              <div class="food-item-pill" onclick="APP.feedPet('${f.icon}', '${f.name}')">
                <span style="font-size:24px;">${f.icon}</span>
                <span style="font-size:11.5px; font-weight:800; color:#374151;">${f.name}</span>
              </div>
            `).join("")}
          </div>
        </div>
      ` : ""}

      <!-- 4 Stages Care Gauges -->
      <div class="panel-card" style="margin-top:10px;">
        <div class="status-grid">
          <div class="status-card ${c.hungerStage <= 2 ? "warning" : ""}">
            <div class="status-top">
              <span class="status-icon">🍲</span>
              <span class="status-label">Сытость</span>
            </div>
            ${renderStageSegments(c.hungerStage || 4, "#F59E0B")}
            <div class="status-val">${c.hungerLabel || "Сыт"} • ${c.hungerPercent !== undefined ? c.hungerPercent + "%" : "100%"}</div>
          </div>

          <div class="status-card ${(c.cleanStage >= 4 || c.isSparkling) ? "sparkle-glow" : (c.cleanStage <= 2 ? "warning" : "")}">
            <div class="status-top">
              <span class="status-icon">🫧</span>
              <span class="status-label">Чистота</span>
              ${(c.cleanStage >= 4 || c.isSparkling) ? '<span class="sparkle-badge">✨</span>' : ""}
            </div>
            ${renderStageSegments(c.cleanStage || 4, "#06B6D4")}
            <div class="status-val">${c.cleanLabel || "Чистый"} • ${c.cleanPercent !== undefined ? c.cleanPercent + "%" : "100%"}</div>
          </div>

          <div class="status-card ${c.energyStage <= 2 ? "warning" : ""}">
            <div class="status-top">
              <span class="status-icon">⚡</span>
              <span class="status-label">Бодрость</span>
              ${isSleeping ? '<span class="sleep-badge">💤</span>' : ""}
            </div>
            ${renderStageSegments(c.energyStage || 4, "#8B5CF6")}
            <div class="status-val">${isSleeping ? "Спит под одеялком 💤" : (c.energyLabel || "Бодр")} • ${c.energyPercent !== undefined ? c.energyPercent + "%" : "100%"}</div>
          </div>

          <div class="status-card">
            <div class="status-top">
              <span class="status-icon">💖</span>
              <span class="status-label">Огонёк</span>
            </div>
            ${renderStageSegments(4, "#F43F5E")}
            <div class="status-val">100% Любовь</div>
          </div>
        </div>
      </div>
    `;
  }

  function renderTogetherTab(user, partner, flameStage, outgoing, botUsername) {
    if (!partner) {
      const inviteLink = `https://t.me/${botUsername}?start=pair_${user.username}`;
      return `
        <div class="panel-card" style="text-align:center; padding:20px 14px;">
          <div style="font-size:42px; margin-bottom:6px;">💑</div>
          <h2 style="margin:0 0 8px 0; font-size:18px; font-weight:800;">Режим Пары</h2>
          <p style="margin:0 0 14px 0; font-size:12.5px; color:#4B5563; line-height:1.45;">
            Свяжись со своей половинкой, чтобы ваши питомцы сидели рядышком, а вы вместе растили огонёк любви и получали по +10 💕 каждый день!
          </p>
          <div style="display:flex; gap:7px; margin-bottom:12px;">
            <input
              id="partner-username-input"
              class="text-input"
              placeholder="@username партнёра"
              value="${STATE.partnerInput}"
            />
            <button class="primary-btn" style="width:auto; white-space:nowrap; padding:0 16px;" onclick="APP.sendPairRequest()">
              Связать 💌
            </button>
          </div>

          <div style="margin-top:12px; background:#F9FAFB; border-radius:13px; padding:10px; text-align:left;">
            <div style="font-size:11.5px; font-weight:800; color:#374151; margin-bottom:5px;">🔗 Прямая ссылка-приглашение:</div>
            <div style="display:flex; gap:6px; align-items:center;">
              <input class="text-input" style="font-size:11px; padding:6px 8px;" readonly value="${inviteLink}"/>
              <button class="secondary-btn" style="width:auto; padding:6px 12px; font-size:11px;" onclick="APP.copyInviteLink('${inviteLink}')">
                Копировать
              </button>
            </div>
          </div>
        </div>
      `;
    }

    const c = partner.care || {};
    const days = c.daysTogether || c.streakDays || 1;
    const flame = c.flameStage || flameStage || { title: "✨ Крошечная Искорка", badge: "1-й уровень", desc: "Тёплый огонёк первого знакомства.", color: "#F59E0B" };
    const userPet = user.avatar || user.pet || {};
    const partnerPet = partner.avatar || partner.pet || {};

    return `
      <!-- Grand Precision Live Anniversary Clock -->
      ${renderAnniversaryClock(user, partner)}

      <!-- Partner Active Mood & Reaction Widget -->
      ${renderPartnerMoodBanner(partner, user)}

      <!-- Flame Evolution Card -->
      <div class="flame-tier-card" style="border-left: 5px solid ${flame.color || "#F59E0B"};">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
          <div style="font-weight:900; font-size:15px; color:#1F2937;">
            ${flame.title}
          </div>
          <div class="flame-tier-badge" style="background:${flame.color || "#F59E0B"}22; color:${flame.color || "#B45309"};">
            ${flame.badge}
          </div>
        </div>
        <div style="font-size:12px; color:#4B5563; line-height:1.4; margin-bottom:8px;">
          ${flame.desc}
        </div>
        <div style="font-size:11px; font-weight:800; color:#F43F5E;">
          🎁 Награда пары: +10 💕 каждый день за сохранённый огонёк!
        </div>
      </div>

      <!-- Couple Pet Stage -->
      <div class="stage-card">
        <div id="fx-overlay" class="fx-overlay"></div>
        <div class="stage-header-row">
          <div class="partner-meta-tag">
            <span>🐾</span>
            <span style="font-weight:800;">${escapeHtml(userPet.name || "Ты")} & ${escapeHtml(partnerPet.name || "Половинка")}</span>
          </div>
          <span style="font-size:11.5px; font-weight:800; color:#E11D48;">${formatDaysWord(days)} вместе 💞</span>
        </div>

        <div id="chibi-pet-couple-box" class="chibi-3d-mount couple-mount"></div>

        <div style="text-align:center; margin-top:6px; font-size:11px; color:#9CA3AF; font-weight:700;">
          ✨ Прикоснись к питомцам, чтобы они выразили любовь 💕
        </div>
      </div>

      <!-- Rich Cute Mood Selector (7 Moods + 6 Reason Tags) -->
      ${renderRichMoodSelector(user)}

      <!-- Care Activity Logs -->
      <div class="panel-card" style="margin-top:10px;">
        <div class="panel-title">
          <span>📜 История заботы</span>
        </div>
        ${(STATE.serverData.careLogs && STATE.serverData.careLogs.length > 0) ? `
          <div class="care-log-list">
            ${STATE.serverData.careLogs.slice(0, 6).map((log) => `
              <div class="care-log-item">
                <span>${escapeHtml(log.text)}</span>
                <span class="care-log-time">${new Date(log.created_at * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            `).join("")}
          </div>
        ` : `
          <div style="text-align:center; padding:14px; font-size:12px; color:#9CA3AF;">
            Пока нет записей. Покормите или погладьте питомца! 🐾
          </div>
        `}
      </div>
    `;
  }

  function renderPetSelectorTab(user) {
    const draft = STATE.draftAvatar || window.normalizeAvatar(user.avatar || user.pet);
    const pets = (window.CHIBI_CONFIG && window.CHIBI_CONFIG.pets) || [];
    const themes = (window.CHIBI_CONFIG && window.CHIBI_CONFIG.pastelThemes) || [];

    return `
      <div class="panel-card">
        <div class="panel-title">
          <span>🐾 Выбери своего питомца</span>
          <button class="secondary-btn" style="width:auto; padding:5px 12px; font-size:11px;" onclick="APP.randomizePet()">
            Случайный 🎲
          </button>
        </div>

        <!-- Live Preview of chosen pet -->
        <div id="chibi-pet-preview-box" class="chibi-3d-mount" style="height:230px; margin-bottom:12px;"></div>

        <!-- Pet Name Input -->
        <div style="margin-bottom:12px;">
          <label style="display:block; font-size:12px; font-weight:800; color:#374151; margin-bottom:5px;">
            Имя питомца:
          </label>
          <input
            id="pet-name-input"
            class="text-input"
            value="${escapeHtml(draft.name || "")}"
            oninput="APP.updatePetName(this.value)"
            placeholder="Например: Зефирка, Пончик, Лучик..."
          />
        </div>

        <!-- Pets Grid matching reference art -->
        <label style="display:block; font-size:12px; font-weight:800; color:#374151; margin-bottom:8px;">
          Вид питомца (11 персонажей):
        </label>
        <div class="pet-select-grid">
          ${pets.map((p) => `
            <div class="pet-select-card ${draft.species === p.id ? "active" : ""}" onclick="APP.selectPetSpecies('${p.id}')">
              <div class="pet-select-icon">
                <img src="${p.img}" alt="${p.name}" class="pet-thumb-img" onerror="this.outerHTML='<span style=\\'font-size:28px;\\'>${p.icon}</span>'"/>
              </div>
              <div class="pet-select-name">${p.name}</div>
              <div class="pet-select-badge">${p.badge}</div>
            </div>
          `).join("")}
        </div>

        <!-- Pastel Room Background Picker -->
        <div style="margin-top:14px;">
          <label style="display:block; font-size:12px; font-weight:800; color:#374151; margin-bottom:6px;">
            Цветовая тема комнаты:
          </label>
          <div class="theme-picker-row">
            ${themes.map((t) => `
              <div
                class="theme-color-dot ${user.bgColor === t.id ? "active" : ""}"
                style="background:${t.hex};"
                title="${t.name}"
                onclick="APP.selectTheme('${t.id}')"
              ></div>
            `).join("")}
          </div>
        </div>

        <!-- Save Button -->
        <button class="primary-btn" style="margin-top:16px; padding:12px; font-size:14px;" onclick="APP.savePet()">
          Сохранить питомца 🐾
        </button>
      </div>
    `;
  }

  function renderSettingsTab(user, partner, outgoing, botUsername) {
    const inviteLink = `https://t.me/${botUsername}?start=pair_${user.username}`;
    return `
      <!-- Pair Connection Card -->
      <div class="panel-card">
        <div class="panel-title">
          <span>💌 Связь с партнёром</span>
        </div>
        ${partner ? `
          <div style="background:#FFF1F2; border:1.5px solid #FECDD3; border-radius:14px; padding:12px; margin-bottom:12px;">
            <div style="font-weight:800; font-size:13px; color:#BE123C; margin-bottom:4px;">
              ❤️ Связан(а) с @${partner.username}
            </div>
            <div style="font-size:11.5px; color:#4B5563; margin-bottom:8px;">
              Вы вместе заботитесь о питомце и растите огонёк любви!
            </div>
            <button class="secondary-btn" style="padding:7px 12px; font-size:11.5px; color:#DC2626;" onclick="APP.unlinkPartner()">
              Разорвать пару
            </button>
          </div>
        ` : `
          <div style="font-size:12px; color:#4B5563; margin-bottom:10px;">
            Введи Telegram @username партнёра для объединения в пару:
          </div>
          <div style="display:flex; gap:7px; margin-bottom:10px;">
            <input
              id="partner-username-input"
              class="text-input"
              placeholder="@username партнёра"
              value="${STATE.partnerInput}"
            />
            <button class="primary-btn" style="width:auto; white-space:nowrap; padding:0 15px;" onclick="APP.sendPairRequest()">
              Отправить 💌
            </button>
          </div>

          <div style="background:#F9FAFB; border-radius:12px; padding:9px; margin-top:8px;">
            <div style="font-size:11px; font-weight:800; color:#374151; margin-bottom:4px;">🔗 Ссылка-приглашение:</div>
            <div style="display:flex; gap:6px; align-items:center;">
              <input class="text-input" style="font-size:11px; padding:6px 8px;" readonly value="${inviteLink}"/>
              <button class="secondary-btn" style="width:auto; padding:6px 10px; font-size:11px;" onclick="APP.copyInviteLink('${inviteLink}')">
                Копировать
              </button>
            </div>
          </div>
        `}
      </div>

      <!-- Hearts Info Card -->
      <div class="panel-card" style="margin-top:10px;">
        <div class="panel-title">
          <span>💕 Сердечки и Экономика</span>
        </div>
        <div style="font-size:12px; color:#4B5563; line-height:1.45;">
          • Текущий баланс: <strong>${user.hearts} 💕</strong><br/>
          • Автоматический стартовый бонус: <strong>200 💕</strong> (достаточно для восстановления пары)<br/>
          • Ежедневная награда: <strong>+10 💕 каждый день</strong><br/>
          • Сердечки нужны исключительно для восстановления пары (200 💕), если пропущен 24-часовой уход.
        </div>
        <button class="secondary-btn" style="margin-top:10px; padding:9px;" onclick="APP.openHeartsModal(true)">
          Управление сердечками ⭐
        </button>
      </div>

      <!-- Developer Support Card -->
      <div class="panel-card" style="margin-top:10px;">
        <div class="panel-title">
          <span>💬 Поддержка и обратная связь</span>
        </div>
        <div style="font-size:12px; color:#4B5563; margin-bottom:10px;">
          Напрямую напиши разработчику с вопросом, идеей или пожеланием!
        </div>
        <button class="primary-btn" style="padding:10px;" onclick="APP.openSupportModal(true)">
          Написать в поддержку 💬
        </button>
      </div>
    `;
  }

  function renderHeartsModal(user) {
    if (!STATE.showHeartsModal) return "";
    return `
      <div class="modal-backdrop" onclick="APP.openHeartsModal(false)">
        <div class="modal-box" onclick="event.stopPropagation()">
          <div class="modal-header">
            <span style="font-weight:900; font-size:16px;">Сердечки 💕 (${user.hearts})</span>
            <span class="food-tray-close" onclick="APP.openHeartsModal(false)">✕</span>
          </div>
          <div style="font-size:12px; color:#4B5563; line-height:1.45; margin-bottom:14px;">
            Сердечки нужны только для восстановления пары, если пропущен 24-часовой уход.
            На старте каждому пользователю даётся <strong>200 💕</strong>, а также начисляется <strong>+10 💕 каждый день</strong>!
          </div>

          <div style="display:flex; flex-direction:column; gap:10px;">
            <div class="stars-card" onclick="APP.buyStarsPackage('stars_20')">
              <div style="display:flex; align-items:center; justify-content:space-between;">
                <div style="font-weight:800; font-size:13.5px; color:#BE123C;">200 Сердечек 💕</div>
                <div class="stars-badge">20 ⭐</div>
              </div>
              <div style="font-size:11px; color:#6B7280; margin-top:3px;">
                1 восстановление пары при пропуске 24 часов
              </div>
            </div>

            <div class="stars-card" onclick="APP.buyStarsPackage('stars_50')">
              <div style="display:flex; align-items:center; justify-content:space-between;">
                <div style="font-weight:800; font-size:13.5px; color:#BE123C;">500 Сердечек 💕</div>
                <div class="stars-badge">50 ⭐</div>
              </div>
              <div style="font-size:11px; color:#6B7280; margin-top:3px;">
                Запас сердечек для вашей пары
              </div>
            </div>

            <div class="stars-card" onclick="APP.buyStarsPackage('stars_100')">
              <div style="display:flex; align-items:center; justify-content:space-between;">
                <div style="font-weight:800; font-size:13.5px; color:#BE123C;">1000 Сердечек 💕</div>
                <div class="stars-badge">100 ⭐</div>
              </div>
              <div style="font-size:11px; color:#6B7280; margin-top:3px;">
                Большой запас сердечек для спокойствия
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderSupportModal() {
    if (!STATE.showSupportModal) return "";
    return `
      <div class="modal-backdrop" onclick="APP.openSupportModal(false)">
        <div class="modal-box" onclick="event.stopPropagation()">
          <div class="modal-header">
            <span style="font-weight:900; font-size:15px;">💬 Поддержка ChibiLove</span>
            <span class="food-tray-close" onclick="APP.openSupportModal(false)">✕</span>
          </div>
          <div style="font-size:12px; color:#4B5563; margin-bottom:10px;">
            Напиши своё сообщение — оно сразу отправится разработчику в Telegram:
          </div>
          <textarea
            id="support-msg-input"
            class="text-input"
            rows="4"
            placeholder="Твой вопрос или пожелание..."
            style="resize:none; font-family:inherit; margin-bottom:12px;"
          ></textarea>
          <button class="primary-btn" onclick="APP.sendSupportTicket()">
            Отправить разработчику 🚀
          </button>
        </div>
      </div>
    `;
  }

  function renderBottomNav() {
    const tabs = [
      { id: "care", label: "Питомец", icon: "🐾" },
      { id: "together", label: "Пара", icon: "💞" },
      { id: "pet", label: "Выбор", icon: "✨" },
      { id: "settings", label: "Связь", icon: "⚙️" },
    ];

    return `
      <nav class="bottom-nav">
        ${tabs.map((t) => `
          <button class="nav-item ${STATE.activeTab === t.id ? "active" : ""}" onclick="APP.switchTab('${t.id}')">
            <span class="nav-icon">${t.icon}</span>
            <span class="nav-label">${t.label}</span>
          </button>
        `).join("")}
      </nav>
    `;
  }

  function renderApp() {
    const root = document.getElementById("app");
    if (!root) return;

    if (STATE.loading || !STATE.serverData) {
      root.innerHTML = `
        <div class="app-shell" style="align-items:center; justify-content:center;">
          <div style="font-size:42px; animation: chibiBounce 1.2s infinite;">🐾</div>
          <div style="font-weight:800; margin-top:10px; color:#9F1239;">Загружаем питомцев ChibiLove...</div>
        </div>
      `;
      return;
    }

    const { user, partner, incomingRequests, outgoingRequests, flameStage, botUsername, restoreCostHearts } = STATE.serverData;

    let mainContent = "";
    if (STATE.activeTab === "care") {
      mainContent = renderCareTab(user, partner, outgoingRequests, botUsername, restoreCostHearts);
    } else if (STATE.activeTab === "together") {
      mainContent = renderTogetherTab(user, partner, flameStage, outgoingRequests, botUsername);
    } else if (STATE.activeTab === "pet") {
      mainContent = renderPetSelectorTab(user);
    } else if (STATE.activeTab === "settings") {
      mainContent = renderSettingsTab(user, partner, outgoingRequests, botUsername);
    }

    root.innerHTML = `
      <div class="app-shell">
        ${renderHeader(user, partner)}
        ${renderIncomingRequests(incomingRequests)}
        ${mainContent}
        ${renderHeartsModal(user)}
        ${renderSupportModal()}
        ${renderAnniversaryModal(user, partner)}
        ${renderMilestoneModal()}
        ${renderBottomNav()}
      </div>
    `;

    // Mount Active Pet Viewport
    if (window.Chibi2D) {
      if (STATE.activeTab === "care") {
        const mountEl = document.getElementById("chibi-pet-care-box");
        if (mountEl) {
          const targetObj = partner || user;
          window.Chibi2D.mount(mountEl, {
            mode: "solo",
            avatar: targetObj.avatar || targetObj.pet,
            care: targetObj.care,
            mood: targetObj.mood,
          });
        }
      } else if (STATE.activeTab === "together") {
        const mountEl = document.getElementById("chibi-pet-couple-box");
        if (mountEl && partner) {
          window.Chibi2D.mount(mountEl, {
            mode: "together",
            avatar: user.avatar || user.pet,
            partnerAvatar: partner.avatar || partner.pet,
            care: partner.care,
            mood: user.mood,
          });
        }
      } else if (STATE.activeTab === "pet") {
        const mountEl = document.getElementById("chibi-pet-preview-box");
        if (mountEl) {
          window.Chibi2D.mount(mountEl, {
            mode: "solo",
            avatar: STATE.draftAvatar || user.avatar || user.pet,
            care: { isSleeping: false },
          });
        }
      }
    }
  }

  // Live ticking anniversary clock (1-second precision)
  setInterval(tickLiveAnniversaryClock, 1000);

  // Real-Time Partner Sync Engine
  let lastEventId = 0;
  let isSyncActive = false;
  let syncTimer = null;

  function handlePartnerSyncEvent(ev) {
    if (!ev || ev.actor === STATE.username) return; // ignore own echo
    const actor = ev.actor ? `@${ev.actor}` : "Половинка";
    const data = ev.data || {};

    if (ev.type === "care_action") {
      const action = data.action;
      if (action === "feed") {
        const item = data.itemName || "🍰";
        const icon = item.includes(" ") ? item.split(" ").pop() : "🍰";
        if (window.Chibi2D) {
          window.Chibi2D.playCareAction("feed", icon);
          window.Chibi2D.showBubble(`Ням! ${actor} покормил(а) меня! 💕`, 3500);
        }
        spawnParticles([icon, "😋", "💖", "✨"]);
        showToast(`🍰 ${actor} покормил(а) питомца: ${data.itemName || "лакомство"}!`);
        haptic("medium");
      } else if (action === "shower") {
        if (window.Chibi2D) {
          window.Chibi2D.playCareAction("shower");
          window.Chibi2D.showBubble(`Ахх, ${actor} искупал(а) меня! Шёрстка сияет! ✨🫧`, 3500);
        }
        spawnParticles(["🫧", "🛁", "✨", "⭐", "💧"]);
        showToast(`🫧 ${actor} искупал(а) питомца в ванночке с пузырями! ✨`);
        haptic("medium");
      } else if (action === "sleep") {
        if (window.Chibi2D) {
          window.Chibi2D.playCareAction("sleep");
          window.Chibi2D.showBubble(
            data.isSleeping
              ? `Сладких снов... 💤 ${actor} уложил(а) спать 🌙`
              : `Доброе утро! ☀️ ${actor} разбудил(а) меня! 🌸`,
            3500
          );
        }
        spawnParticles(data.isSleeping ? ["🌙", "💤", "⭐"] : ["☀️", "🌸", "✨"]);
        showToast(data.isSleeping ? `🌙 ${actor} нежно уложил(а) питомца спать под одеялко 💤` : `☀️ ${actor} разбудил(а) питомца! Пора радоваться новому дню 🌸`);
        haptic("medium");
      } else if (action === "pet") {
        if (window.Chibi2D) {
          window.Chibi2D.playWithPet();
          window.Chibi2D.showBubble(`Муррр! ${actor} нежно гладит меня! 💕`, 3000);
        }
        spawnParticles(["💖", "💕", "✨", "🌸"]);
        showToast(`💖 ${actor} нежно гладит питомца! Муррр 💕`);
        haptic("light");
      }
    } else if (ev.type === "mood_change") {
      spawnParticles(["💭", "💖", "✨"]);
      showToast(`💭 ${actor} сменил(а) настроение: ${data.moodLabel || data.mood}${data.moodReason ? ` («${data.moodReason}»)` : ""}`);
      haptic("light");
    } else if (ev.type === "mood_reaction") {
      spawnParticles(["💖", "🫂", "✨", "🌸"]);
      showToast(`💖 ${actor} отправил(а) тебе реакцию: ${data.reactionTitle || "Любовь"}!`);
      haptic("medium");
    } else if (ev.type === "pair_linked") {
      spawnParticles(["💞", "🔥", "🌸", "💖"]);
      showToast(`💞 Вы связали пару с ${actor}! Огонёк зажжён 🔥`);
      haptic("heavy");
    } else if (ev.type === "pair_unlinked") {
      showToast(`💔 Пара отвязана`);
      haptic("warning");
    }
  }

  async function pollRealtimeSync() {
    if (isSyncActive || STATE.loading) return;
    isSyncActive = true;
    try {
      const waitParam = (typeof document !== "undefined" && document.hidden) ? "0" : "4";
      const qs = new URLSearchParams({
        username: STATE.username,
        last_event_id: String(lastEventId),
        wait: waitParam,
      });
      const res = await fetch(`/api/sync?${qs.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.ok) {
          if (data.lastEventId && data.lastEventId > lastEventId) {
            lastEventId = data.lastEventId;
          }
          if (Array.isArray(data.events) && data.events.length > 0) {
            for (const ev of data.events) {
              handlePartnerSyncEvent(ev);
            }
          }
          if (data.state && data.state.user) {
            STATE.serverData = data.state;
            applyBackgroundTheme(data.state.user.bgColor);
            renderApp();
          }
        }
      }
    } catch (e) {
      // quiet on connection blip
    } finally {
      isSyncActive = false;
      const delay = (typeof document !== "undefined" && document.hidden) ? 8000 : 2500;
      clearTimeout(syncTimer);
      syncTimer = setTimeout(pollRealtimeSync, delay);
    }
  }

  // Instant refresh when user returns to TMA
  if (typeof document !== "undefined" && document.addEventListener) {
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && !STATE.loading) {
        clearTimeout(syncTimer);
        pollRealtimeSync();
      }
    });
  }

  // Start initialization
  apiGetState().then(() => {
    pollRealtimeSync();
  });
})();
