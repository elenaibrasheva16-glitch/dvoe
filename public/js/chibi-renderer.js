// ============================================================================
// ChibiLove (ЧибиПара) — Layered Anime Chibi SVG Renderer & Couple Poses Engine
// Supports Boy/Girl gender anatomy & outfits, 4-stage care visuals, 14 accessories,
// 4 couple poses, 5 moods, and 8 pastel themes (including Rainbow pattern)
// ============================================================================

window.CHIBI_CONFIG = {
  genders: [
    { id: "boy", icon: "👦", name: "Мальчик" },
    { id: "girl", icon: "👧", name: "Девочка" },
  ],
  skinColors: [
    { id: "#FFF0E6", name: "Фарфоровый" },
    { id: "#FFE5D9", name: "Персиковый" },
    { id: "#FFD6BA", name: "Бежевый" },
    { id: "#F3C6A5", name: "Золотистый" },
    { id: "#E0AC8B", name: "Карамельный" },
    { id: "#C68B69", name: "Смуглый" },
  ],
  eyeStyles: [
    { id: "sparkle", name: "Сияющие ✨" },
    { id: "anime", name: "Классика 🌸" },
    { id: "starry", name: "Звёздочки ⭐" },
    { id: "heart", name: "Сердечки 💕" },
    { id: "soft", name: "Мягкий взгляд 🌙" },
  ],
  eyeColors: [
    { id: "#2B3A55", name: "Ночной синий" },
    { id: "#4A6FA5", name: "Сапфировый" },
    { id: "#3B7A57", name: "Изумрудный" },
    { id: "#6B4E3D", name: "Карий" },
    { id: "#8B5CF6", name: "Фиалковый" },
    { id: "#EC4899", name: "Розовый" },
    { id: "#D97706", name: "Янтарный" },
    { id: "#E11D48", name: "Рубиновый" },
  ],
  hairStyles: [
    { id: "fluffy_boy", name: "Аниме-укладка", gender: "boy" },
    { id: "parted_boy", name: "Стильный пробор", gender: "boy" },
    { id: "messy_curly", name: "Кудрявое облачко", gender: "any" },
    { id: "long_hime", name: "Длинные с чёлкой", gender: "girl" },
    { id: "twin_tails", name: "Два хвостика", gender: "girl" },
    { id: "bob_cute", name: "Пышное каре", gender: "any" },
    { id: "high_ponytail", name: "Высокий хвост", gender: "girl" },
  ],
  hairColors: [
    { id: "#1E1E24", name: "Чёрный" },
    { id: "#3D2B1F", name: "Каштановый" },
    { id: "#7C4D3A", name: "Шоколадный" },
    { id: "#F3D19E", name: "Блонд" },
    { id: "#F9A8D4", name: "Розовый" },
    { id: "#C084FC", name: "Лавандовый" },
    { id: "#93C5FD", name: "Голубой" },
    { id: "#991B1B", name: "Вишнёвый" },
    { id: "#E2E8F0", name: "Серебристый" },
  ],
  outfitStyles: [
    { id: "hoodie_cozy", name: "Оверсайз-худи", gender: "any" },
    { id: "street_jacket", name: "Бомбер и брюки", gender: "boy" },
    { id: "boy_shirt_vest", name: "Рубашка и жилет", gender: "boy" },
    { id: "pleated_dress", name: "Платье со складками", gender: "girl" },
    { id: "school_seifuku", name: "Школьная форма", gender: "girl" },
    { id: "overalls_cute", name: "Комбинезон", gender: "any" },
    { id: "sweater_heart", name: "Вязаный свитер", gender: "any" },
    { id: "pajama_soft", name: "Мягкая пижама", gender: "any" },
  ],
  outfitColors: [
    { id: "#2B4570", name: "Индиго" },
    { id: "#374151", name: "Графит" },
    { id: "#F472B6", name: "Розовый" },
    { id: "#8B5CF6", name: "Фиолетовый" },
    { id: "#34D399", name: "Мятный" },
    { id: "#60A5FA", name: "Голубой" },
    { id: "#FBBF24", name: "Персиковый" },
    { id: "#EF4444", name: "Клубничный" },
  ],
  blushStyles: [
    { id: "soft", name: "Лёгкий //" },
    { id: "hearts", name: "Сердечки 💕" },
    { id: "anime_glow", name: "Румянец 🌸" },
    { id: "none", name: "Без румянца" },
  ],
  moods: [
    { id: "happy", emoji: "😊", label: "Весёлый", color: "#10B981", bg: "#D1FAE5" },
    { id: "sad", emoji: "😢", label: "Грустный", color: "#3B82F6", bg: "#DBEAFE" },
    { id: "angry", emoji: "😠", label: "Злой", color: "#EF4444", bg: "#FEE2E2" },
    { id: "offended", emoji: "😣", label: "Обиделся", color: "#F59E0B", bg: "#FEF3C7" },
    { id: "missing", emoji: "🥺", label: "Скучает", color: "#EC4899", bg: "#FCE7F3" },
  ],
  poses: [
    { id: "hug", icon: "🫂", label: "Объятия" },
    { id: "hold_hands", icon: "🤝", label: "За ручки" },
    { id: "pat_a_to_b", icon: "🤚💕", label: "Гладишь партнёра" },
    { id: "pat_b_to_a", icon: "💞🤚", label: "Партнёр гладит тебя" },
  ],
  // Short names without "Нежно-" + 8th "Радужный" soft pattern!
  pastelThemes: [
    {
      id: "pink",
      name: "Розовый",
      bg: "linear-gradient(180deg, #FFE4EC 0%, #FFF0F5 55%, #FFD9E6 100%)",
      dot: "#FFB3C6",
    },
    {
      id: "green",
      name: "Зелёный",
      bg: "linear-gradient(180deg, #DFF7E8 0%, #F0FDF4 55%, #C8F0D8 100%)",
      dot: "#86EFAC",
    },
    {
      id: "blue",
      name: "Голубой",
      bg: "linear-gradient(180deg, #E0F2FE 0%, #F0F9FF 55%, #BAE6FD 100%)",
      dot: "#7DD3FC",
    },
    {
      id: "yellow",
      name: "Жёлтый",
      bg: "linear-gradient(180deg, #FEF9C3 0%, #FEFCE8 55%, #FDE68A 100%)",
      dot: "#FDE047",
    },
    {
      id: "lime",
      name: "Салатовый",
      bg: "linear-gradient(180deg, #ECFCCB 0%, #F7FEE7 55%, #D9F99D 100%)",
      dot: "#BEF264",
    },
    {
      id: "purple",
      name: "Фиолетовый",
      bg: "linear-gradient(180deg, #F3E8FF 0%, #FAF5FF 55%, #E9D5FF 100%)",
      dot: "#D8B4FE",
    },
    {
      id: "orange",
      name: "Оранжевый",
      bg: "linear-gradient(180deg, #FFEDD5 0%, #FFF7ED 55%, #FED7AA 100%)",
      dot: "#FDBA74",
    },
    {
      id: "rainbow",
      name: "Радужный",
      bg: [
        "radial-gradient(circle at 18% 18%, rgba(255, 209, 224, 0.72) 0%, transparent 45%)",
        "radial-gradient(circle at 82% 22%, rgba(254, 240, 180, 0.72) 0%, transparent 46%)",
        "radial-gradient(circle at 22% 78%, rgba(196, 245, 222, 0.72) 0%, transparent 48%)",
        "radial-gradient(circle at 82% 76%, rgba(219, 212, 255, 0.75) 0%, transparent 48%)",
        "repeating-linear-gradient(135deg, rgba(255,255,255,0.26) 0px, rgba(255,255,255,0.26) 18px, rgba(255,255,255,0.04) 18px, rgba(255,255,255,0.04) 36px)",
        "linear-gradient(135deg, #FFE4EC 0%, #FFEDD5 20%, #FEF9C3 40%, #DFF7E8 60%, #E0F2FE 80%, #F3E8FF 100%)"
      ].join(", "),
      dot: "linear-gradient(135deg, #FDA4AF, #FDE047, #86EFAC, #93C5FD, #D8B4FE)",
    },
  ],
  // 4 free accessories (Ушки, Очки, Шарф, Бантик) + 10 paid accessories (total = 1000 Hearts = 100 Stars)
  accessories: [
    { id: "cat_ears", icon: "🐱", name: "Ушки", price: 0 },
    { id: "glasses_cool", icon: "🕶️", name: "Очки", price: 0 },
    { id: "cozy_scarf", icon: "🧣", name: "Шарф", price: 0 },
    { id: "head_bow", icon: "🎀", name: "Бантик", price: 0 },
    { id: "cheek_plaster", icon: "🩹", name: "Пластырь", price: 80 },
    { id: "sprout_leaf", icon: "🌱", name: "Росточек", price: 80 },
    { id: "cat_tail", icon: "🐈", name: "Хвостик", price: 80 },
    { id: "bunny_ears", icon: "🐰", name: "Ушки зайки", price: 80 },
    { id: "headphones", icon: "🎧", name: "Наушники", price: 100 },
    { id: "devil_horns", icon: "😈", name: "Рожки", price: 100 },
    { id: "angel_halo", icon: "😇", name: "Нимб", price: 120 },
    { id: "royal_crown", icon: "👑", name: "Корона", price: 120 },
    { id: "plush_bear", icon: "🧸", name: "Мишка", price: 120 },
    { id: "fairy_wings", icon: "🦋", name: "Крылышки", price: 120 },
  ],
};

function shadeColor(hex, percent) {
  if (!hex || hex[0] !== "#") return hex || "#333333";
  let num = parseInt(hex.slice(1), 16);
  let r = (num >> 16) + percent;
  let g = ((num >> 8) & 0x00ff) + percent;
  let b = (num & 0x0000ff) + percent;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return "#" + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function buildChibiLayers(avatar = {}, options = {}) {
  const gender = avatar.gender === "girl" ? "girl" : "boy";
  const skin = avatar.skinColor || "#FFE5D9";
  const skinShadow = shadeColor(skin, -18);
  const eyeStyle = avatar.eyeStyle || "sparkle";
  const eyeColor = avatar.eyeColor || "#4A6FA5";
  const eyeDark = shadeColor(eyeColor, -45);
  const hairStyle = avatar.hairStyle || (gender === "girl" ? "long_hime" : "fluffy_boy");
  const hairColor = avatar.hairColor || "#1E1E24";
  const hairHighlight = shadeColor(hairColor, 42);
  const outfitStyle = avatar.outfitStyle || (gender === "girl" ? "pleated_dress" : "hoodie_cozy");
  const outfitColor = avatar.outfitColor || "#2B4570";
  const outfitDark = shadeColor(outfitColor, -35);
  const blushStyle = avatar.blushStyle || "soft";

  const accessories = new Set(options.accessories || []);
  const care = options.care || { hungerStage: 4, cleanStage: 4, energyStage: 4, isSleeping: false };
  const mood = options.mood || null;
  const armPose = options.armPose || "normal";
  const uid = options.uid || ("chibi_" + Math.random().toString(36).slice(2, 7));

  const hStage = care.hungerStage || 4;
  const cStage = care.cleanStage || 4;
  const eStage = care.energyStage || 4;

  const isHungry = hStage <= 2;
  const isVeryHungry = hStage === 1;
  const isDirty = cStage <= 2;
  const isVeryDirty = cStage === 1;
  const isTired = eStage <= 2;
  const isSleeping = Boolean(care.isSleeping);

  // Automatic facial expression from sleeping / mood / care stage
  let expression = "happy";
  if (isSleeping) {
    expression = "sleeping";
  } else if (mood) {
    expression = mood;
  } else if (isHungry && isTired) {
    expression = "exhausted";
  } else if (isHungry) {
    expression = "hungry";
  } else if (isTired) {
    expression = "tired";
  } else if (isDirty) {
    expression = "dirty";
  }

  // 1. BACK ACCESSORIES
  let backAccSVG = "";
  if (accessories.has("fairy_wings")) {
    backAccSVG += `
      <g class="acc-wings">
        <path d="M98,185 C42,140 28,195 72,218 C48,232 62,262 102,232 Z" fill="rgba(255,255,255,0.8)" stroke="#C084FC" stroke-width="2.5"/>
        <path d="M162,185 C218,140 232,195 188,218 C212,232 198,262 158,232 Z" fill="rgba(255,255,255,0.8)" stroke="#C084FC" stroke-width="2.5"/>
      </g>
    `;
  }
  if (accessories.has("cat_tail")) {
    backAccSVG += `
      <g class="acc-tail">
        <path d="M148,242 C188,256 232,232 226,192 C222,168 194,172 196,196 C198,215 178,228 150,226 Z"
              fill="#7F1D1D" stroke="#1E1E24" stroke-width="3" stroke-linejoin="round"/>
        <path d="M182,238 Q192,226 184,218" fill="none" stroke="#450A0A" stroke-width="4" stroke-linecap="round"/>
        <path d="M204,225 Q216,214 202,205" fill="none" stroke="#450A0A" stroke-width="4" stroke-linecap="round"/>
        <path d="M214,202 Q224,190 206,186" fill="none" stroke="#450A0A" stroke-width="4" stroke-linecap="round"/>
      </g>
    `;
  }

  // 2. BACK HAIR LAYER
  let backHairSVG = "";
  if (hairStyle === "long_hime") {
    backHairSVG = `
      <path d="M62,110 C48,165 52,228 66,255 C82,262 102,258 108,248 L152,248 C158,258 178,262 194,255 C208,228 212,165 198,110 Z"
            fill="${hairColor}" stroke="#1A1A1A" stroke-width="3.2" stroke-linejoin="round"/>
    `;
  } else if (hairStyle === "twin_tails") {
    backHairSVG = `
      <path d="M65,108 C30,122 24,195 42,238 C54,242 68,228 70,192 Z" fill="${hairColor}" stroke="#1A1A1A" stroke-width="3.2" stroke-linejoin="round"/>
      <path d="M195,108 C230,122 236,195 218,238 C206,242 192,228 190,192 Z" fill="${hairColor}" stroke="#1A1A1A" stroke-width="3.2" stroke-linejoin="round"/>
    `;
  } else if (hairStyle === "high_ponytail") {
    backHairSVG = `
      <path d="M155,62 C202,48 228,110 210,168 C196,162 188,135 175,98 Z" fill="${hairColor}" stroke="#1A1A1A" stroke-width="3.2" stroke-linejoin="round"/>
    `;
  } else if (hairStyle === "bob_cute") {
    backHairSVG = `
      <path d="M58,112 C50,152 60,186 78,194 L182,194 C200,186 210,152 202,112 Z" fill="${hairColor}" stroke="#1A1A1A" stroke-width="3.2" stroke-linejoin="round"/>
    `;
  }

  // 3. CHIBI ARMS
  let leftArmPath = "M104,185 C88,196 76,216 72,228 C70,234 78,238 84,233 C92,224 100,210 106,202";
  let rightArmPath = "M156,185 C172,196 184,216 188,228 C190,234 182,238 176,233 C168,224 160,210 154,202";

  if (armPose === "open_hug") {
    leftArmPath = "M104,184 C82,186 64,192 54,196 C48,199 52,208 60,206 C74,203 92,198 105,196";
    rightArmPath = "M156,184 C178,186 196,192 206,196 C212,199 208,208 200,206 C186,203 168,198 155,196";
  } else if (armPose === "excited" || isHungry) {
    leftArmPath = "M104,186 C86,192 84,218 96,220 C106,220 112,202 108,192";
    rightArmPath = "M156,186 C174,192 176,218 164,220 C154,220 148,202 152,192";
  } else if (armPose === "hold_right") {
    rightArmPath = "M156,185 C176,194 194,208 206,214 C212,216 208,225 200,222 C186,216 168,206 154,198";
  } else if (armPose === "hold_left") {
    leftArmPath = "M104,185 C84,194 66,208 54,214 C48,216 52,225 60,222 C74,216 92,206 106,198";
  } else if (armPose === "pat_right") {
    rightArmPath = "M156,184 C185,165 215,125 236,105 C242,100 248,108 240,116 C220,136 190,174 156,195";
  } else if (armPose === "pat_left") {
    leftArmPath = "M104,184 C75,165 45,125 24,105 C18,100 12,108 20,116 C40,136 70,174 104,195";
  }

  // 4. CHIBI BODY, LEGS & GENDER-SPECIFIC FOOTWEAR
  const legWearSVG = gender === "girl"
    ? `
      <!-- Girl White Stockings & Cute Boots -->
      <path d="M99,256 L125,256 L124,290 L108,290 C102,288 100,275 99,256 Z" fill="#F8FAFC" stroke="#1E1E24" stroke-width="2.4"/>
      <path d="M135,256 L161,256 L160,275 C159,286 155,289 148,290 L136,290 Z" fill="#F8FAFC" stroke="#1E1E24" stroke-width="2.4"/>
      <path d="M101,273 L125,273 L124,291 L108,291 C103,290 101,283 101,273 Z" fill="#1E293B" stroke="#0F172A" stroke-width="2.4"/>
      <path d="M135,273 L159,273 C159,283 157,290 152,291 L136,291 Z" fill="#1E293B" stroke="#0F172A" stroke-width="2.4"/>
    `
    : `
      <!-- Boy Pants/Trousers & Sneakers -->
      <path d="M98,242 L162,242 L160,276 L135,276 L130,254 L125,276 L100,276 Z" fill="#1E293B" stroke="#1E1E24" stroke-width="2.5"/>
      <path d="M100,275 L125,275 L124,291 L106,291 C101,290 100,283 100,275 Z" fill="#F8FAFC" stroke="#1E1E24" stroke-width="2.4"/>
      <path d="M135,275 L160,275 C160,283 159,290 154,291 L136,291 Z" fill="#F8FAFC" stroke="#1E1E24" stroke-width="2.4"/>
      <line x1="101" y1="286" x2="124" y2="286" stroke="${outfitColor}" stroke-width="3"/>
      <line x1="136" y1="286" x2="159" y2="286" stroke="${outfitColor}" stroke-width="3"/>
    `;

  const bodyAndLegsSVG = `
    <g class="chibi-body">
      <path d="M121,166 L121,180 L139,180 L139,166 Z" fill="${skin}" stroke="#1E1E24" stroke-width="2.8" stroke-linejoin="round"/>
      <path d="${leftArmPath}" fill="${skin}" stroke="#1E1E24" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${rightArmPath}" fill="${skin}" stroke="#1E1E24" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M106,178 C98,202 95,232 98,262 C100,278 104,288 112,290 L124,290 C126,274 126,256 130,256 C134,256 134,274 136,290 L148,290 C156,288 160,278 162,262 C165,232 162,202 154,178 Z"
            fill="${skin}" stroke="#1E1E24" stroke-width="2.8" stroke-linejoin="round"/>
      ${legWearSVG}
    </g>
  `;

  // 5. OUTFIT LAYER
  let outfitSVG = "";
  if (outfitStyle === "pleated_dress") {
    outfitSVG = `
      <g class="chibi-outfit">
        <path d="M84,254 Q96,263 108,255 Q120,263 130,255 Q140,263 152,255 Q164,263 176,254 L170,244 L90,244 Z" fill="#F1F5F9" stroke="#1E1E24" stroke-width="2.2"/>
        <path d="M96,225 L164,225 C174,236 180,246 178,252 C164,258 148,256 130,256 C112,256 96,258 82,252 C80,246 86,236 96,225 Z"
              fill="${outfitColor}" stroke="#1E1E24" stroke-width="2.8" stroke-linejoin="round"/>
        <line x1="112" y1="227" x2="104" y2="253" stroke="${outfitDark}" stroke-width="2"/>
        <line x1="130" y1="227" x2="130" y2="254" stroke="${outfitDark}" stroke-width="2"/>
        <line x1="148" y1="227" x2="156" y2="253" stroke="${outfitDark}" stroke-width="2"/>
        <path d="M104,179 L156,179 L163,227 L97,227 Z" fill="${outfitColor}" stroke="#1E1E24" stroke-width="2.8" stroke-linejoin="round"/>
        <path d="M114,178 L130,194 L146,178" fill="none" stroke="#1E1E24" stroke-width="2.6" stroke-linejoin="round"/>
        <line x1="130" y1="194" x2="130" y2="227" stroke="#1E1E24" stroke-width="2.2"/>
      </g>
    `;
  } else if (outfitStyle === "hoodie_cozy") {
    outfitSVG = `
      <g class="chibi-outfit">
        <path d="M98,236 L162,236 L161,260 L135,260 L130,250 L125,260 L99,260 Z" fill="#334155" stroke="#1E1E24" stroke-width="2.5"/>
        <path d="M98,179 C86,188 84,218 92,242 L168,242 C176,218 174,188 162,179 Z" fill="${outfitColor}" stroke="#1E1E24" stroke-width="2.8" stroke-linejoin="round"/>
        <path d="M108,218 L152,218 L156,236 L104,236 Z" fill="${outfitDark}" stroke="#1E1E24" stroke-width="2"/>
        <line x1="122" y1="184" x2="122" y2="205" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="138" y1="184" x2="138" y2="205" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
      </g>
    `;
  } else if (outfitStyle === "street_jacket") {
    outfitSVG = `
      <g class="chibi-outfit">
        <path d="M100,179 L160,179 L162,238 L98,238 Z" fill="#F8FAFC" stroke="#1E1E24" stroke-width="2.5"/>
        <path d="M96,179 L118,179 L116,240 L90,238 C86,215 88,190 96,179 Z" fill="${outfitColor}" stroke="#1E1E24" stroke-width="2.6" stroke-linejoin="round"/>
        <path d="M164,179 L142,179 L144,240 L170,238 C174,215 172,190 164,179 Z" fill="${outfitColor}" stroke="#1E1E24" stroke-width="2.6" stroke-linejoin="round"/>
      </g>
    `;
  } else if (outfitStyle === "boy_shirt_vest") {
    outfitSVG = `
      <g class="chibi-outfit">
        <path d="M98,179 L162,179 L164,238 L96,238 Z" fill="#FFFFFF" stroke="#1E1E24" stroke-width="2.5"/>
        <path d="M102,180 L158,180 L162,238 L98,238 Z" fill="${outfitColor}" stroke="#1E1E24" stroke-width="2.6" stroke-linejoin="round"/>
        <polygon points="118,180 130,202 142,180" fill="#FFFFFF" stroke="#1E1E24" stroke-width="2"/>
        <polygon points="127,184 133,184 134,205 130,210 126,205" fill="#1E293B"/>
      </g>
    `;
  } else if (outfitStyle === "overalls_cute") {
    outfitSVG = `
      <g class="chibi-outfit">
        <path d="M100,179 L160,179 L164,224 L96,224 Z" fill="#FFFFFF" stroke="#1E1E24" stroke-width="2.6"/>
        <path d="M108,180 L116,180 L116,204 L144,204 L144,180 L152,180 L154,206 L162,206 L162,258 L135,258 L130,248 L125,258 L98,258 L98,206 L106,206 Z"
              fill="${outfitColor}" stroke="#1E1E24" stroke-width="2.6" stroke-linejoin="round"/>
        <path d="M130,226 C125,219 117,223 122,231 L130,238 L138,231 C143,223 135,219 130,226 Z" fill="#FB7185"/>
      </g>
    `;
  } else if (outfitStyle === "school_seifuku") {
    outfitSVG = `
      <g class="chibi-outfit">
        <path d="M92,226 L168,226 L176,253 L84,253 Z" fill="${outfitColor}" stroke="#1E1E24" stroke-width="2.6"/>
        <path d="M100,179 L160,179 L163,228 L97,228 Z" fill="#FFFFFF" stroke="#1E1E24" stroke-width="2.6"/>
        <path d="M104,179 L130,204 L156,179" fill="${outfitColor}" stroke="#1E1E24" stroke-width="2.4"/>
        <path d="M130,198 L118,210 L125,214 L130,204 L135,214 L142,210 Z" fill="#E11D48" stroke="#1E1E24" stroke-width="1.8"/>
      </g>
    `;
  } else if (outfitStyle === "pajama_soft") {
    outfitSVG = `
      <g class="chibi-outfit">
        <path d="M97,179 L163,179 L165,260 L135,260 L130,248 L125,260 L95,260 Z" fill="${outfitColor}" stroke="#1E1E24" stroke-width="2.6" stroke-linejoin="round"/>
        <circle cx="116" cy="204" r="4" fill="#FEF08A"/>
        <circle cx="145" cy="216" r="4.5" fill="#FEF08A"/>
        <circle cx="114" cy="238" r="4" fill="#FEF08A"/>
        <circle cx="144" cy="244" r="3.5" fill="#FEF08A"/>
      </g>
    `;
  } else {
    outfitSVG = `
      <g class="chibi-outfit">
        <path d="M95,232 L165,232 L168,255 L92,255 Z" fill="#1E293B" stroke="#1E1E24" stroke-width="2.5"/>
        <path d="M98,179 L162,179 L166,236 L94,236 Z" fill="${outfitColor}" stroke="#1E1E24" stroke-width="2.8" stroke-linejoin="round"/>
        <path d="M130,202 C123,193 112,199 119,210 L130,220 L141,210 C148,199 137,193 130,202 Z" fill="#FDE047" stroke="#1E1E24" stroke-width="2"/>
      </g>
    `;
  }

  // 6. NECK & HAND ACCESSORIES
  let midAccSVG = "";
  if (accessories.has("cozy_scarf")) {
    midAccSVG += `
      <g class="acc-scarf">
        <path d="M102,172 C118,182 142,182 158,172 C164,178 162,190 154,192 C136,196 124,196 106,192 C98,190 96,178 102,172 Z"
              fill="#E11D48" stroke="#1E1E24" stroke-width="2.6"/>
        <path d="M138,186 L146,222 L160,218 L152,184 Z" fill="#BE123C" stroke="#1E1E24" stroke-width="2.4"/>
      </g>
    `;
  }
  if (accessories.has("headphones")) {
    midAccSVG += `
      <g class="acc-earphones">
        <rect x="82" y="220" width="16" height="24" rx="4" transform="rotate(-15 90 232)" fill="#1E3A8A" stroke="#1E1E24" stroke-width="2.2"/>
        <path d="M72,140 C66,192 98,215 130,205 C162,215 194,192 188,140" fill="none" stroke="#60A5FA" stroke-width="2.6" stroke-linecap="round"/>
      </g>
    `;
  }
  if (accessories.has("plush_bear")) {
    midAccSVG += `
      <g class="acc-bear" transform="translate(68, 202)">
        <circle cx="10" cy="8" r="6" fill="#B45309" stroke="#1E1E24" stroke-width="2"/>
        <circle cx="28" cy="8" r="6" fill="#B45309" stroke="#1E1E24" stroke-width="2"/>
        <circle cx="19" cy="16" r="12" fill="#D97706" stroke="#1E1E24" stroke-width="2.2"/>
        <ellipse cx="19" cy="29" rx="11" ry="10" fill="#D97706" stroke="#1E1E24" stroke-width="2.2"/>
        <circle cx="15" cy="14" r="2" fill="#1E1E24"/>
        <circle cx="23" cy="14" r="2" fill="#1E1E24"/>
        <ellipse cx="19" cy="18" rx="4" ry="3" fill="#FEF3C7"/>
      </g>
    `;
  }

  // 7. HEAD & EARS
  const headBaseSVG = `
    <g class="chibi-head-base">
      <path d="M68,122 C50,118 48,146 66,150 C70,151 74,148 74,144" fill="${skin}" stroke="#1E1E24" stroke-width="2.8" stroke-linecap="round"/>
      <path d="M64,130 C57,130 57,142 65,143" fill="none" stroke="${skinShadow}" stroke-width="2" stroke-linecap="round"/>
      <path d="M192,122 C210,118 212,146 194,150 C190,151 186,148 186,144" fill="${skin}" stroke="#1E1E24" stroke-width="2.8" stroke-linecap="round"/>
      <path d="M196,130 C203,130 203,142 195,143" fill="none" stroke="${skinShadow}" stroke-width="2" stroke-linecap="round"/>
      <path d="M130,52 C78,52 64,86 66,126 C68,158 96,173 130,173 C164,173 192,158 194,126 C196,86 182,52 130,52 Z"
            fill="${skin}" stroke="#1E1E24" stroke-width="3" stroke-linejoin="round"/>
    </g>
  `;

  // 8. BLUSH
  let blushSVG = "";
  if (blushStyle === "soft" || expression === "offended" || expression === "missing") {
    blushSVG = `
      <g class="chibi-blush" opacity="0.85">
        <ellipse cx="86" cy="146" rx="11" ry="5.5" fill="#FDA4AF" opacity="0.55"/>
        <ellipse cx="174" cy="146" rx="11" ry="5.5" fill="#FDA4AF" opacity="0.55"/>
        <line x1="82" y1="148" x2="85" y2="143" stroke="#E11D48" stroke-width="1.8" stroke-linecap="round"/>
        <line x1="87" y1="149" x2="90" y2="144" stroke="#E11D48" stroke-width="1.8" stroke-linecap="round"/>
        <line x1="170" y1="149" x2="173" y2="144" stroke="#E11D48" stroke-width="1.8" stroke-linecap="round"/>
        <line x1="175" y1="148" x2="178" y2="143" stroke="#E11D48" stroke-width="1.8" stroke-linecap="round"/>
      </g>
    `;
  } else if (blushStyle === "hearts") {
    blushSVG = `
      <g class="chibi-blush">
        <path d="M85,145 C82,141 77,143 80,148 L85,152 L90,148 C93,143 88,141 85,145 Z" fill="#FB7185"/>
        <path d="M175,145 C172,141 167,143 170,148 L175,152 L180,148 C183,143 178,141 175,145 Z" fill="#FB7185"/>
      </g>
    `;
  } else if (blushStyle === "anime_glow") {
    blushSVG = `
      <g class="chibi-blush">
        <ellipse cx="86" cy="146" rx="13" ry="6.5" fill="#FB7185" opacity="0.5"/>
        <ellipse cx="174" cy="146" rx="13" ry="6.5" fill="#FB7185" opacity="0.5"/>
      </g>
    `;
  }

  // 9. EYES, EYELASHES (Boy vs Girl), BROWS & MOUTH
  let eyesAndFaceSVG = "";

  const renderOpenEyes = (optionsEye = {}) => {
    const isTeary = optionsEye.teary || false;
    const isHalfClosed = optionsEye.halfClosed || false;
    const browType = optionsEye.brows || "normal";

    let browSVG = gender === "boy"
      ? `
        <path d="M88,97 Q102,94 114,97" fill="none" stroke="#1E1E24" stroke-width="3.6" stroke-linecap="round"/>
        <path d="M172,97 Q158,94 146,97" fill="none" stroke="#1E1E24" stroke-width="3.6" stroke-linecap="round"/>
      `
      : `
        <path d="M104,97 L115,96" stroke="#1E1E24" stroke-width="3" stroke-linecap="round"/>
        <path d="M156,97 L145,96" stroke="#1E1E24" stroke-width="3" stroke-linecap="round"/>
      `;

    if (browType === "sad" || browType === "pleading") {
      browSVG = `
        <path d="M88,103 Q102,99 114,94" fill="none" stroke="#1E1E24" stroke-width="3.2" stroke-linecap="round"/>
        <path d="M172,103 Q158,99 146,94" fill="none" stroke="#1E1E24" stroke-width="3.2" stroke-linecap="round"/>
      `;
    } else if (browType === "angry") {
      browSVG = `
        <path d="M88,94 L115,103" fill="none" stroke="#1E1E24" stroke-width="3.6" stroke-linecap="round"/>
        <path d="M172,94 L145,103" fill="none" stroke="#1E1E24" stroke-width="3.6" stroke-linecap="round"/>
      `;
    }

    // Girl gets cute curved outer eyelashes!
    const girlWingLashes = gender === "girl"
      ? `
        <path d="M77,118 L70,113" stroke="#1E1E24" stroke-width="2.8" stroke-linecap="round"/>
        <path d="M76,124 L69,122" stroke="#1E1E24" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M183,118 L190,113" stroke="#1E1E24" stroke-width="2.8" stroke-linecap="round"/>
        <path d="M184,124 L191,122" stroke="#1E1E24" stroke-width="2.5" stroke-linecap="round"/>
      `
      : "";

    let innerCatchlight = "";
    if (eyeStyle === "starry") {
      innerCatchlight = `
        <polygon points="98,122 100,127 105,127 101,130 103,135 98,132 93,135 95,130 91,127 96,127" fill="#FEF08A"/>
        <polygon points="162,122 164,127 169,127 165,130 167,135 162,132 157,135 159,130 155,127 160,127" fill="#FEF08A"/>
      `;
    } else if (eyeStyle === "heart") {
      innerCatchlight = `
        <path d="M98,127 C95,122 89,125 93,131 L98,136 L103,131 C107,125 101,122 98,127 Z" fill="#FDA4AF"/>
        <path d="M162,127 C159,122 153,125 157,131 L162,136 L167,131 C171,125 165,122 162,127 Z" fill="#FDA4AF"/>
      `;
    }

    let eyelidCover = "";
    if (isHalfClosed) {
      eyelidCover = `
        <path d="M78,112 L118,112 L118,129 L78,129 Z" fill="${skin}"/>
        <line x1="79" y1="129" x2="117" y2="129" stroke="#1E1E24" stroke-width="3" stroke-linecap="round"/>
        <path d="M142,112 L182,112 L182,129 L142,129 Z" fill="${skin}"/>
        <line x1="143" y1="129" x2="181" y2="129" stroke="#1E1E24" stroke-width="3" stroke-linecap="round"/>
        <path d="M86,148 Q98,153 110,148" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round"/>
        <path d="M150,148 Q162,153 174,148" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round"/>
      `;
    }

    let tearsSVG = "";
    if (isTeary) {
      tearsSVG = `
        <circle cx="88" cy="142" r="4.5" fill="#60A5FA" opacity="0.9"/>
        <circle cx="172" cy="142" r="4.5" fill="#60A5FA" opacity="0.9"/>
        <path d="M84,144 Q82,156 86,158 Q90,156 88,144 Z" fill="#93C5FD"/>
      `;
    }

    return `
      <defs>
        <linearGradient id="eyeGrad_${uid}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${eyeDark}"/>
          <stop offset="55%" stop-color="${eyeColor}"/>
          <stop offset="100%" stop-color="${shadeColor(eyeColor, 40)}"/>
        </linearGradient>
      </defs>
      ${browSVG}
      <path d="M76,125 C78,104 114,104 118,122" fill="none" stroke="#1E1E24" stroke-width="5.2" stroke-linecap="round"/>
      <path d="M142,122 C146,104 182,104 184,125" fill="none" stroke="#1E1E24" stroke-width="5.2" stroke-linecap="round"/>
      ${girlWingLashes}
      <circle cx="98" cy="129" r="16" fill="#FFFFFF" stroke="#1E1E24" stroke-width="2.2"/>
      <circle cx="162" cy="129" r="16" fill="#FFFFFF" stroke="#1E1E24" stroke-width="2.2"/>
      <circle cx="98" cy="130" r="14.5" fill="url(#eyeGrad_${uid})" stroke="#1E1E24" stroke-width="2"/>
      <circle cx="162" cy="130" r="14.5" fill="url(#eyeGrad_${uid})" stroke="#1E1E24" stroke-width="2"/>
      <circle cx="98" cy="131" r="7" fill="${eyeDark}"/>
      <circle cx="162" cy="131" r="7" fill="${eyeDark}"/>
      <circle cx="92" cy="123" r="4.5" fill="#FFFFFF"/>
      <circle cx="104" cy="136" r="2.3" fill="#FFFFFF"/>
      <circle cx="156" cy="123" r="4.5" fill="#FFFFFF"/>
      <circle cx="168" cy="136" r="2.3" fill="#FFFFFF"/>
      ${innerCatchlight}
      ${eyelidCover}
      ${tearsSVG}
    `;
  };

  const noseDot = `<circle cx="130" cy="142" r="1.4" fill="#1E1E24"/>`;

  if (expression === "sleeping" || armPose === "being_patted") {
    const isBliss = armPose === "being_patted" && !isSleeping;
    eyesAndFaceSVG = `
      <path d="M108,97 L115,96" stroke="#1E1E24" stroke-width="3" stroke-linecap="round"/>
      <path d="M152,97 L145,96" stroke="#1E1E24" stroke-width="3" stroke-linecap="round"/>
      <path d="${isBliss ? 'M80,130 Q98,116 116,130' : 'M80,126 Q98,138 116,126'}" fill="none" stroke="#1E1E24" stroke-width="4" stroke-linecap="round"/>
      <path d="${isBliss ? 'M144,130 Q162,116 180,130' : 'M144,126 Q162,138 180,126'}" fill="none" stroke="#1E1E24" stroke-width="4" stroke-linecap="round"/>
      ${noseDot}
      <path d="${isBliss ? 'M122,152 Q130,159 138,152' : 'M126,153 Q130,156 134,153'}" fill="none" stroke="#1E1E24" stroke-width="2.4" stroke-linecap="round"/>
    `;
  } else if (expression === "sad") {
    eyesAndFaceSVG = `
      ${renderOpenEyes({ teary: true, brows: "sad" })}
      ${noseDot}
      <path d="M122,156 Q130,149 138,156" fill="none" stroke="#1E1E24" stroke-width="2.5" stroke-linecap="round"/>
    `;
  } else if (expression === "angry") {
    eyesAndFaceSVG = `
      ${renderOpenEyes({ brows: "angry" })}
      ${noseDot}
      <path d="M121,155 Q130,148 139,155" fill="none" stroke="#1E1E24" stroke-width="2.8" stroke-linecap="round"/>
      <g transform="translate(168, 72)" stroke="#EF4444" stroke-width="2.6" fill="none" stroke-linecap="round">
        <path d="M4,0 Q8,8 0,12"/><path d="M14,0 Q10,8 18,12"/>
        <path d="M0,16 Q8,12 4,22"/><path d="M18,16 Q10,12 14,22"/>
      </g>
    `;
  } else if (expression === "offended") {
    eyesAndFaceSVG = `
      ${renderOpenEyes({ brows: "angry", halfClosed: true })}
      ${noseDot}
      <path d="M123,154 Q128,150 135,155" fill="none" stroke="#1E1E24" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M135,150 Q142,154 135,158" fill="none" stroke="#1E1E24" stroke-width="2.2" stroke-linecap="round"/>
    `;
  } else if (expression === "missing" || expression === "hungry") {
    eyesAndFaceSVG = `
      ${renderOpenEyes({ teary: isVeryHungry || expression === "missing", brows: "pleading" })}
      ${noseDot}
      <path d="M121,154 Q125,150 130,154 Q135,150 139,154" fill="none" stroke="#1E1E24" stroke-width="2.4" stroke-linecap="round"/>
    `;
  } else if (expression === "tired" || expression === "exhausted") {
    eyesAndFaceSVG = `
      ${renderOpenEyes({ halfClosed: true, brows: "sad" })}
      ${noseDot}
      <ellipse cx="130" cy="154" rx="5.5" ry="6.5" fill="#F43F5E" stroke="#1E1E24" stroke-width="2.2"/>
    `;
  } else {
    const openHappy = armPose === "open_hug" || mood === "happy";
    const mouthSVG = openHappy
      ? `<path d="M121,149 C121,159 139,159 139,149 Z" fill="#FB7185" stroke="#1E1E24" stroke-width="2.2" stroke-linejoin="round"/>`
      : `<path d="M123,151 Q130,157 137,151" fill="none" stroke="#1E1E24" stroke-width="2.5" stroke-linecap="round"/>`;
    eyesAndFaceSVG = `
      ${renderOpenEyes({ brows: "normal" })}
      ${noseDot}
      ${mouthSVG}
    `;
  }

  // 10. AUTOMATIC CARE STAGE VISUAL EFFECTS
  let stateEffectsSVG = "";
  if (isDirty) {
    stateEffectsSVG += `
      <g class="state-dirty">
        <path d="M74,136 Q82,133 84,140 Q78,144 74,136 Z" fill="#78350F" opacity="0.52"/>
        ${isVeryDirty ? `
          <path d="M168,152 Q178,149 180,156 Q172,160 168,152 Z" fill="#78350F" opacity="0.55"/>
          <circle cx="118" cy="212" r="6" fill="#78350F" opacity="0.45"/>
          <circle cx="144" cy="236" r="5" fill="#78350F" opacity="0.45"/>
          <path d="M48,95 Q42,82 50,70" fill="none" stroke="#A16207" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="4 3"/>
          <path d="M212,102 Q218,88 210,76" fill="none" stroke="#A16207" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="4 3"/>
        ` : ""}
      </g>
    `;
  }
  if (isHungry && !isSleeping) {
    stateEffectsSVG += `
      <g class="state-hungry">
        <path d="M84,218 Q78,224 84,230" fill="none" stroke="#F97316" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M176,218 Q182,224 176,230" fill="none" stroke="#F97316" stroke-width="2.4" stroke-linecap="round"/>
      </g>
    `;
  }

  // 11. FRONT HAIR / BANGS LAYER
  let frontHairSVG = "";
  if (hairStyle === "long_hime" || hairStyle === "twin_tails" || hairStyle === "bob_cute" || hairStyle === "high_ponytail") {
    frontHairSVG = `
      <g class="chibi-hair-front">
        <path d="M66,96 C58,125 60,162 72,186 C78,176 78,145 76,116 Z" fill="${hairColor}" stroke="#1A1A1A" stroke-width="2.8" stroke-linejoin="round"/>
        <path d="M194,96 C202,125 200,162 188,186 C182,176 182,145 184,116 Z" fill="${hairColor}" stroke="#1A1A1A" stroke-width="2.8" stroke-linejoin="round"/>
        <path d="M64,104 C64,56 96,44 130,44 C164,44 196,56 196,104 C186,98 182,114 176,118 C170,102 164,118 156,120 C150,100 144,120 134,122 C130,104 124,122 114,120 C106,102 100,120 90,118 C84,104 76,116 64,104 Z"
              fill="${hairColor}" stroke="#1A1A1A" stroke-width="3" stroke-linejoin="round"/>
        <path d="M84,78 Q130,66 176,78" fill="none" stroke="${hairHighlight}" stroke-width="4.5" stroke-linecap="round" opacity="0.55"/>
      </g>
    `;
  } else if (hairStyle === "parted_boy") {
    frontHairSVG = `
      <g class="chibi-hair-front">
        <path d="M62,110 C56,60 90,42 130,42 C170,42 204,60 198,110 C190,92 174,108 158,114 C146,96 136,84 128,82 C122,94 106,114 86,116 C76,102 68,112 62,110 Z"
              fill="${hairColor}" stroke="#1A1A1A" stroke-width="3" stroke-linejoin="round"/>
        <path d="M88,72 Q130,62 172,72" fill="none" stroke="${hairHighlight}" stroke-width="4" stroke-linecap="round" opacity="0.5"/>
      </g>
    `;
  } else if (hairStyle === "fluffy_boy") {
    frontHairSVG = `
      <g class="chibi-hair-front">
        <path d="M62,108 C56,64 90,42 130,42 C170,42 204,64 198,108 C190,94 182,110 172,116 C164,96 152,114 140,120 C132,98 118,118 106,118 C96,98 84,114 74,112 Z"
              fill="${hairColor}" stroke="#1A1A1A" stroke-width="3" stroke-linejoin="round"/>
        <path d="M88,74 Q130,64 172,74" fill="none" stroke="${hairHighlight}" stroke-width="4" stroke-linecap="round" opacity="0.5"/>
      </g>
    `;
  } else {
    frontHairSVG = `
      <g class="chibi-hair-front">
        <path d="M62,106 C58,54 92,42 130,42 C168,42 202,54 198,106 C184,116 168,104 154,116 C140,102 120,102 106,116 C92,104 76,116 62,106 Z"
              fill="${hairColor}" stroke="#1A1A1A" stroke-width="3" stroke-linejoin="round"/>
        <path d="M86,76 Q130,66 174,76" fill="none" stroke="${hairHighlight}" stroke-width="4" stroke-linecap="round" opacity="0.5"/>
      </g>
    `;
  }

  // 12. FRONT ACCESSORIES
  let frontAccSVG = "";

  if (accessories.has("cheek_plaster")) {
    frontAccSVG += `
      <g class="acc-plaster">
        <rect x="121" y="135" width="18" height="7" rx="3" transform="rotate(-8 130 138)" fill="#FDE68A" stroke="#D97706" stroke-width="1.5"/>
        <line x1="127" y1="136" x2="127" y2="141" stroke="#D97706" stroke-width="1"/>
        <line x1="133" y1="136" x2="133" y2="141" stroke="#D97706" stroke-width="1"/>
      </g>
    `;
  }

  if (accessories.has("glasses_cool")) {
    frontAccSVG += `
      <g class="acc-glasses">
        <line x1="68" y1="124" x2="192" y2="124" stroke="#111827" stroke-width="3"/>
        <line x1="118" y1="128" x2="142" y2="128" stroke="#111827" stroke-width="3"/>
        <path d="M74,118 C74,114 120,114 120,122 C120,144 108,152 95,152 C80,152 72,140 74,118 Z"
              fill="rgba(17, 24, 39, 0.82)" stroke="#0F172A" stroke-width="3.2"/>
        <path d="M140,122 C140,114 186,114 186,118 C188,140 180,152 165,152 C152,152 140,144 140,122 Z"
              fill="rgba(17, 24, 39, 0.82)" stroke="#0F172A" stroke-width="3.2"/>
        <path d="M88,133 C86,130 82,132 85,136 L88,139 L91,136 C94,132 90,130 88,133 Z" fill="rgba(255,255,255,0.65)"/>
        <path d="M172,133 C170,130 166,132 169,136 L172,139 L175,136 C178,132 174,130 172,133 Z" fill="rgba(255,255,255,0.65)"/>
      </g>
    `;
  }

  if (accessories.has("cat_ears")) {
    frontAccSVG += `
      <g class="acc-cat-ears">
        <path d="M64,86 L52,36 L98,58 Z" fill="#7F1D1D" stroke="#1E1E24" stroke-width="3" stroke-linejoin="round"/>
        <path d="M67,79 L59,45 L90,60 Z" fill="#FDBA74"/>
        <path d="M196,86 L208,36 L162,58 Z" fill="#7F1D1D" stroke="#1E1E24" stroke-width="3" stroke-linejoin="round"/>
        <path d="M193,79 L201,45 L170,60 Z" fill="#FDBA74"/>
      </g>
    `;
  }

  if (accessories.has("bunny_ears")) {
    frontAccSVG += `
      <g class="acc-bunny-ears">
        <ellipse cx="95" cy="34" rx="13" ry="30" transform="rotate(-12 95 34)" fill="#FFFFFF" stroke="#1E1E24" stroke-width="2.8"/>
        <ellipse cx="95" cy="36" rx="7" ry="20" transform="rotate(-12 95 36)" fill="#F9A8D4"/>
        <ellipse cx="165" cy="34" rx="13" ry="30" transform="rotate(12 165 34)" fill="#FFFFFF" stroke="#1E1E24" stroke-width="2.8"/>
        <ellipse cx="165" cy="36" rx="7" ry="20" transform="rotate(12 165 36)" fill="#F9A8D4"/>
      </g>
    `;
  }

  if (accessories.has("devil_horns")) {
    frontAccSVG += `
      <g class="acc-devil-horns">
        <path d="M82,58 C72,34 86,24 96,48 Z" fill="#E11D48" stroke="#1E1E24" stroke-width="2.6" stroke-linejoin="round"/>
        <path d="M178,58 C188,34 174,24 164,48 Z" fill="#E11D48" stroke="#1E1E24" stroke-width="2.6" stroke-linejoin="round"/>
      </g>
    `;
  }

  if (accessories.has("head_bow")) {
    frontAccSVG += `
      <g class="acc-head-bow" transform="translate(130, 44)">
        <path d="M0,0 C-22,-18 -34,6 -8,10 Z" fill="#FB7185" stroke="#1E1E24" stroke-width="2.5"/>
        <path d="M0,0 C22,-18 34,6 8,10 Z" fill="#FB7185" stroke="#1E1E24" stroke-width="2.5"/>
        <circle cx="0" cy="2" r="6" fill="#E11D48" stroke="#1E1E24" stroke-width="2.2"/>
      </g>
    `;
  }

  if (accessories.has("sprout_leaf")) {
    frontAccSVG += `
      <g class="acc-sprout" transform="translate(130, 44)">
        <path d="M0,2 Q2,-14 0,-22" fill="none" stroke="#15803D" stroke-width="3" stroke-linecap="round"/>
        <path d="M0,-20 C-16,-28 -18,-10 0,-12 Z" fill="#4ADE80" stroke="#15803D" stroke-width="2"/>
        <path d="M0,-22 C16,-30 18,-12 0,-14 Z" fill="#22C55E" stroke="#15803D" stroke-width="2"/>
      </g>
    `;
  }

  if (accessories.has("angel_halo")) {
    frontAccSVG += `
      <g class="acc-halo">
        <ellipse cx="130" cy="24" rx="34" ry="8" fill="none" stroke="#FACC15" stroke-width="5"/>
        <ellipse cx="130" cy="24" rx="34" ry="8" fill="none" stroke="#FEF08A" stroke-width="2"/>
      </g>
    `;
  }

  if (accessories.has("royal_crown")) {
    frontAccSVG += `
      <g class="acc-crown" transform="translate(106, 18)">
        <polygon points="4,28 0,6 14,16 24,2 34,16 48,6 44,28" fill="#FACC15" stroke="#1E1E24" stroke-width="2.5" stroke-linejoin="round"/>
        <circle cx="24" cy="19" r="3.5" fill="#E11D48"/>
      </g>
    `;
  }

  // 13. SLEEPING BLANKET
  let blanketSVG = "";
  if (isSleeping && options.showBlanket) {
    blanketSVG = `
      <g class="sleep-blanket">
        <path d="M64,195 Q130,182 196,195 L204,296 L56,296 Z" fill="#C4B5FD" stroke="#1E1E24" stroke-width="3" stroke-linejoin="round"/>
        <path d="M64,195 Q130,182 196,195 L198,215 Q130,204 62,215 Z" fill="#F5F3FF" stroke="#1E1E24" stroke-width="2.6"/>
        <circle cx="96" cy="245" r="6" fill="#FEF08A"/>
        <circle cx="156" cy="258" r="7" fill="#FEF08A"/>
        <circle cx="124" cy="274" r="5" fill="#FEF08A"/>
        <text x="182" y="82" font-size="22" font-weight="800" fill="#6366F1" class="zzz-float">Zzz...</text>
      </g>
    `;
  }

  return `
    <ellipse cx="130" cy="292" rx="52" ry="11" fill="rgba(30, 30, 36, 0.14)"/>
    ${backAccSVG}
    ${backHairSVG}
    ${bodyAndLegsSVG}
    ${outfitSVG}
    ${midAccSVG}
    ${headBaseSVG}
    ${blushSVG}
    ${eyesAndFaceSVG}
    ${frontHairSVG}
    ${stateEffectsSVG}
    ${frontAccSVG}
    ${blanketSVG}
  `;
}

window.renderChibiSVG = function (avatar, options = {}) {
  const inner = buildChibiLayers(avatar, options);
  const animClass = options.isSleeping ? "chibi-sleep-breathe" : "chibi-idle-bounce";
  return `
    <svg viewBox="0 0 260 315" class="chibi-svg ${animClass}" xmlns="http://www.w3.org/2000/svg">
      ${inner}
    </svg>
  `;
};

window.renderCoupleSceneSVG = function (userObj, partnerObj, pose = "hug") {
  const avA = (userObj && userObj.avatar) || {};
  const avB = (partnerObj && partnerObj.avatar) || {};
  const accA = (userObj && userObj.partnerAccessories) || [];
  const accB = (partnerObj && partnerObj.partnerAccessories) || [];
  const moodA = (userObj && userObj.mood) || "happy";
  const moodB = (partnerObj && partnerObj.mood) || "happy";

  let armA = "normal";
  let armB = "normal";
  let txA = 35;
  let txB = 195;
  let rotA = 0;
  let rotB = 0;
  let interactionOverlay = "";

  if (pose === "hug") {
    armA = "open_hug";
    armB = "open_hug";
    txA = 56;
    txB = 174;
    rotA = 4;
    rotB = -4;
    interactionOverlay = `
      <g class="couple-heart-pop" transform="translate(245, 155)">
        <path d="M0,10 C-14,-8 -32,6 -14,24 L0,36 L14,24 C32,6 14,-8 0,10 Z" fill="#FB7185" stroke="#FFFFFF" stroke-width="3"/>
      </g>
    `;
  } else if (pose === "hold_hands") {
    armA = "hold_right";
    armB = "hold_left";
    txA = 42;
    txB = 188;
    interactionOverlay = `
      <g class="couple-heart-pop" transform="translate(245, 222)">
        <path d="M0,6 C-9,-5 -20,4 -9,15 L0,23 L9,15 C20,4 9,-5 0,6 Z" fill="#F43F5E" stroke="#FFFFFF" stroke-width="2.5"/>
      </g>
    `;
  } else if (pose === "pat_a_to_b") {
    armA = "pat_right";
    armB = "being_patted";
    txA = 46;
    txB = 182;
    const handSkinA = avA.skinColor || "#FFE5D9";
    interactionOverlay = `
      <g class="pat-hand-anim" transform="translate(292, 62)">
        <ellipse cx="0" cy="0" rx="14" ry="9" transform="rotate(-12)" fill="${handSkinA}" stroke="#1E1E24" stroke-width="2.8"/>
        <path d="M18,-14 C12,-22 4,-16 10,-9 L18,-3 L26,-9 C32,-16 24,-22 18,-14 Z" fill="#FB7185"/>
      </g>
    `;
  } else if (pose === "pat_b_to_a") {
    armA = "being_patted";
    armB = "pat_left";
    txA = 48;
    txB = 184;
    const handSkinB = avB.skinColor || "#FFE5D9";
    interactionOverlay = `
      <g class="pat-hand-anim" transform="translate(196, 62)">
        <ellipse cx="0" cy="0" rx="14" ry="9" transform="rotate(12)" fill="${handSkinB}" stroke="#1E1E24" stroke-width="2.8"/>
        <path d="M-18,-14 C-24,-22 -32,-16 -26,-9 L-18,-3 L-10,-9 C-4,-16 -12,-22 -18,-14 Z" fill="#FB7185"/>
      </g>
    `;
  }

  const layersA = buildChibiLayers(avA, {
    accessories: accA,
    mood: moodA,
    armPose: armA,
    uid: "couple_a",
  });

  const layersB = buildChibiLayers(avB, {
    accessories: accB,
    mood: moodB,
    armPose: armB,
    uid: "couple_b",
  });

  return `
    <svg viewBox="0 0 490 330" class="couple-svg" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="245" cy="296" rx="185" ry="26" fill="rgba(255, 255, 255, 0.65)" stroke="rgba(255, 255, 255, 0.95)" stroke-width="4"/>
      <g transform="translate(${txA}, 8) rotate(${rotA} 130 240)" class="chibi-idle-bounce">
        ${layersA}
      </g>
      <g transform="translate(${txB}, 8) rotate(${rotB} 130 240)" class="chibi-idle-bounce-delayed">
        ${layersB}
      </g>
      ${interactionOverlay}
    </svg>
  `;
};
