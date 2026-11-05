/**
 * «Двое» (Two) — Minimalist Couple Relationship Tracker & Mutual Mood App
 * Telegram Mini App Frontend Logic
 */

(function () {
  'use strict';

  // --- Telegram WebApp Integration ---
  const tg = window.Telegram?.WebApp;
  if (tg) {
    try {
      tg.ready?.();
      tg.expand?.();
      tg.setHeaderColor?.('#F8F9FA');
      tg.setBackgroundColor?.('#F8F9FA');
    } catch (e) {
      // safe fallback
    }
  }

  // --- Helper: Haptic Feedback ---
  function haptic(type = 'light') {
    try {
      if (tg?.HapticFeedback) {
        if (type === 'success' || type === 'error' || type === 'warning') {
          tg.HapticFeedback.notificationOccurred(type);
        } else {
          tg.HapticFeedback.impactOccurred(type);
        }
      }
    } catch (e) {}
  }

  // --- Parse User Identity ---
  function resolveCurrentUser() {
    let qUser = '';
    if (typeof URLSearchParams !== 'undefined' && window.location?.search) {
      const params = new URLSearchParams(window.location.search);
      qUser = params.get('tg_user') || params.get('username') || params.get('user') || '';
      if (!qUser && params.get('tg_id')) {
        qUser = `user_${params.get('tg_id')}`;
      }
    }
    if (qUser) {
      const u = qUser.toLowerCase().replace('@', '');
      try {
        const oldU = localStorage.getItem('dvoe_tg_user');
        if (oldU && oldU !== u) {
          localStorage.removeItem('dvoe_tg_id');
        }
        localStorage.setItem('dvoe_tg_user', u);
      } catch (e) {}
      return u;
    }

    if (tg?.initDataUnsafe?.user?.username) {
      const u = tg.initDataUnsafe.user.username.toLowerCase();
      try {
        const oldU = localStorage.getItem('dvoe_tg_user');
        if (oldU && oldU !== u) {
          localStorage.removeItem('dvoe_tg_id');
        }
        localStorage.setItem('dvoe_tg_user', u);
      } catch (e) {}
      return u;
    }
    if (tg?.initDataUnsafe?.user?.id) {
      const u = `user_${tg.initDataUnsafe.user.id}`;
      try {
        const oldU = localStorage.getItem('dvoe_tg_user');
        if (oldU && oldU !== u) {
          localStorage.removeItem('dvoe_tg_id');
        }
        localStorage.setItem('dvoe_tg_user', u);
      } catch (e) {}
      return u;
    }

    try {
      const savedUser = localStorage.getItem('dvoe_tg_user');
      if (savedUser && savedUser.trim()) {
        return savedUser.trim().toLowerCase();
      }
    } catch (e) {}

    // Unique guest identifier fallback for non-telegram / standalone browsers
    const guestId = `guest_${Math.random().toString(36).substring(2, 10)}`;
    try {
      localStorage.removeItem('dvoe_tg_id');
      localStorage.setItem('dvoe_tg_user', guestId);
    } catch (e) {}
    return guestId;
  }
  const detectCurrentUser = resolveCurrentUser;

  function detectDisplayName() {
    if (tg?.initDataUnsafe?.user?.first_name) {
      const u = tg.initDataUnsafe.user;
      return u.last_name ? `${u.first_name} ${u.last_name}` : u.first_name;
    }
    return '';
  }

  function detectTgPhotoUrl() {
    return tg?.initDataUnsafe?.user?.photo_url || '';
  }

  function detectTgId() {
    if (typeof URLSearchParams !== 'undefined' && window.location?.search) {
      const params = new URLSearchParams(window.location.search);
      const qId = parseInt(params.get('tg_id'), 10);
      if (qId && !isNaN(qId)) {
        try { localStorage.setItem('dvoe_tg_id', String(qId)); } catch (e) {}
        return qId;
      }
    }
    if (tg?.initDataUnsafe?.user?.id) {
      const tid = tg.initDataUnsafe.user.id;
      try { localStorage.setItem('dvoe_tg_id', String(tid)); } catch (e) {}
      return tid;
    }
    try {
      const savedUser = localStorage.getItem('dvoe_tg_user');
      if (savedUser && (savedUser.startsWith('guest_') || savedUser.startsWith('user_'))) {
        if (savedUser.startsWith('user_')) {
          const parsed = parseInt(savedUser.replace('user_', ''), 10);
          if (parsed && !isNaN(parsed)) return parsed;
        }
        return 0;
      }
      const savedId = parseInt(localStorage.getItem('dvoe_tg_id'), 10);
      if (savedId && !isNaN(savedId)) return savedId;
    } catch (e) {}
    return 0;
  }

  // --- Predefined Moods ---
  const PRESET_MOODS = [
    { emoji: '🥰', label: 'Люблю' },
    { emoji: '😊', label: 'Счастлив' },
    { emoji: '😴', label: 'Устал' },
    { emoji: '🥺', label: 'Скучаю' },
    { emoji: '😤', label: 'Обиделся' },
    { emoji: '😒', label: 'Обиделась' },
    { emoji: '☕️', label: 'В делах' },
    { emoji: '🧘', label: 'Спокойно' },
    { emoji: '🎉', label: 'Праздную' },
    { emoji: '🌧', label: 'Грустно' },
    { emoji: '🤒', label: 'Болею' },
  ];

  // --- App State ---
  const state = {
    username: detectCurrentUser(),
    displayName: detectDisplayName(),
    tgId: detectTgId(),
    tgPhotoUrl: detectTgPhotoUrl(),
    user: null,
    partner: null,
    isPaired: false,
    relationshipStart: '2024-02-14',
    pairedAt: 0,
    selectedMood: { emoji: '🥰', label: 'Люблю' },
    timerInterval: null,
    pollInterval: null,
    activeTab: 'tab-home',
  };

  // --- DOM Elements ---
  const el = {
    // Header
    btnRefresh: document.getElementById('btn-refresh'),
    coupleStatusText: document.getElementById('couple-status-text'),
    
    // Couple Stage
    userMoodAnchor: document.getElementById('user-mood-anchor'),
    userMoodPill: document.getElementById('user-mood-pill'),
    userMoodEmoji: document.getElementById('user-mood-emoji'),
    userMoodLabel: document.getElementById('user-mood-label'),
    userPhoto: document.getElementById('user-photo'),
    userActiveDot: document.getElementById('user-active-dot'),
    userDisplayName: document.getElementById('user-display-name'),
    userHandle: document.getElementById('user-handle'),
    
    heartBtn: document.getElementById('heart-connection-btn'),
    daysTotalNum: document.getElementById('days-total-num'),
    
    partnerMoodAnchor: document.getElementById('partner-mood-anchor'),
    partnerMoodPill: document.getElementById('partner-mood-pill'),
    partnerMoodEmoji: document.getElementById('partner-mood-emoji'),
    partnerMoodLabel: document.getElementById('partner-mood-label'),
    partnerPhoto: document.getElementById('partner-photo'),
    partnerActiveDot: document.getElementById('partner-active-dot'),
    partnerDisplayName: document.getElementById('partner-display-name'),
    partnerHandle: document.getElementById('partner-handle'),
    emptyPartnerOverlay: document.getElementById('empty-partner-overlay'),

    // Timer
    counterCard: document.getElementById('counter-card'),
    anniversaryLabel: document.getElementById('anniversary-label'),
    tYears: document.getElementById('t-years'),
    tMonths: document.getElementById('t-months'),
    tDays: document.getElementById('t-days'),
    tHours: document.getElementById('t-hours'),
    tMinutes: document.getElementById('t-minutes'),
    tSeconds: document.getElementById('t-seconds'),
    lblYears: document.getElementById('lbl-years'),
    lblMonths: document.getElementById('lbl-months'),
    lblDays: document.getElementById('lbl-days'),
    milestoneText: document.getElementById('milestone-text'),

    // Single box
    inviteBoxCard: document.getElementById('invite-box-card'),
    homeCodeBox: document.getElementById('home-code-box'),
    homeInviteCode: document.getElementById('home-invite-code'),
    btnCopyCode: document.getElementById('btn-copy-code'),
    btnEnterPartnerCode: document.getElementById('btn-enter-partner-code'),
    btnShareTelegram: document.getElementById('btn-share-telegram'),

    // Note preview
    partnerNoteCard: document.getElementById('partner-note-card'),
    noteCardAuthor: document.getElementById('note-card-author'),
    noteCardTime: document.getElementById('note-card-time'),
    partnerNoteQuote: document.getElementById('partner-note-quote'),
    noteMiniEmoji: document.getElementById('note-mini-emoji'),

    // Settings Tab
    inputDisplayName: document.getElementById('input-display-name'),
    btnSaveName: document.getElementById('btn-save-name'),
    settingsPreviewPhoto: document.getElementById('settings-preview-photo'),
    filePhotoInput: document.getElementById('file-photo-input'),
    btnSyncTgPhoto: document.getElementById('btn-sync-tg-photo'),
    btnResetPhoto: document.getElementById('btn-reset-photo'),
    moodSelectorGrid: document.getElementById('mood-selector-grid'),
    inputMoodReason: document.getElementById('input-mood-reason'),
    btnSaveMood: document.getElementById('btn-save-mood'),
    inputRelationshipDate: document.getElementById('input-relationship-date'),
    btnSaveDate: document.getElementById('btn-save-date'),
    
    settingsPairedView: document.getElementById('settings-paired-view'),
    settingsSingleView: document.getElementById('settings-single-view'),
    settingsPartnerPhoto: document.getElementById('settings-partner-photo'),
    settingsPartnerName: document.getElementById('settings-partner-name'),
    settingsPartnerHandle: document.getElementById('settings-partner-handle'),
    btnUnlinkPartner: document.getElementById('btn-unlink-partner'),
    inputPartnerCode: document.getElementById('input-partner-code'),
    btnPairByCode: document.getElementById('btn-pair-by-code'),
    settingsCodeBox: document.getElementById('settings-code-box'),
    settingsMyCode: document.getElementById('settings-my-code'),
    
    btnOpenSupport: document.getElementById('btn-open-support'),
    btnThemeLight: document.getElementById('btn-theme-light'),
    btnThemeDark: document.getElementById('btn-theme-dark'),

    // Navigation
    navBtnHome: document.getElementById('nav-btn-home'),
    navBtnSettings: document.getElementById('nav-btn-settings'),
    tabHome: document.getElementById('tab-home'),
    tabSettings: document.getElementById('tab-settings'),

    // Modals
    modalPartnerMood: document.getElementById('modal-partner-mood'),
    modalPartnerPhoto: document.getElementById('modal-partner-photo'),
    modalPartnerTitle: document.getElementById('modal-partner-title'),
    modalMoodEmoji: document.getElementById('modal-mood-emoji'),
    modalBigEmoji: document.getElementById('modal-big-emoji'),
    modalMoodLabel: document.getElementById('modal-mood-label'),
    modalMoodReason: document.getElementById('modal-mood-reason'),
    modalMoodTime: document.getElementById('modal-mood-time'),
    btnCloseMoodModal: document.getElementById('btn-close-mood-modal'),

    modalUnlinkConfirm: document.getElementById('modal-unlink-confirm'),
    btnConfirmUnlink: document.getElementById('btn-confirm-unlink'),
    btnCancelUnlink: document.getElementById('btn-cancel-unlink'),

    modalSupport: document.getElementById('modal-support'),
    btnCloseSupportModal: document.getElementById('btn-close-support-modal'),
    supportCategoryTabs: document.getElementById('support-category-tabs'),
    inputSupportMessage: document.getElementById('input-support-message'),
    btnSubmitSupport: document.getElementById('btn-submit-support'),

    toast: document.getElementById('toast'),
  };

  // --- Toast Helper ---
  let toastTimeout = null;
  function showToast(msg) {
    if (!el.toast) return;
    el.toast.textContent = msg;
    el.toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      el.toast.classList.remove('show');
    }, 2800);
  }

  // --- API Calls ---
  async function apiGet(path) {
    try {
      const res = await fetch(path);
      return await res.json();
    } catch (e) {
      console.error('[API GET Error]', path, e);
      return null;
    }
  }

  async function apiPost(path, data) {
    try {
      const payload = Object.assign({}, data);
      if (payload.username === undefined && state.username) {
        payload.username = state.username;
      }
      if (payload.tg_id === undefined && state.tgId) {
        payload.tg_id = state.tgId;
      }
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (e) {
      console.error('[API POST Error]', path, e);
      return null;
    }
  }

  // --- Pluralization Helpers (RU) ---
  function pluralize(n, forms) {
    n = Math.abs(n) % 100;
    const n1 = n % 10;
    if (n > 10 && n < 20) return forms[2];
    if (n1 > 1 && n1 < 5) return forms[1];
    if (n1 === 1) return forms[0];
    return forms[2];
  }

  function formatTimeAgo(timestamp) {
    if (!timestamp) return 'недавно';
    const sec = Math.floor((Date.now() / 1000) - timestamp);
    if (sec < 60) return 'только что';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} ${pluralize(min, ['минуту', 'минуты', 'минут'])} назад`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs} ${pluralize(hrs, ['час', 'часа', 'часов'])} назад`;
    const days = Math.floor(hrs / 24);
    return `${days} ${pluralize(days, ['день', 'дня', 'дней'])} назад`;
  }

  function formatDisplayDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length < 3) return dateStr;
    const months = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    const day = parseInt(parts[2], 10);
    const month = months[parseInt(parts[1], 10) - 1];
    const year = parts[0];
    return `с ${day} ${month} ${year} года`;
  }

  // --- Exact Calendar Mathematics (guaranteed non-negative units) ---
  function getCalendarDiff(d0, d1) {
    if (d1 < d0) return { y: 0, m: 0, d: 0, h: 0, min: 0, s: 0 };

    function daysInMonth(year, month) {
      return new Date(year, month + 1, 0).getDate();
    }

    let y = d1.getFullYear() - d0.getFullYear();
    let cur = new Date(
      d0.getFullYear() + y,
      d0.getMonth(),
      Math.min(d0.getDate(), daysInMonth(d0.getFullYear() + y, d0.getMonth())),
      d0.getHours(),
      d0.getMinutes(),
      d0.getSeconds()
    );
    if (cur > d1) {
      y--;
      cur = new Date(
        d0.getFullYear() + y,
        d0.getMonth(),
        Math.min(d0.getDate(), daysInMonth(d0.getFullYear() + y, d0.getMonth())),
        d0.getHours(),
        d0.getMinutes(),
        d0.getSeconds()
      );
    }

    let m = 0;
    while (true) {
      let targetM = cur.getMonth() + 1;
      let targetY = cur.getFullYear();
      if (targetM > 11) {
        targetM = 0;
        targetY++;
      }
      let maxD = daysInMonth(targetY, targetM);
      let targetD = Math.min(d0.getDate(), maxD);
      let nextMonth = new Date(
        targetY,
        targetM,
        targetD,
        d0.getHours(),
        d0.getMinutes(),
        d0.getSeconds()
      );
      if (nextMonth <= d1) {
        m++;
        cur = nextMonth;
      } else {
        break;
      }
    }

    let totalSec = Math.floor((d1.getTime() - cur.getTime()) / 1000);
    let d = Math.floor(totalSec / 86400);
    let rem = totalSec % 86400;
    let h = Math.floor(rem / 3600);
    rem = rem % 3600;
    let min = Math.floor(rem / 60);
    let s = rem % 60;

    return { y, m, d, h, min, s };
  }

  // --- Precise Relationship Timer ---
  function updateLiveTimer() {
    if (!state.isPaired || !state.relationshipStart) return;

    let d0;
    if (state.relationshipStart.includes('T')) {
      if (state.pairedAt && state.pairedAt > 0) {
        d0 = new Date(state.pairedAt * 1000);
      } else {
        const parts = state.relationshipStart.split('T');
        const dateParts = parts[0].split('-').map(Number);
        const timeParts = (parts[1] || '00:00:00').split('.')[0].split(':').map(Number);
        d0 = new Date(
          dateParts[0],
          dateParts[1] - 1,
          dateParts[2],
          timeParts[0] || 0,
          timeParts[1] || 0,
          timeParts[2] || 0
        );
      }
    } else {
      const startParts = state.relationshipStart.split('-');
      if (startParts.length < 3) return;
      d0 = new Date(
        parseInt(startParts[0], 10),
        parseInt(startParts[1], 10) - 1,
        parseInt(startParts[2], 10),
        0, 0, 0
      );
    }

    // Synchronize client date with server offset if available
    const d1 = new Date(Date.now() + (state.serverTimeOffset || 0));
    let timeDiffMs = d1.getTime() - d0.getTime();

    if (timeDiffMs < 0) {
      if (state.relationshipStart.includes('T')) {
        // Pairing down-to-seconds timestamp: clamp clock skew to start counting from 0
        d1.setTime(d0.getTime());
        timeDiffMs = 0;
      } else if (timeDiffMs < -60000) {
        el.tYears.textContent = '0';
        el.tMonths.textContent = '0';
        el.tDays.textContent = '0';
        el.tHours.textContent = '00';
        el.tMinutes.textContent = '00';
        el.tSeconds.textContent = '00';
        el.daysTotalNum.textContent = '0';
        el.milestoneText.textContent = '⏳ До начала отношений осталось совсем немного!';
        return;
      } else {
        d1.setTime(d0.getTime());
      }
    }

    const diff = getCalendarDiff(d0, d1);

    el.tYears.textContent = String(diff.y);
    el.tMonths.textContent = String(diff.m);
    el.tDays.textContent = String(diff.d);
    el.tHours.textContent = String(diff.h).padStart(2, '0');
    el.tMinutes.textContent = String(diff.min).padStart(2, '0');
    el.tSeconds.textContent = String(diff.s).padStart(2, '0');

    el.lblYears.textContent = pluralize(diff.y, ['Год', 'Года', 'Лет']);
    el.lblMonths.textContent = pluralize(diff.m, ['Месяц', 'Месяца', 'Месяцев']);
    el.lblDays.textContent = pluralize(diff.d, ['День', 'Дня', 'Дней']);

    // Total Days
    const totalDays = Math.floor(Math.max(0, (d1.getTime() - d0.getTime()) / (1000 * 60 * 60 * 24)));
    el.daysTotalNum.textContent = String(totalDays);

    // Milestone calculation (Next Anniversary)
    const nextAnniv = new Date(d1.getFullYear(), d0.getMonth(), d0.getDate(), d0.getHours(), d0.getMinutes(), d0.getSeconds());
    if (nextAnniv <= d1) {
      nextAnniv.setFullYear(nextAnniv.getFullYear() + 1);
    }
    const daysToAnniv = Math.ceil((nextAnniv.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));

    el.milestoneText.textContent = `🎉 Всего ${totalDays} ${pluralize(totalDays, ['день', 'дня', 'дней'])} вместе • До годовщины: ${daysToAnniv} ${pluralize(daysToAnniv, ['день', 'дня', 'дней'])}`;
  }

  // --- Render App State ---
  function renderState(data) {
    if (!data || !data.ok) return;

    if (data.botUsername) {
      state.botUsername = data.botUsername;
    }

    state.user = data.user;
    state.partner = data.partner;
    state.isPaired = Boolean(data.isPaired);
    state.pairedAt = data.pairedAt || 0;

    if (data.user?.username) {
      state.username = data.user.username;
      try { localStorage.setItem('dvoe_tg_user', state.username); } catch (e) {}
    }
    if (data.user?.tgId) {
      state.tgId = data.user.tgId;
      try { localStorage.setItem('dvoe_tg_id', String(state.tgId)); } catch (e) {}
    }

    if (data.serverTime) {
      state.serverTimeOffset = (data.serverTime * 1000) - Date.now();
    }
    state.relationshipStart = state.isPaired ? (data.relationshipStart || '') : '';

    // Header & Brand
    if (el.coupleStatusText) {
      el.coupleStatusText.textContent = state.isPaired ? 'Вместе 💕' : 'В поиске пары';
    }

    // Active dots
    if (el.userActiveDot) {
      el.userActiveDot.classList.remove('hidden');
    }
    if (el.partnerActiveDot) {
      const isOnline = state.isPaired && state.partner && state.partner.lastActive && ((Date.now() / 1000) - state.partner.lastActive <= 300);
      if (isOnline) {
        el.partnerActiveDot.classList.remove('hidden');
      } else {
        el.partnerActiveDot.classList.add('hidden');
      }
    }

    // User (You)
    const userPhotoSrc = state.user.photoUrl || '/img/avatar_me.svg';
    if (el.userPhoto && el.userPhoto.getAttribute('src') !== userPhotoSrc) {
      el.userPhoto.src = userPhotoSrc;
    }
    if (el.settingsPreviewPhoto && el.settingsPreviewPhoto.getAttribute('src') !== userPhotoSrc) {
      el.settingsPreviewPhoto.src = userPhotoSrc;
    }
    el.userDisplayName.textContent = state.user.displayName || state.user.username;
    el.userHandle.textContent = state.user.username.startsWith('user_') ? '' : `@${state.user.username}`;
    const isEditingName = (state.activeTab === 'tab-settings') && (
      document.activeElement === el.inputDisplayName ||
      (el.inputDisplayName && el.inputDisplayName.value && el.inputDisplayName.value !== (state.user.displayName || state.user.username))
    );
    if (el.inputDisplayName && !isEditingName) {
      el.inputDisplayName.value = state.user.displayName || state.user.username;
    }
    el.userMoodEmoji.textContent = state.user.moodEmoji || '🥰';
    el.userMoodLabel.textContent = state.user.moodLabel || 'Люблю';

    // Partner
    if (state.isPaired && state.partner) {
      const partnerPhotoSrc = state.partner.photoUrl || '/img/avatar_partner.svg';
      if (el.partnerPhoto && el.partnerPhoto.getAttribute('src') !== partnerPhotoSrc) {
        el.partnerPhoto.src = partnerPhotoSrc;
      }
      if (el.settingsPartnerPhoto && el.settingsPartnerPhoto.getAttribute('src') !== partnerPhotoSrc) {
        el.settingsPartnerPhoto.src = partnerPhotoSrc;
      }
      el.partnerDisplayName.textContent = state.partner.displayName || state.partner.username;
      el.partnerHandle.textContent = state.partner.username.startsWith('user_') ? '' : `@${state.partner.username}`;
      el.emptyPartnerOverlay.classList.add('hidden');

      // Partner Mood above photo
      el.partnerMoodAnchor.classList.remove('hidden');
      el.partnerMoodEmoji.textContent = state.partner.moodEmoji || '🥰';
      el.partnerMoodLabel.textContent = state.partner.moodLabel || 'Люблю';

      // Partner note card preview
      if (state.partner.moodReason) {
        el.partnerNoteCard.classList.remove('hidden');
        el.noteCardAuthor.textContent = `Настроение ${state.partner.displayName}:`;
        el.partnerNoteQuote.textContent = `«${state.partner.moodReason}»`;
        el.noteCardTime.textContent = formatTimeAgo(state.partner.moodUpdatedAt);
        el.noteMiniEmoji.textContent = state.partner.moodEmoji || '💭';
      } else {
        el.partnerNoteCard.classList.add('hidden');
      }

      // Settings partner views
      el.settingsPairedView.classList.remove('hidden');
      el.settingsSingleView.classList.add('hidden');
      el.settingsPartnerName.textContent = state.partner.displayName || state.partner.username;
      el.settingsPartnerHandle.textContent = state.partner.username.startsWith('user_') ? '' : `@${state.partner.username}`;

      if (el.counterCard) el.counterCard.classList.remove('hidden');
      if (el.inviteBoxCard) el.inviteBoxCard.classList.add('hidden');
    } else {
      // Single state
      if (el.partnerPhoto && el.partnerPhoto.getAttribute('src') !== '/img/avatar_partner.svg') {
        el.partnerPhoto.src = '/img/avatar_partner.svg';
      }
      el.partnerDisplayName.textContent = 'Пригласить';
      el.partnerHandle.textContent = 'вторую половинку';
      el.emptyPartnerOverlay.classList.remove('hidden');
      el.partnerMoodAnchor.classList.add('hidden');
      el.partnerNoteCard.classList.add('hidden');

      el.settingsPairedView.classList.add('hidden');
      el.settingsSingleView.classList.remove('hidden');
      if (el.settingsMyCode) el.settingsMyCode.textContent = state.user.inviteCode;

      if (el.counterCard) el.counterCard.classList.add('hidden');
      if (el.inviteBoxCard) el.inviteBoxCard.classList.remove('hidden');
      if (el.homeInviteCode) el.homeInviteCode.textContent = state.user.inviteCode;
    }

    // Anniversary
    if (el.anniversaryLabel) {
      el.anniversaryLabel.textContent = (state.isPaired && state.relationshipStart) ? formatDisplayDate(state.relationshipStart) : '';
    }
    const isEditingDate = (state.activeTab === 'tab-settings') && (
      document.activeElement === el.inputRelationshipDate ||
      (el.inputRelationshipDate && el.inputRelationshipDate.dataset && el.inputRelationshipDate.dataset.userDirty === 'true') ||
      (el.inputRelationshipDate && el.inputRelationshipDate.value && el.inputRelationshipDate.value !== state.relationshipStart.split('T')[0])
    );
    if (el.inputRelationshipDate && state.relationshipStart && (!isEditingDate || !el.inputRelationshipDate.value)) {
      el.inputRelationshipDate.value = state.relationshipStart.split('T')[0];
    }

    // Settings Mood selection & Button Highlighting
    const isEditingMood = (state.activeTab === 'tab-settings' && state.moodDirty);
    if (state.user.moodEmoji && !isEditingMood) {
      state.selectedMood = {
        emoji: state.user.moodEmoji,
        label: state.user.moodLabel || 'Люблю',
      };
      document.querySelectorAll('.btn-mood-select').forEach((btn) => {
        const emo = btn.querySelector('.m-emoji')?.textContent?.trim();
        const lbl = btn.querySelector('.m-label')?.textContent?.trim();
        const matchesBoth = (emo === state.user.moodEmoji && lbl === state.user.moodLabel);
        const matchesFallback = (!state.user.moodLabel && emo === state.user.moodEmoji) || (!state.user.moodEmoji && lbl === state.user.moodLabel);
        if (matchesBoth || matchesFallback) {
          btn.classList.add('selected');
        } else {
          btn.classList.remove('selected');
        }
      });
    }

    const isEditingReason = (state.activeTab === 'tab-settings') && (
      document.activeElement === el.inputMoodReason ||
      (el.inputMoodReason && el.inputMoodReason.value && el.inputMoodReason.value !== (state.user.moodReason || ''))
    );
    if (el.inputMoodReason && !isEditingReason) {
      el.inputMoodReason.value = state.user.moodReason || '';
    }

    // Check incoming sign of attention from partner in WebApp
    if (state.user && state.user.moodReaction && state.user.moodReactionAt) {
      if (!state.lastSeenReactionAt) {
        state.lastSeenReactionAt = state.user.moodReactionAt;
      } else if (state.user.moodReactionAt > state.lastSeenReactionAt) {
        state.lastSeenReactionAt = state.user.moodReactionAt;
        const fromName = state.partner?.displayName || 'Партнёр';
        const reactEmoji = state.user.moodReaction || '❤️';
        showToast(`${reactEmoji} ${fromName} шлёт вам знак внимания! 💕`);
        haptic('medium');
      }
    }

    // Check incoming mood update from partner in WebApp
    if (state.partner && state.partner.moodUpdatedAt) {
      if (!state.lastSeenPartnerMoodAt) {
        state.lastSeenPartnerMoodAt = state.partner.moodUpdatedAt;
      } else if (state.partner.moodUpdatedAt > state.lastSeenPartnerMoodAt) {
        state.lastSeenPartnerMoodAt = state.partner.moodUpdatedAt;
        const pName = state.partner?.displayName || 'Партнёр';
        showToast(`💭 ${pName} обновил(-а) настроение: ${state.partner.moodEmoji} ${state.partner.moodLabel}`);
        haptic('light');
      }
    }

    renderPromoPartner(data.promoPartner);
    updateLiveTimer();
  }

  function renderPromoPartner(promoPartner) {
    const card = document.getElementById('promo-partner-card');
    if (!card) return;
    if (!promoPartner || !promoPartner.channel_username) {
      card.classList.add('hidden');
      return;
    }
    const titleEl = document.getElementById('promo-partner-title');
    const descEl = document.getElementById('promo-partner-desc');
    const linkEl = document.getElementById('promo-partner-link');
    if (titleEl) titleEl.textContent = promoPartner.channel_title || promoPartner.channel_username;
    if (descEl) descEl.textContent = promoPartner.channel_description || 'Рекомендуемый канал';
    if (linkEl) {
      const rawU = (promoPartner.channel_username || '').replace(/^@/, '');
      linkEl.href = `https://t.me/${rawU}`;
      linkEl.onclick = (e) => {
        if (window.Telegram && Telegram.WebApp && typeof Telegram.WebApp.openTelegramLink === 'function') {
          e.preventDefault();
          Telegram.WebApp.openTelegramLink(`https://t.me/${rawU}`);
        }
      };
    }
    card.classList.remove('hidden');
  }

  // --- Fetch State ---
  async function loadState() {
    const params = new URLSearchParams({
      username: state.username,
      tg_id: String(state.tgId),
      displayName: state.displayName,
    });
    if (state.tgPhotoUrl) {
      params.set('photo_url', state.tgPhotoUrl);
    }
    const res = await apiGet(`/api/state?${params.toString()}`);
    if (res && res.ok) {
      renderState(res);
    }
  }

  // --- Populate Mood Selector in Settings ---
  function initMoodSelector() {
    el.moodSelectorGrid.innerHTML = '';
    PRESET_MOODS.forEach((m) => {
      const btn = document.createElement('button');
      btn.className = 'btn-mood-select';
      const isSelected = (m.emoji === state.selectedMood?.emoji && m.label === state.selectedMood?.label) ||
                         (!state.selectedMood?.label && m.emoji === state.selectedMood?.emoji);
      if (isSelected) {
        btn.classList.add('selected');
      }
      btn.innerHTML = `<span class="m-emoji">${m.emoji}</span><span class="m-label">${m.label}</span>`;
      btn.addEventListener('click', () => {
        haptic('light');
        document.querySelectorAll('.btn-mood-select').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        state.selectedMood = m;
        state.moodDirty = true;
      });
      el.moodSelectorGrid.appendChild(btn);
    });
  }

  // --- Tab Navigation (Strictly 2 Tabs: Home & Settings) ---
  function switchTab(tabId) {
    haptic('light');
    state.activeTab = tabId;

    if (tabId === 'tab-home') {
      state.moodDirty = false;
      if (el.inputRelationshipDate?.dataset) delete el.inputRelationshipDate.dataset.userDirty;
      el.tabHome.classList.add('active');
      el.tabSettings.classList.remove('active');
      el.navBtnHome.classList.add('active');
      el.navBtnSettings.classList.remove('active');
    } else {
      el.tabHome.classList.remove('active');
      el.tabSettings.classList.add('active');
      el.navBtnHome.classList.remove('active');
      el.navBtnSettings.classList.add('active');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- Open Partner Mood Explanation Modal ---
  function openPartnerMoodModal() {
    if (!state.isPaired || !state.partner) {
      switchTab('tab-settings');
      return;
    }
    haptic('medium');

    const p = state.partner;
    el.modalPartnerPhoto.src = p.photoUrl || '/img/bot_avatar_640.jpg';
    el.modalPartnerTitle.textContent = `Настроение ${p.displayName || p.username}`;
    el.modalMoodEmoji.textContent = p.moodEmoji || '🥰';
    el.modalBigEmoji.textContent = p.moodEmoji || '🥰';
    el.modalMoodLabel.textContent = p.moodLabel || 'Люблю';
    el.modalMoodTime.textContent = `Обновлено ${formatTimeAgo(p.moodUpdatedAt)}`;

    if (p.moodReason && p.moodReason.trim()) {
      el.modalMoodReason.textContent = `«${p.moodReason.trim()}»`;
    } else {
      el.modalMoodReason.textContent = '«Партнёр ещё не оставил подробного пояснения к настроению.»';
    }

    el.modalPartnerMood.classList.remove('hidden');
  }

  function closePartnerMoodModal() {
    el.modalPartnerMood.classList.add('hidden');
  }

  // --- Reactions to Partner Mood ---
  async function sendReaction(reaction) {
    haptic('success');
    showToast(`Отправлено: ${reaction} 💕`);
    closePartnerMoodModal();

    await apiPost('/api/mood/react', {
      username: state.username,
      tg_id: state.tgId,
      reaction: reaction,
    });
  }

  // --- 1:1 Photo Upload & Crop to Square ---
  function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    haptic('light');
    showToast('Обработка фото 1:1...');

    const reader = new FileReader();
    reader.onload = async function (evt) {
      const img = new Image();
      img.onload = async function () {
        // Center crop to 1:1 square canvas
        const canvas = document.createElement('canvas');
        const minDim = Math.min(img.width, img.height);
        const targetSize = Math.min(minDim, 800);
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');

        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);

        const base64 = canvas.toDataURL('image/jpeg', 0.88);
        const res = await apiPost('/api/photo/upload', {
          username: state.username,
          tg_id: state.tgId,
          image: base64,
        });

        if (res && res.ok) {
          haptic('success');
          showToast('Фото успешно обновлено! 🖼');
          renderState(res.state);
        } else {
          haptic('error');
          showToast('Ошибка загрузки фото');
        }
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  }

  // --- Sync Telegram Photo ---
  async function syncTgPhoto() {
    haptic('medium');
    showToast('Синхронизация с Telegram...');

    const res = await apiPost('/api/photo/sync-tg', {
      username: state.username,
      tg_id: state.tgId,
      photo_url: state.tgPhotoUrl,
    });

    if (res && res.ok && res.photoUrl) {
      haptic('success');
      showToast('Аватарка из Telegram установлена!');
      renderState(res.state);
    } else {
      haptic('warning');
      showToast('Telegram аватарка недоступна. Загрузите фото вручную.');
    }
  }

  // --- Save Display Name ---
  async function saveDisplayName() {
    const val = (el.inputDisplayName?.value || '').trim();
    if (!val) {
      showToast('⚠️ Введите ваше имя');
      return;
    }
    haptic('medium');
    if (el.btnSaveName) {
      el.btnSaveName.disabled = true;
      el.btnSaveName.textContent = 'Сохранение...';
    }

    const res = await apiPost('/api/profile', {
      username: state.username,
      tg_id: state.tgId,
      displayName: val,
    });

    if (el.btnSaveName) {
      el.btnSaveName.disabled = false;
      el.btnSaveName.textContent = 'Сохранить имя';
    }

    if (res && res.ok) {
      haptic('success');
      showToast('✅ Имя успешно сохранено!');
      if (res.state) {
        renderState(res.state);
      } else {
        state.displayName = val;
        if (state.user) state.user.displayName = val;
        if (el.userDisplayName) el.userDisplayName.textContent = val;
      }
    } else {
      haptic('error');
      showToast('❌ Ошибка сохранения имени');
    }
  }

  // --- Save Mood & Explanation ---
  async function saveMood() {
    const reason = el.inputMoodReason.value.trim();
    haptic('success');
    showToast('Сохраняем настроение...');

    const res = await apiPost('/api/mood', {
      username: state.username,
      tg_id: state.tgId,
      emoji: state.selectedMood.emoji,
      label: state.selectedMood.label,
      reason: reason,
    });

    if (res && res.ok) {
      state.moodDirty = false;
      showToast('Ваше настроение сохранено! ✨');
      renderState(res.state);
      switchTab('tab-home');
    }
  }

  // --- Save Relationship Date ---
  async function saveRelationshipDate() {
    const dVal = el.inputRelationshipDate.value;
    if (!dVal) {
      showToast('Выберите корректную дату');
      return;
    }
    haptic('success');
    showToast('Синхронизируем дату...');

    const res = await apiPost('/api/relationship-date', {
      username: state.username,
      tg_id: state.tgId,
      date: dVal,
    });

    if (res && res.ok) {
      if (el.inputRelationshipDate?.dataset) delete el.inputRelationshipDate.dataset.userDirty;
      showToast('Дата отношений сохранена для пары! 💍');
      renderState(res.state);
    }
  }

  // --- Pair Partner by Code ---
  async function pairByCode() {
    const code = el.inputPartnerCode.value.trim().toUpperCase();
    if (!code) {
      showToast('Введите код партнёра');
      return;
    }
    haptic('medium');
    showToast('Привязываем пару...');

    const res = await apiPost('/api/pair', {
      username: state.username,
      tg_id: state.tgId,
      partner_code: code,
    });

    if (res && res.ok) {
      haptic('success');
      showToast('Вы успешно соединились! 💕');
      renderState(res.state);
      switchTab('tab-home');
    } else {
      haptic('error');
      showToast(res?.error || 'Партнёр с таким кодом не найден');
    }
  }

  // --- Unlink Partner Flow ---
  function openUnlinkModal() {
    haptic('warning');
    el.modalUnlinkConfirm.classList.remove('hidden');
  }

  function closeUnlinkModal() {
    el.modalUnlinkConfirm.classList.add('hidden');
  }

  async function confirmUnlink() {
    closeUnlinkModal();
    haptic('error');
    showToast('Отвязываем партнёра...');

    const res = await apiPost('/api/pair/unlink', {
      username: state.username,
      tg_id: state.tgId,
    });

    if (res && res.ok) {
      showToast('Партнёр отвязан 💔');
      renderState(res.state);
    }
  }

  // --- Support Flow ---
  let selectedCategory = 'feedback';
  function openSupportModal() {
    haptic('light');
    el.inputSupportMessage.value = '';
    el.modalSupport.classList.remove('hidden');
  }

  function closeSupportModal() {
    el.modalSupport.classList.add('hidden');
  }

  async function submitSupport() {
    const msg = el.inputSupportMessage.value.trim();
    if (!msg) {
      showToast('Напишите сообщение перед отправкой');
      return;
    }
    haptic('success');
    showToast('Отправка разработчику...');

    const res = await apiPost('/api/support', {
      username: state.username,
      tg_id: state.tgId,
      message: msg,
      category: selectedCategory,
    });

    if (res && res.ok) {
      closeSupportModal();
      showToast('Спасибо! Сообщение отправлено разработчику 💕');
    } else {
      showToast('Не удалось отправить сообщение');
    }
  }

  // --- Copy & Share Invite ---
  let lastCopyTimestamp = 0;
  function fallbackCopyText(text) {
    if (typeof document === 'undefined' || !document.createElement) return false;
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      ta.style.top = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      if (ta.setSelectionRange) {
        ta.setSelectionRange(0, 99999);
      }
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (err) {
      return false;
    }
  }

  function copyInviteCode(e) {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    const now = Date.now();
    if (now - lastCopyTimestamp < 400) return;
    lastCopyTimestamp = now;

    const code = state.user?.inviteCode || 'PAIR-XXXXXX';
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).catch(() => {
        fallbackCopyText(code);
      });
    } else {
      fallbackCopyText(code);
    }
    haptic('light');
    showToast('Код скопирован! 📋');
  }

  function shareTelegram() {
    const code = state.user?.inviteCode || 'PAIR-XXXXXX';
    const linkBot = state.user?.inviteLink?.match(/t\.me\/([^?]+)/)?.[1];
    const botUser = state.botUsername || linkBot || 'ChibiLovePara_bot';
    const text = encodeURIComponent(`Привет! Присоединяйся ко мне в приложении «Двое» 💕\nНаш код пары: ${code}`);
    const url = `https://t.me/share/url?url=https://t.me/${botUser}?start=pair_${code}&text=${text}`;

    if (tg?.openTelegramLink) {
      tg.openTelegramLink(url);
    } else {
      window.open(url, '_blank');
    }
  }

  // --- Theme Toggle ---
  function setTheme(theme) {
    haptic('light');
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${theme}`);
    localStorage.setItem('dvoe_theme', theme);

    if (theme === 'dark') {
      el.btnThemeDark.classList.add('active');
      el.btnThemeLight.classList.remove('active');
    } else {
      el.btnThemeLight.classList.add('active');
      el.btnThemeDark.classList.remove('active');
    }
  }

  function initTheme() {
    const saved = localStorage.getItem('dvoe_theme') || 'light';
    setTheme(saved);
  }

  // --- Event Listeners Setup ---
  function setupEventListeners() {
    // Navigation
    el.navBtnHome.addEventListener('click', () => switchTab('tab-home'));
    el.navBtnSettings.addEventListener('click', () => switchTab('tab-settings'));
    el.btnRefresh.addEventListener('click', () => {
      haptic('light');
      loadState();
      showToast('Обновлено ✨');
    });

    // Partner Mood Click -> Open Modal
    el.partnerMoodAnchor.addEventListener('click', openPartnerMoodModal);
    el.partnerPhoto.addEventListener('click', () => {
      if (state.isPaired) openPartnerMoodModal();
      else switchTab('tab-settings');
    });
    el.emptyPartnerOverlay.addEventListener('click', () => switchTab('tab-settings'));

    // Own Mood Click -> Quick jump to settings mood editor
    el.userMoodAnchor.addEventListener('click', () => {
      switchTab('tab-settings');
      el.inputMoodReason.focus();
    });

    // Heart Connection Button
    let lastNudgeTime = 0;
    el.heartBtn.addEventListener('click', async () => {
      if (!state.isPaired) {
        haptic('warning');
        showToast('Сначала подключите вторую половинку! 💕');
        return;
      }
      const now = Date.now();
      if (now - lastNudgeTime < 2000) {
        haptic('light');
        showToast('Знак внимания уже летит! 💕');
        return;
      }
      lastNudgeTime = now;
      haptic('medium');

      el.heartBtn.classList.remove('heart-pop-anim');
      void el.heartBtn.offsetWidth;
      el.heartBtn.classList.add('heart-pop-anim');

      showToast('Любовь отправлена! 💕');
      const res = await apiPost('/api/heart-nudge', { username: state.username, tg_id: state.tgId, reaction: '❤️' });
      if (res && res.state) {
        renderState(res.state);
      }
    });

    // Modals
    el.btnCloseMoodModal.addEventListener('click', closePartnerMoodModal);
    el.modalPartnerMood.addEventListener('click', (e) => {
      if (e.target === el.modalPartnerMood) closePartnerMoodModal();
    });

    document.querySelectorAll('.btn-reaction').forEach((btn) => {
      btn.addEventListener('click', () => sendReaction(btn.dataset.reaction));
    });

    // Unlink Modal
    el.btnUnlinkPartner.addEventListener('click', openUnlinkModal);
    el.btnCancelUnlink.addEventListener('click', closeUnlinkModal);
    el.btnConfirmUnlink.addEventListener('click', confirmUnlink);
    el.modalUnlinkConfirm.addEventListener('click', (e) => {
      if (e.target === el.modalUnlinkConfirm) closeUnlinkModal();
    });

    // Support Modal
    el.btnOpenSupport.addEventListener('click', openSupportModal);
    el.btnCloseSupportModal.addEventListener('click', closeSupportModal);
    el.modalSupport.addEventListener('click', (e) => {
      if (e.target === el.modalSupport) closeSupportModal();
    });
    el.btnSubmitSupport.addEventListener('click', submitSupport);

    el.supportCategoryTabs.querySelectorAll('.btn-cat').forEach((btn) => {
      btn.addEventListener('click', () => {
        haptic('light');
        el.supportCategoryTabs.querySelectorAll('.btn-cat').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedCategory = btn.dataset.cat;
      });
    });

    // Settings Actions
    el.filePhotoInput.addEventListener('change', handlePhotoUpload);
    el.btnSyncTgPhoto.addEventListener('click', syncTgPhoto);
    el.btnResetPhoto?.addEventListener('click', async () => {
      haptic('light');
      showToast('Сбрасываем фото...');
      const res = await apiPost('/api/photo/reset', { username: state.username, tg_id: state.tgId });
      if (res && res.ok) {
        haptic('success');
        showToast('Фото сброшено на стандартное ✨');
        renderState(res.state);
      }
    });
    el.btnSaveName?.addEventListener('click', saveDisplayName);
    el.inputDisplayName?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveDisplayName();
      }
    });
    el.btnSaveMood.addEventListener('click', saveMood);
    el.btnSaveDate.addEventListener('click', saveRelationshipDate);
    el.inputRelationshipDate?.addEventListener('input', () => {
      if (el.inputRelationshipDate?.dataset) el.inputRelationshipDate.dataset.userDirty = 'true';
    });
    el.inputRelationshipDate?.addEventListener('change', () => {
      if (el.inputRelationshipDate?.dataset) el.inputRelationshipDate.dataset.userDirty = 'true';
    });
    el.btnPairByCode.addEventListener('click', pairByCode);

    // Note card click on main screen
    el.partnerNoteCard?.addEventListener('click', openPartnerMoodModal);

    // Share & Copy (tap on copy buttons, invite code text, and container cards)
    if (el.btnCopyCode) el.btnCopyCode.addEventListener('click', copyInviteCode);
    if (el.homeInviteCode) el.homeInviteCode.addEventListener('click', copyInviteCode);
    if (el.homeCodeBox) el.homeCodeBox.addEventListener('click', copyInviteCode);
    if (el.settingsMyCode) el.settingsMyCode.addEventListener('click', copyInviteCode);
    if (el.settingsCodeBox) el.settingsCodeBox.addEventListener('click', copyInviteCode);
    if (el.btnEnterPartnerCode) {
      el.btnEnterPartnerCode.addEventListener('click', () => {
        haptic('light');
        switchTab('tab-settings');
        if (el.inputPartnerCode) {
          setTimeout(() => el.inputPartnerCode.focus(), 150);
        }
      });
    }
    if (el.btnShareTelegram) el.btnShareTelegram.addEventListener('click', shareTelegram);

    // Themes
    el.btnThemeLight.addEventListener('click', () => setTheme('light'));
    el.btnThemeDark.addEventListener('click', () => setTheme('dark'));
  }

  // --- App Initialization ---
  async function init() {
    initTheme();
    initMoodSelector();
    setupEventListeners();

    await loadState();

    try {
      const pData = await apiGet('/api/promo_partner');
      if (pData && pData.ok && pData.partner) {
        renderPromoPartner(pData.partner);
      }
    } catch (e) {}

    // Start live timer ticking every 1000ms
    state.timerInterval = setInterval(updateLiveTimer, 1000);

    // Subtle state background poll every 12 seconds
    state.pollInterval = setInterval(loadState, 12000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
