// ============================================================================
// ChibiLove (ЧибиПара) — Cute Pet Catalog & Config
// Features 11 authentic kawaii pets matching reference design,
// cozy pastel themes, care actions, treats, and mood statuses.
// ============================================================================

(function () {
  "use strict";

  window.CHIBI_CONFIG = {
    // 11 Cute Selectable Pets matching uploaded artwork
    pets: [
      {
        id: "kitty_bear",
        name: "Мишка-Котёнок",
        icon: "🐱",
        badge: "Нежный пушистик с бантиком",
        quote: "Мурр! Я тебя так люблю! 💕",
        color: "#F472B6",
        img: "/img/pets/kitty_bear.png",
        desc: "Белоснежный пушистый малыш с нежно-розовым бантом на шее и румяными щёчками."
      },
      {
        id: "puppy",
        name: "Щенок",
        icon: "🐶",
        badge: "Верный и ласковый друг",
        quote: "Гав! Давай играть и обниматься! 🐾",
        color: "#FBBF24",
        img: "/img/pets/puppy.png",
        desc: "Золотисто-белый пухлый щеночек с мягкими вислоухими ушками и добрыми глазками."
      },
      {
        id: "fox",
        name: "Лисёнок",
        icon: "🦊",
        badge: "Озорной сладкоежка с яблочком",
        quote: "Фырк! У меня для тебя сладкое яблочко! 🍎",
        color: "#FB923C",
        img: "/img/pets/fox.png",
        desc: "Рыженький пушистик с пушистым полосатым хвостиком и спелым красным яблоком."
      },
      {
        id: "panda",
        name: "Пандочка",
        icon: "🐼",
        badge: "Любитель свежего бамбука",
        quote: "Хрум-хрум, бамбук такой вкусный! 🎋",
        color: "#4ADE80",
        img: "/img/pets/panda.png",
        desc: "Кругленькая чёрно-белая панда, которая обожает лакомиться свежими листочками."
      },
      {
        id: "penguin",
        name: "Пингвинчик",
        icon: "🐧",
        badge: "Малыш в ночном колпачке",
        quote: "Уии! Смотри, какая уютная льдинка! ❄️",
        color: "#38BDF8",
        img: "/img/pets/penguin.png",
        desc: "Маленький пингвинчик в полосатом ночном колпачке, стоящий на чистой льдинке."
      },
      {
        id: "hamster",
        name: "Хомячок",
        icon: "🐹",
        badge: "Пухлые щёчки и доброе сердце",
        quote: "Пи-пи! Я спрятал для тебя вкусняшку! ✨",
        color: "#F59E0B",
        img: "/img/pets/hamster.png",
        desc: "Золотисто-белый круглый хомячок с пухлыми щёчками и сложенными лапками."
      },
      {
        id: "bunny",
        name: "Зайчик",
        icon: "🐰",
        badge: "Мягкий ушастик-мечтатель",
        quote: "Прыг-скок! Ты моё главное солнышко! 🌸",
        color: "#F43F5E",
        img: "/img/pets/bunny.png",
        desc: "Беленький ушастик с розовыми ушками, обожающий тёплые объятия."
      },
      {
        id: "chick",
        name: "Цыплёнок",
        icon: "🐥",
        badge: "Круглое жёлтое солнышко",
        quote: "Пи-пи-пи! Радуюсь каждому мгновению! ☀️",
        color: "#FACC15",
        img: "/img/pets/chick.png",
        desc: "Солнечный кругленький цыплёнок с оранжевым клювиком и крошечными ножками."
      },
      {
        id: "koala",
        name: "Коала",
        icon: "🐨",
        badge: "Любитель поспать в шапочке",
        quote: "Ззз... давай немного поспим в обнимку? 💤",
        color: "#94A3B8",
        img: "/img/pets/koala.png",
        desc: "Мягкая серая коала в милой шапочке-жёлуде, которая любит лакомиться и дремать."
      },
      {
        id: "whale",
        name: "Китёнок",
        icon: "🐳",
        badge: "Морской пускатель фонтанчиков",
        quote: "Бульк! Лови фонтанчик любви и радости! 💧",
        color: "#60A5FA",
        img: "/img/pets/whale.png",
        desc: "Нежно-голубой китёнок, пускающий весёлые фонтанчики из сердечек."
      },
      {
        id: "bird",
        name: "Синичка",
        icon: "🕊️",
        badge: "Белая птичка на веточке сакуры",
        quote: "Чирик! Весна и любовь в моём сердце! 🌸",
        color: "#EC4899",
        img: "/img/pets/bird.png",
        desc: "Крошечная белая птичка синичка-энага, сидящая на цветущей веточке."
      }
    ],

    // Delicious Treats for Feeding
    foods: [
      { id: "cake", icon: "🍰", name: "Клубничный тортик", desc: "Нежный бисквит со свежими ягодами" },
      { id: "strawberry", icon: "🍓", name: "Спелая клубничка", desc: "Сладкие сочные ягодки" },
      { id: "cookie", icon: "🍪", name: "Печенье-сердечко", desc: "Хрустящее домашнее печенье с любовью" },
      { id: "ramen", icon: "🍜", name: "Горячий рамен", desc: "Сытный согревающий супчик" },
      { id: "onigiri", icon: "🍙", name: "Рисовый онигири", desc: "Свежий японский треугольник с нори" },
      { id: "boba", icon: "🧋", name: "Бабл-ти с тапиокой", desc: "Освежающий сливочный чай с шариками" },
      { id: "mochi", icon: "🍡", name: "Сладкие моти", desc: "Тягучие рисовые шарики" }
    ],

    // Care Actions
    careActions: [
      { id: "feed", icon: "🍰", name: "Покормить", action: "feed", desc: "Угостить вкусняшкой" },
      { id: "shower", icon: "🫧", name: "Искупать", action: "shower", desc: "Тёплая пенная ванночка" },
      { id: "sleep", icon: "🌙", name: "Уложить спать", action: "sleep", desc: "Укутать в одеялко" },
      { id: "pet", icon: "💖", name: "Погладить", action: "pet", desc: "Подарить нежную ласку" }
    ],

    // Cozy Pastel Themes
    pastelThemes: [
      { id: "pink", name: "Розовый рассвет 🌸", hex: "#FFE4EC", bg: "linear-gradient(180deg, #FFE4EC 0%, #FFF0F5 55%, #FFD9E6 100%)" },
      { id: "green", name: "Мятный сад 🌿", hex: "#DCFCE7", bg: "linear-gradient(180deg, #DCFCE7 0%, #F0FDF4 55%, #BBF7D0 100%)" },
      { id: "blue", name: "Лазурное небо ☁️", hex: "#E0F2FE", bg: "linear-gradient(180deg, #E0F2FE 0%, #F0F9FF 55%, #BAE6FD 100%)" },
      { id: "yellow", name: "Тёплый луч ☀️", hex: "#FEF9C3", bg: "linear-gradient(180deg, #FEF9C3 0%, #FEFCE8 55%, #FEF08A 100%)" },
      { id: "lime", name: "Свежий лайм 🍋", hex: "#ECFCCB", bg: "linear-gradient(180deg, #ECFCCB 0%, #F7FEE7 55%, #D9F99D 100%)" },
      { id: "purple", name: "Лавандовый сон 💜", hex: "#F3E8FF", bg: "linear-gradient(180deg, #F3E8FF 0%, #FAF5FF 55%, #E9D5FF 100%)" },
      { id: "orange", name: "Персиковый закат 🍑", hex: "#FFEDD5", bg: "linear-gradient(180deg, #FFEDD5 0%, #FFF7ED 55%, #FED7AA 100%)" },
      { id: "rainbow", name: "Пастельная радуга 🌈", hex: "#FDF2F8", bg: "linear-gradient(135deg, #FFE4E6 0%, #FEF3C7 33%, #E0F2FE 66%, #F3E8FF 100%)" }
    ],

    // Couple Poses
    poses: [
      { id: "hug", name: "Крепкие объятия 💕", icon: "🤗" },
      { id: "hold_hands", name: "Держатся за лапки 🐾", icon: "🤝" },
      { id: "pat_a_to_b", name: "Гладит по головке 🌸", icon: "🤚" },
      { id: "dance", name: "Весёлый танец ✨", icon: "💃" },
      { id: "sleep_together", name: "Спят в обнимку 💤", icon: "🌙" }
    ],

    // Flame Milestones (1-365 days)
    flameStages: [
      { tier: 1, minDays: 1, id: "spark", title: "✨ Крошечная Искорка", badge: "1-й уровень", desc: "Тёплый огонёк первого знакомства.", icon: "✨", color: "#F59E0B" },
      { tier: 2, minDays: 3, id: "flamelet", title: "🔥 Озорной Огонёк", badge: "2-й уровень", desc: "Огонёк окреп и стал игривым!", icon: "🔥", color: "#F97316" },
      { tier: 3, minDays: 7, id: "crowned", title: "👑 Коронованный Пламенек", badge: "1 неделя", desc: "Неделя неразлучны!", icon: "👑", color: "#EAB308" },
      { tier: 4, minDays: 14, id: "kitsune", title: "🦊 Огненный Лис-Дух", badge: "2 недели", desc: "Две недели любви!", icon: "🦊", color: "#FF6B35" },
      { tier: 5, minDays: 21, id: "cosmic", title: "⭐ Звёздный Огонёк", badge: "3 недели", desc: "Вокруг питомца кружат звёздочки.", icon: "⭐", color: "#A855F7" },
      { tier: 6, minDays: 28, id: "guardian", title: "🕊️ Пламенный Хранитель", badge: "1 месяц", desc: "Целый месяц вместе!", icon: "🕊️", color: "#EC4899" },
      { tier: 7, minDays: 60, id: "aurora", title: "🌈 Аврора Любви", badge: "2 месяца", desc: "Переливается цветами сияния.", icon: "🌈", color: "#06B6D4" },
      { tier: 8, minDays: 90, id: "drake", title: "🐉 Дракончик Пламени", badge: "3 месяца", desc: "Квартал безграничного счастья!", icon: "🐉", color: "#EF4444" },
      { tier: 9, minDays: 180, id: "eternal", title: "💎 Вечное Сердце", badge: "Полгода", desc: "Полгода верности и тепла.", icon: "💎", color: "#BE123C" },
      { tier: 10, minDays: 365, id: "phoenix", title: "☀️ Солнечный Феникс", badge: "1 год!", desc: "Год нерушимой пары! Легендарный уровень.", icon: "☀️", color: "#F59E0B" }
    ],

    // Emotional Moods (R3: Mutual Partner Mood Tracking)
    moods: [
      { id: "joyful", emoji: "🥰", label: "Радостное", badge: "Сияет от счастья ✨", desc: "Тепло и радостно на душе", color: "#F59E0B" },
      { id: "loving", emoji: "💖", label: "Влюблённое", badge: "Хочет обнимашек 💕", desc: "Все мысли только о тебе", color: "#EC4899" },
      { id: "cozy", emoji: "🧸", label: "Уютное", badge: "Под тёплым пледиком ☕", desc: "Спокойствие и гармония", color: "#8B5CF6" },
      { id: "tired", emoji: "🥱", label: "Уставшее", badge: "Нуждается в отдыхе 💤", desc: "Сил мало, нужен уют и покой", color: "#6B7280" },
      { id: "sad", emoji: "🥺", label: "Грустное", badge: "Нуждается в заботе 🌧️", desc: "Хочется нежности и поддержки", color: "#3B82F6" },
      { id: "stressed", emoji: "🤯", label: "В стрессе", badge: "Нужно выдохнуть 🌪️", desc: "Много задач и перегруз", color: "#EF4444" },
      { id: "excited", emoji: "✨", label: "В предвкушении", badge: "Полон(на) энергии 🚀", desc: "Жду встречи и грандиозных планов", color: "#10B981" }
    ],

    // Reason Tags for Moods
    moodTags: [
      { id: "work", icon: "💼", label: "Работа" },
      { id: "study", icon: "📚", label: "Учёба" },
      { id: "health", icon: "🍵", label: "Здоровье" },
      { id: "missing_you", icon: "💌", label: "Скучаю по тебе" },
      { id: "weather", icon: "🌧️", label: "Погода" },
      { id: "good_news", icon: "🎉", label: "Хорошие новости" }
    ],

    // Emotional Reactions to Partner's Mood
    moodReactions: [
      { id: "hug", icon: "🫂", label: "Обнять", soundMsg: "крепко обнимает тебя!", particles: ["🫂", "💕", "✨"] },
      { id: "kiss", icon: "💋", label: "Поцеловать", soundMsg: "нежно целует в щёчку!", particles: ["💋", "💖", "✨"] },
      { id: "tea", icon: "☕", label: "Заварить чай", soundMsg: "принёс(ла) горячий чай с печенькой!", particles: ["☕", "🍪", "✨"] },
      { id: "cheer", icon: "💖", label: "Подбодрить", soundMsg: "шлёт лучи любви и веры в тебя!", particles: ["💖", "⭐", "🎉"] }
    ],

    // Relationship Milestones
    milestones: [
      { days: 7, title: "Первая неделя вместе", badge: "7 дней", icon: "🌸", desc: "Первые совместные дни и сладкие моменты!" },
      { days: 30, title: "Первый месяц любви", badge: "1 месяц", icon: "🕊️", desc: "Целый месяц рука об руку!" },
      { days: 50, title: "50 дней нежности", badge: "50 дней", icon: "💖", desc: "Ваша связь крепнет с каждым днём!" },
      { days: 100, title: "100 дней вместе 💕", badge: "100 дней", icon: "💯", desc: "Первая сотня незабываемых моментов!" },
      { days: 200, title: "200 дней счастья ✨", badge: "200 дней", icon: "✨", desc: "Двойная сотня тёплых воспоминаний!" },
      { days: 300, title: "300 дней тепла ☀️", badge: "300 дней", icon: "☀️", desc: "Почти год безграничной любви!" },
      { days: 365, title: "1 Год вместе! 🎂", badge: "1 год", icon: "🎂", desc: "Сияющий юбилей — первый совместный год!" },
      { days: 500, title: "500 дней преданности 💎", badge: "500 дней", icon: "💎", desc: "Полтысячи дней нерушимого доверия!" },
      { days: 730, title: "2 Года любви! 👑", badge: "2 года", icon: "👑", desc: "Два прекрасных года нежности!" },
      { days: 1000, title: "1000 дней легенды! 🏆", badge: "1000 дней", icon: "🏆", desc: "Легендарная пара, вдохновляющая весь мир!" }
    ],

    // Empty accessories array for safe backward compatibility
    accessories: []
  };

  window.getPetById = function (petId) {
    const pets = window.CHIBI_CONFIG.pets;
    return pets.find((p) => p.id === petId) || pets[0];
  };

  window.normalizeAvatar = function (raw = {}) {
    const pets = window.CHIBI_CONFIG.pets;
    let species = raw.species;
    if (!species || !pets.some((p) => p.id === species)) {
      species = raw.gender === "boy" ? "puppy" : "kitty_bear";
    }
    const petMeta = window.getPetById(species);
    const name = (raw.name && raw.name.trim()) || petMeta.name;
    const bgColor = raw.bgColor || "pink";
    return {
      species,
      name,
      bgColor,
      gender: raw.gender || (species === "puppy" ? "boy" : "girl")
    };
  };

  window.randomizeAvatar = function () {
    const pets = window.CHIBI_CONFIG.pets;
    const p = pets[Math.floor(Math.random() * pets.length)];
    const cuteNames = [
      "Зефирка", "Пончик", "Лучик", "Пушок", "Лапушка", "Булочка",
      "Снежок", "Персик", "Ириска", "Кексик", "Мурзик", "Винни"
    ];
    const name = cuteNames[Math.floor(Math.random() * cuteNames.length)];
    return {
      species: p.id,
      name,
      bgColor: p.color === "#FBBF24" ? "yellow" : "pink",
      gender: p.id === "puppy" ? "boy" : "girl"
    };
  };

  // Robust Russian pluralization helper
  window.pluralRu = function (n, one, two, five) {
    const abs = Math.abs(parseInt(n, 10)) || 0;
    const n10 = abs % 10;
    const n100 = abs % 100;
    if (n10 === 1 && n100 !== 11) return `${abs} ${one}`;
    if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return `${abs} ${two}`;
    return `${abs} ${five}`;
  };

  // Mood & Reaction metadata helpers with legacy alias fallback
  window.getMoodMeta = function (moodId) {
    const moods = (window.CHIBI_CONFIG && window.CHIBI_CONFIG.moods) || [];
    const aliasMap = {
      happy: "joyful",
      in_love: "loving",
      sleepy: "tired",
      missing: "sad",
      playful: "excited"
    };
    const targetId = aliasMap[moodId] || moodId;
    return moods.find((m) => m.id === targetId) || moods[0];
  };

  window.getMoodTagMeta = function (tagId) {
    const tags = (window.CHIBI_CONFIG && window.CHIBI_CONFIG.moodTags) || [];
    return tags.find((t) => t.id === tagId) || null;
  };

  window.getReactionMeta = function (reactionId) {
    const rx = (window.CHIBI_CONFIG && window.CHIBI_CONFIG.moodReactions) || [];
    return rx.find((r) => r.id === reactionId) || rx[0];
  };

  // Human-readable relative timestamp in Russian
  window.formatRelativeTimeRu = function (timestampSec) {
    if (!timestampSec) return "";
    const nowSec = Date.now() / 1000;
    const diff = Math.max(0, Math.floor(nowSec - timestampSec));
    if (diff < 60) return "только что";
    if (diff < 3600) return `${Math.floor(diff / 60)} мин. назад`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ч. назад`;
    const d = new Date(timestampSec * 1000);
    return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")} в ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  // ==========================================================================
  // EXACT CALENDAR MATH ENGINE (Years, Months, Days, Hours, Minutes, Seconds)
  // Handles leap years, differing month lengths, timezones and future countdowns
  // ==========================================================================
  window.isLeapYear = function (year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  };

  window.daysInMonth = function (year, month1) {
    if (month1 === 2) return window.isLeapYear(year) ? 29 : 28;
    if (month1 === 4 || month1 === 6 || month1 === 9 || month1 === 11) return 30;
    return 31;
  };

  window.addMonthsClamped = function (d, months) {
    const totalMonths = d.getFullYear() * 12 + d.getMonth() + months;
    const targetYear = Math.floor(totalMonths / 12);
    const targetMonth = totalMonths % 12; // 0..11
    const maxD = window.daysInMonth(targetYear, targetMonth + 1);
    const day = Math.min(d.getDate(), maxD);
    const res = new Date(d.getTime());
    res.setFullYear(targetYear, targetMonth, day);
    return res;
  };

  window.calculateRelationshipTime = function (anniversaryVal, targetDate) {
    const end = targetDate ? new Date(targetDate) : new Date();
    let start;

    if (typeof anniversaryVal === "number") {
      start = new Date(anniversaryVal * 1000);
    } else if (typeof anniversaryVal === "string" && anniversaryVal.trim()) {
      const val = anniversaryVal.trim();
      if (val.indexOf("T") !== -1) {
        start = new Date(val);
      } else if (val.indexOf("-") !== -1) {
        const parts = val.split("-");
        start = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      } else {
        const num = parseFloat(val);
        start = !isNaN(num) ? new Date(num * 1000) : new Date(end.getTime());
      }
    } else {
      start = new Date(end.getTime());
    }

    if (isNaN(start.getTime())) {
      start = new Date(end.getTime());
    }

    const isFuture = end.getTime() < start.getTime();
    const t0 = isFuture ? end : start;
    const t1 = isFuture ? start : end;

    // 1. Calculate full years using month-clamped advancement
    let y = t1.getFullYear() - t0.getFullYear();
    let p = window.addMonthsClamped(t0, y * 12);
    if (p > t1) {
      y--;
      p = window.addMonthsClamped(t0, y * 12);
    }

    // 2. Calculate full months
    let m = 0;
    while (true) {
      const nextP = window.addMonthsClamped(p, 1);
      if (nextP <= t1) {
        m++;
        p = nextP;
      } else {
        break;
      }
    }

    // 3. Remaining days, hours, minutes, seconds
    let remMs = t1.getTime() - p.getTime();
    let remSecs = Math.max(0, Math.floor(remMs / 1000));
    const d = Math.floor(remSecs / 86400);
    remSecs %= 86400;
    const h = Math.floor(remSecs / 3600);
    remSecs %= 3600;
    const min = Math.floor(remSecs / 60);
    const s = remSecs % 60;

    const totalMs = Math.max(0, t1.getTime() - t0.getTime());
    const totalDays = Math.max(1, Math.floor(totalMs / 86400000) + (isFuture ? 0 : 1));
    const totalHours = Math.floor(totalMs / 3600000);

    // Milestones progress
    const milestones = (window.CHIBI_CONFIG && window.CHIBI_CONFIG.milestones) || [];
    const milestoneResults = [];
    let nextMilestone = null;
    let prevDays = 0;

    for (let i = 0; i < milestones.length; i++) {
      const item = milestones[i];
      const completed = totalDays >= item.days;
      const resItem = {
        days: item.days,
        title: item.title,
        badge: item.badge,
        icon: item.icon,
        desc: item.desc,
        completed: completed,
        daysLeft: Math.max(0, item.days - totalDays)
      };
      milestoneResults.push(resItem);

      if (!completed && !nextMilestone) {
        const span = Math.max(1, item.days - prevDays);
        const elapsedInSpan = Math.max(0, totalDays - prevDays);
        resItem.progressPct = Math.min(100.0, Math.round((elapsedInSpan / span) * 1000) / 10);
        nextMilestone = resItem;
      }
      if (completed) {
        prevDays = item.days;
      }
    }

    if (!nextMilestone) {
      nextMilestone = {
        days: 1000,
        title: "Легендарная любовь! 👑",
        badge: "1000+ дней",
        icon: "👑",
        desc: "Вы прошли все рубежи легендарной пары!",
        completed: true,
        daysLeft: 0,
        progressPct: 100.0
      };
    }

    const startISO = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
    const startFormatted = `${String(start.getDate()).padStart(2, "0")}.${String(start.getMonth() + 1).padStart(2, "0")}.${start.getFullYear()}`;

    return {
      years: Math.max(0, y),
      months: Math.max(0, m),
      days: Math.max(0, d),
      hours: Math.max(0, h),
      minutes: Math.max(0, min),
      seconds: Math.max(0, s),
      totalDays: totalDays,
      totalHours: totalHours,
      isFuture: isFuture,
      startDate: start,
      anniversaryISO: startISO,
      anniversaryFormatted: startFormatted,
      nextMilestone: nextMilestone,
      milestones: milestoneResults
    };
  };
})();
