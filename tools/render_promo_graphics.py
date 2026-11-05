#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Promo Graphics Generator for «Двое» (Two)
Renders pixel-perfect, privacy-compliant promotional screenshots & banners:
- public/img/promo_screen_1.png (Main Screen: couple Maxim & Alina, live counter, mood status)
- public/img/promo_screen_2.png (Mood & Notes Modal: mood selection, explanation, quick reactions)
- public/img/promo_post_banner.jpg (1280x720 Telegram post banner)

Strictly uses fictional couple: Максим & Алина.
Zero personal data of the owner.
"""

import os
import re
from PIL import Image, ImageDraw, ImageFont, ImageFilter

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG_DIR = os.path.join(BASE_DIR, "public", "img")
os.makedirs(IMG_DIR, exist_ok=True)

FONT_REGULAR_PATH = "/System/Library/Fonts/Supplemental/Arial.ttf"
FONT_BOLD_PATH = "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if os.path.exists("/System/Library/Fonts/Supplemental/Arial Bold.ttf") else FONT_REGULAR_PATH
FONT_EMOJI_PATH = "/System/Library/Fonts/Apple Color Emoji.ttc"

def get_font(size: int, bold: bool = False):
    try:
        p = FONT_BOLD_PATH if bold else FONT_REGULAR_PATH
        return ImageFont.truetype(p, size)
    except Exception:
        return ImageFont.load_default()

def get_emoji_font(size: int = 40):
    valid_sizes = [20, 26, 32, 40, 48, 52, 64, 96, 160]
    best = min(valid_sizes, key=lambda x: abs(x - size))
    try:
        return ImageFont.truetype(FONT_EMOJI_PATH, best)
    except Exception:
        return None

EMOJI_PATTERN = re.compile(r'([\U00010000-\U0010ffff\u2600-\u27bf\u2300-\u23ff\u2b00-\u2bff]+[\ufe00-\ufe0f]?)')

def is_emoji_str(s: str) -> bool:
    if not s:
        return False
    cp = ord(s[0])
    return cp >= 0x2300

def measure_mixed_text(text: str, font, emoji_font) -> int:
    tokens = EMOJI_PATTERN.split(text)
    total_w = 0
    dummy = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    for token in tokens:
        if not token:
            continue
        if is_emoji_str(token):
            total_w += int(dummy.textlength(token, font=emoji_font)) + 6
        else:
            total_w += int(dummy.textlength(token, font=font))
    return total_w

def draw_mixed_text(draw, x, y, text, font, fill, emoji_font, align="left", max_w=None):
    if align == "center":
        w = measure_mixed_text(text, font, emoji_font)
        curr_x = x - w // 2
    elif align == "right":
        w = measure_mixed_text(text, font, emoji_font)
        curr_x = x - w
    else:
        curr_x = x

    tokens = EMOJI_PATTERN.split(text)
    for token in tokens:
        if not token:
            continue
        if is_emoji_str(token):
            draw.text((curr_x, y - 2), token, font=emoji_font, embedded_color=True)
            curr_x += int(draw.textlength(token, font=emoji_font)) + 6
        else:
            draw.text((curr_x, y), token, font=font, fill=fill)
            curr_x += int(draw.textlength(token, font=font))
    return curr_x

def draw_rounded_rect(draw, bbox, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(bbox, radius=radius, fill=fill, outline=outline, width=width)

def create_gradient(width, height, c1, c2, horizontal=False):
    base = Image.new("RGBA", (width, height), c1)
    top = Image.new("RGBA", (width, height), c2)
    mask = Image.new("L", (width, height))
    mask_data = []
    for y in range(height):
        for x in range(width):
            ratio = (x / width) if horizontal else (y / height)
            mask_data.append(int(ratio * 255))
    mask.putdata(mask_data)
    base.paste(top, (0, 0), mask)
    return base

def draw_avatar(img, center_x, center_y, size, name, initial, grad_c1, grad_c2):
    half = size // 2
    r_bbox = (center_x - half, center_y - half, center_x + half, center_y + half)
    avatar_grad = create_gradient(size, size, grad_c1, grad_c2)
    mask = Image.new("L", (size, size), 0)
    m_draw = ImageDraw.Draw(mask)
    m_draw.rounded_rectangle((0, 0, size, size), radius=size // 4, fill=255)
    
    img.paste(avatar_grad, (center_x - half, center_y - half), mask)
    
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle(r_bbox, radius=size // 4, outline=(255, 255, 255, 200), width=3)
    
    f_init = get_font(size // 2, bold=True)
    bb = f_init.getbbox(initial)
    tw, th = bb[2] - bb[0], bb[3] - bb[1]
    draw.text((center_x - tw // 2, center_y - th // 2 - 4), initial, fill=(255, 255, 255, 255), font=f_init)

def render_screen_1(out_path):
    W, H = 800, 1380
    img = create_gradient(W, H, (246, 248, 252, 255), (254, 245, 246, 255))
    draw = ImageDraw.Draw(img)

    f_stat = get_font(22, bold=True)
    f_em_stat = get_emoji_font(26)
    draw.text((45, 28), "14:30", fill=(28, 28, 30), font=f_stat)
    draw.text((700, 28), "100%", fill=(28, 28, 30), font=f_stat)

    # Header
    f_title = get_font(34, bold=True)
    f_em_title = get_emoji_font(32)
    draw_mixed_text(draw, 45, 80, "Двое 💕", f_title, (28, 28, 30), f_em_title)
    
    f_sub = get_font(20)
    draw.text((45, 125), "Приватное пространство для любящей пары", fill=(142, 142, 147), font=f_sub)

    # 1. Hero Couple Card
    c_card_y = 175
    c_card_h = 240
    draw_rounded_rect(draw, (40, c_card_y, W - 40, c_card_y + c_card_h), radius=28, fill=(255, 255, 255, 240), outline=(235, 238, 245), width=2)

    # Avatars: Maxim (left) & Alina (right)
    draw_avatar(img, 180, c_card_y + 90, 110, "Максим", "М", (100, 149, 237), (70, 130, 180))
    draw_avatar(img, W - 180, c_card_y + 90, 110, "Алина", "А", (255, 107, 129), (255, 160, 122))

    # Center heart connection badge
    draw_rounded_rect(draw, (W // 2 - 40, c_card_y + 60, W // 2 + 40, c_card_y + 120), radius=22, fill=(255, 240, 244), outline=(255, 107, 129, 140), width=2)
    f_em_heart = get_emoji_font(40)
    draw.text((W // 2 - 20, c_card_y + 70), "❤️", font=f_em_heart, embedded_color=True)

    # Names
    f_name = get_font(26, bold=True)
    draw.text((180 - draw.textlength("Максим", font=f_name) // 2, c_card_y + 160), "Максим", fill=(28, 28, 30), font=f_name)
    draw.text((W - 180 - draw.textlength("Алина", font=f_name) // 2, c_card_y + 160), "Алина", fill=(28, 28, 30), font=f_name)

    f_tag = get_font(18)
    draw.text((180 - draw.textlength("Вы", font=f_tag) // 2, c_card_y + 195), "Вы", fill=(142, 142, 147), font=f_tag)
    draw_mixed_text(draw, W - 180, c_card_y + 195, "Любимая 💕", f_tag, (255, 107, 129), f_em_stat, align="center")

    # 2. Live Relationship Counter Card
    cnt_y = 445
    cnt_h = 320
    draw_rounded_rect(draw, (40, cnt_y, W - 40, cnt_y + cnt_h), radius=28, fill=(255, 255, 255, 240), outline=(235, 238, 245), width=2)

    f_cnt_eyebrow = get_font(18, bold=True)
    draw.text((65, cnt_y + 24), "МЫ ВМЕСТЕ УЖЕ", fill=(255, 107, 129), font=f_cnt_eyebrow)

    f_cnt_date = get_font(19)
    draw.text((W - 65 - draw.textlength("с 24 июня 2025", font=f_cnt_date), cnt_y + 24), "с 24 июня 2025", fill=(142, 142, 147), font=f_cnt_date)

    # 6-box timer grid
    units = [
        ("1", "Год"),
        ("4", "Месяца"),
        ("12", "Дней"),
        ("08", "Часов"),
        ("24", "Минуты"),
        ("15", "Секунд"),
    ]
    box_w = 106
    box_h = 100
    gap = 14
    start_x = 40 + (W - 80 - (box_w * 6 + gap * 5)) // 2

    for i, (val, lbl) in enumerate(units):
        bx = start_x + i * (box_w + gap)
        by = cnt_y + 75
        is_sec = (i == 5)
        bg_col = (255, 242, 245) if is_sec else (248, 249, 252)
        border_col = (255, 107, 129, 180) if is_sec else (235, 238, 245)
        draw_rounded_rect(draw, (bx, by, bx + box_w, by + box_h), radius=18, fill=bg_col, outline=border_col, width=2)
        
        f_num = get_font(34, bold=True)
        nw = draw.textlength(val, font=f_num)
        num_col = (255, 107, 129) if is_sec else (28, 28, 30)
        draw.text((bx + (box_w - nw) // 2, by + 16), val, fill=num_col, font=f_num)

        f_lbl = get_font(16)
        lw = draw.textlength(lbl, font=f_lbl)
        draw.text((bx + (box_w - lw) // 2, by + 60), lbl, fill=(142, 142, 147), font=f_lbl)

    # Milestone Banner
    m_box_y = cnt_y + 205
    draw_rounded_rect(draw, (65, m_box_y, W - 65, m_box_y + 80), radius=16, fill=(255, 248, 240), outline=(255, 220, 180), width=1)
    f_ms = get_font(21, bold=True)
    ms_txt = "✨ 499 дней искренней любви и поддержки рука об руку"
    draw_mixed_text(draw, W // 2, m_box_y + 28, ms_txt, f_ms, (210, 105, 30), f_em_stat, align="center")

    # 3. Partner Mood & Explanation Card
    m_card_y = 795
    m_card_h = 360
    draw_rounded_rect(draw, (40, m_card_y, W - 40, m_card_y + m_card_h), radius=28, fill=(255, 255, 255, 240), outline=(235, 238, 245), width=2)

    # Mood Header
    draw_mixed_text(draw, 65, m_card_y + 26, "💭 Настроение Алины", get_font(24, bold=True), (28, 28, 30), f_em_title)
    draw.text((W - 65 - draw.textlength("5 минут назад", font=f_tag), m_card_y + 30), "5 минут назад", fill=(142, 142, 147), font=f_tag)

    # Status Pill
    p_box_y = m_card_y + 75
    draw_rounded_rect(draw, (65, p_box_y, 280, p_box_y + 54), radius=27, fill=(255, 240, 244), outline=(255, 107, 129), width=2)
    f_mood_lbl = get_font(22, bold=True)
    draw_mixed_text(draw, 85, p_box_y + 12, "🥺 Скучаю", f_mood_lbl, (255, 75, 105), f_em_stat)

    # Explanation Note Box
    q_box_y = m_card_y + 150
    draw_rounded_rect(draw, (65, q_box_y, W - 65, q_box_y + 105), radius=18, fill=(248, 249, 252), outline=(235, 238, 245), width=1)
    f_quote = get_font(20)
    draw_mixed_text(draw, 85, q_box_y + 20, "«Хочу скорее обнять тебя после пар 💕", f_quote, (44, 44, 46), f_em_stat)
    draw_mixed_text(draw, 85, q_box_y + 55, "Жду нашей вечерней прогулки в парке!»", f_quote, (44, 44, 46), f_em_stat)

    # Fast reaction feedback badge
    r_badge_y = m_card_y + 280
    draw_rounded_rect(draw, (65, r_badge_y, W - 65, r_badge_y + 52), radius=16, fill=(255, 245, 247))
    f_react = get_font(19, bold=True)
    draw_mixed_text(draw, 85, r_badge_y + 14, "❤️ Максим отправил сердечко и поддержку в 14:26", f_react, (255, 107, 129), f_em_stat)

    # 4. Attention Action Button
    b_y = 1185
    b_h = 75
    btn_grad = create_gradient(W - 80, b_h, (255, 107, 129), (255, 160, 122), horizontal=True)
    btn_mask = Image.new("L", (W - 80, b_h), 0)
    ImageDraw.Draw(btn_mask).rounded_rectangle((0, 0, W - 80, b_h), radius=24, fill=255)
    img.paste(btn_grad, (40, b_y), btn_mask)

    draw = ImageDraw.Draw(img)
    f_btn = get_font(26, bold=True)
    btn_txt = "💌 Послать знак внимания Алине"
    draw_mixed_text(draw, W // 2, b_y + 22, btn_txt, f_btn, (255, 255, 255), f_em_title, align="center")

    img.convert("RGB").save(out_path, quality=95)
    print(f"[Graphics] Rendered Promo Screen 1 -> {out_path}")

def render_screen_2(out_path):
    W, H = 800, 1380
    img = create_gradient(W, H, (246, 248, 252, 255), (254, 245, 246, 255))
    draw = ImageDraw.Draw(img)

    f_stat = get_font(22, bold=True)
    f_em_stat = get_emoji_font(26)
    draw.text((45, 28), "14:30", fill=(28, 28, 30), font=f_stat)
    draw.text((700, 28), "100%", fill=(28, 28, 30), font=f_stat)

    sheet_y = 100
    sheet_h = 1220
    draw_rounded_rect(draw, (35, sheet_y, W - 35, sheet_y + sheet_h), radius=32, fill=(255, 255, 255, 250), outline=(230, 234, 242), width=2)
    draw_rounded_rect(draw, (W // 2 - 35, sheet_y + 16, W // 2 + 35, sheet_y + 22), radius=3, fill=(210, 215, 225))

    draw.text((65, sheet_y + 45), "Ваше настроение", fill=(28, 28, 30), font=get_font(32, bold=True))
    draw.text((65, sheet_y + 90), "Партнёр сразу увидит статус и пояснение", fill=(142, 142, 147), font=get_font(20))

    moods = [
        ("🥰 Люблю", False),
        ("🥺 Скучаю", True),
        ("😴 Устала", False),
        ("😒 Обиделась", False),
        ("🥳 Радостно", False),
        ("☕️ Спокойно", False),
    ]

    grid_y = sheet_y + 140
    mw = 315
    mh = 80
    gap_x = 22
    gap_y = 16

    for idx, (m_text, is_active) in enumerate(moods):
        row = idx // 2
        col = idx % 2
        bx = 65 + col * (mw + gap_x)
        by = grid_y + row * (mh + gap_y)

        if is_active:
            draw_rounded_rect(draw, (bx, by, bx + mw, by + mh), radius=20, fill=(255, 240, 244), outline=(255, 107, 129), width=3)
            col_t = (255, 75, 105)
        else:
            draw_rounded_rect(draw, (bx, by, bx + mw, by + mh), radius=20, fill=(248, 249, 252), outline=(235, 238, 245), width=2)
            col_t = (28, 28, 30)

        f_m = get_font(24, bold=is_active)
        draw_mixed_text(draw, bx + 26, by + 24, m_text, f_m, col_t, f_em_stat)

    f_lbl = get_font(22, bold=True)
    draw.text((65, sheet_y + 455), "Пояснение к настроению", fill=(28, 28, 30), font=f_lbl)
    draw.text((345, sheet_y + 458), "(партнёр прочитает в деталях)", fill=(142, 142, 147), font=get_font(18))

    txt_y = sheet_y + 495
    txt_h = 160
    draw_rounded_rect(draw, (65, txt_y, W - 65, txt_y + txt_h), radius=20, fill=(248, 249, 252), outline=(255, 107, 129, 140), width=2)

    f_input = get_font(22)
    draw_mixed_text(draw, 85, txt_y + 24, "Хочу скорее обнять тебя после пар 💕", f_input, (28, 28, 30), f_em_stat)
    draw.text((85, txt_y + 64), "Жду нашей вечерней прогулки в парке!", fill=(28, 28, 30), font=f_input)

    draw.text((65, sheet_y + 695), "Быстрые знаки внимания от партнёра:", fill=(28, 28, 30), font=get_font(22, bold=True))

    reactions = [
        ("🤗 Обнять", (255, 248, 240), (255, 180, 100)),
        ("💋 Поцелуй", (255, 240, 245), (255, 107, 129)),
        ("❤️ Люблю", (255, 240, 244), (255, 75, 105)),
        ("☕️ Забота", (240, 248, 255), (100, 149, 237)),
    ]
    rx_w = 150
    rx_h = 60
    rx_gap = 18
    for i, (rx_t, bg_c, bord_c) in enumerate(reactions):
        rbx = 65 + i * (rx_w + rx_gap)
        rby = sheet_y + 745
        draw_rounded_rect(draw, (rbx, rby, rbx + rx_w, rby + rx_h), radius=16, fill=bg_c, outline=bord_c, width=2)
        f_rx = get_font(20, bold=True)
        draw_mixed_text(draw, rbx + 16, rby + 16, rx_t, f_rx, (28, 28, 30), f_em_stat)

    feat_y = sheet_y + 845
    feat_h = 145
    draw_rounded_rect(draw, (65, feat_y, W - 65, feat_y + feat_h), radius=20, fill=(240, 247, 255), outline=(180, 215, 255), width=2)
    draw_mixed_text(draw, 88, feat_y + 24, "💡 Без недосказанности и догадок", get_font(22, bold=True), (24, 100, 200), f_em_stat)
    f_desc = get_font(18)
    draw_mixed_text(draw, 88, feat_y + 60, "Когда кто-то ставит статус «😒 Обиделась» или «😴 Устала»,", f_desc, (70, 80, 95), f_em_stat)
    draw.text((88, feat_y + 92), "сразу понятно почему — всё решается тёплым словом и поддержкой!", fill=(70, 80, 95), font=f_desc)

    s_btn_y = sheet_y + 1030
    s_btn_h = 75
    btn_grad = create_gradient(W - 130, s_btn_h, (255, 107, 129), (255, 160, 122), horizontal=True)
    btn_mask = Image.new("L", (W - 130, s_btn_h), 0)
    ImageDraw.Draw(btn_mask).rounded_rectangle((0, 0, W - 130, s_btn_h), radius=24, fill=255)
    img.paste(btn_grad, (65, s_btn_y), btn_mask)

    draw = ImageDraw.Draw(img)
    f_btn = get_font(26, bold=True)
    btn_txt = "Сохранить настроение 💕"
    draw_mixed_text(draw, W // 2, s_btn_y + 22, btn_txt, f_btn, (255, 255, 255), f_em_stat, align="center")

    img.convert("RGB").save(out_path, quality=95)
    print(f"[Graphics] Rendered Promo Screen 2 -> {out_path}")

def render_post_banner(out_path, screen1_path):
    W, H = 1280, 720
    img = create_gradient(W, H, (18, 14, 26), (36, 18, 44), horizontal=False)
    draw = ImageDraw.Draw(img)

    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(glow)
    g_draw.ellipse((80, 80, 480, 480), fill=(255, 107, 129, 35))
    g_draw.ellipse((750, 150, 1250, 650), fill=(255, 160, 122, 30))
    glow = glow.filter(ImageFilter.GaussianBlur(50))
    img.paste(glow, (0, 0), glow)
    draw = ImageDraw.Draw(img)

    f_em_banner = get_emoji_font(26)
    f_em_large = get_emoji_font(40)

    left_x = 75
    tag_w = 385
    tag_h = 38
    draw_rounded_rect(draw, (left_x, 60, left_x + tag_w, 60 + tag_h), radius=19, fill=(255, 255, 255, 22), outline=(255, 107, 129, 140), width=1)
    f_tag = get_font(16, bold=True)
    draw_mixed_text(draw, left_x + 18, 68, "✨ ПРИЛОЖЕНИЕ ДЛЯ ПАР В TELEGRAM", f_tag, (255, 180, 195), f_em_banner)

    f_head = get_font(42, bold=True)
    draw.text((left_x, 125), "«Двое» — уютный уголок", fill=(255, 255, 255), font=f_head)
    draw_mixed_text(draw, left_x, 178, "для любящей пары 💕", f_head, (255, 107, 129), f_em_large)

    f_sub = get_font(21)
    draw.text((left_x, 240), "Всё самое важное для ваших отношений в одном месте:", fill=(210, 215, 225), font=f_sub)

    features = [
        ("⏳", "Точный счётчик вместе", "годы, месяцы, дни, часы и секунды"),
        ("💭", "Настроение с пояснением", "делитесь чувствами без недомолвок"),
        ("💌", "Мгновенные знаки внимания", "отправляйте сердечки в один клик"),
        ("🔒", "100% приватно и бесплатно", "без рекламы и навязчивых подписок"),
    ]

    bullet_y = 295
    for icon, title, desc in features:
        draw_mixed_text(draw, left_x, bullet_y, icon, get_font(22), (255, 255, 255), f_em_banner)
        draw.text((left_x + 36, bullet_y), title, font=get_font(21, bold=True), fill=(255, 255, 255))
        draw.text((left_x + 36 + draw.textlength(title, font=get_font(21, bold=True)) + 12, bullet_y), f"— {desc}", font=get_font(18), fill=(180, 185, 200))
        bullet_y += 52

    cta_y = 540
    cta_w = 480
    cta_h = 75
    btn_grad = create_gradient(cta_w, cta_h, (255, 107, 129), (255, 160, 122), horizontal=True)
    btn_mask = Image.new("L", (cta_w, cta_h), 0)
    ImageDraw.Draw(btn_mask).rounded_rectangle((0, 0, cta_w, cta_h), radius=22, fill=255)
    img.paste(btn_grad, (left_x, cta_y), btn_mask)

    draw = ImageDraw.Draw(img)
    f_cta = get_font(22, bold=True)
    cta_txt = "Запустить бота 👉  @ChibiLovePara_bot"
    draw_mixed_text(draw, left_x + 34, cta_y + 24, cta_txt, f_cta, (255, 255, 255), f_em_banner)

    f_bot_sub = get_font(16)
    draw_mixed_text(draw, left_x + 10, cta_y + 92, "💡 Доступно бесплатно для всех пользователей Telegram", f_bot_sub, (160, 165, 180), f_em_banner)

    if os.path.exists(screen1_path):
        s1 = Image.open(screen1_path)
        ph_h = 560
        ph_w = int(s1.width * (ph_h / s1.height))
        s1_resized = s1.resize((ph_w, ph_h), Image.Resampling.LANCZOS)

        ph_x = W - ph_w - 75
        ph_y = (H - ph_h) // 2

        sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        sh_draw = ImageDraw.Draw(sh)
        sh_draw.rounded_rectangle((ph_x - 10, ph_y - 5, ph_x + ph_w + 10, ph_y + ph_h + 15), radius=38, fill=(0, 0, 0, 120))
        sh = sh.filter(ImageFilter.GaussianBlur(25))
        img.paste(sh, (0, 0), sh)

        ph_mask = Image.new("L", (ph_w, ph_h), 0)
        ImageDraw.Draw(ph_mask).rounded_rectangle((0, 0, ph_w, ph_h), radius=32, fill=255)
        img.paste(s1_resized, (ph_x, ph_y), ph_mask)

        draw = ImageDraw.Draw(img)
        draw.rounded_rectangle((ph_x - 4, ph_y - 4, ph_x + ph_w + 4, ph_y + ph_h + 4), radius=34, outline=(255, 255, 255, 90), width=4)

    img.convert("RGB").save(out_path, quality=95)
    print(f"[Graphics] Rendered Promo Post Banner -> {out_path}")

def main():
    s1_path = os.path.join(IMG_DIR, "promo_screen_1.png")
    s2_path = os.path.join(IMG_DIR, "promo_screen_2.png")
    banner_path = os.path.join(IMG_DIR, "promo_post_banner.jpg")

    render_screen_1(s1_path)
    render_screen_2(s2_path)
    render_post_banner(banner_path, s1_path)
    print(">>> All promo visual assets created successfully with native Apple Color Emoji!")

if __name__ == "__main__":
    main()
