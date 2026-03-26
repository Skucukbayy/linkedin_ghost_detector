from PIL import Image, ImageDraw, ImageFont
import os

OUT = "/Users/skucukbay/.verdent/verdent-projects/new-project/linkedin-ghost-detector/store"

def get_font(size):
    paths = [
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/SFNSText.ttf",
        "/System/Library/Fonts/SFNS.ttf",
        "/Library/Fonts/Arial.ttf",
    ]
    for p in paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except:
                continue
    return ImageFont.load_default()

def promo_banner():
    W, H = 1400, 560
    img = Image.new("RGB", (W, H), "#0f172a")
    draw = ImageDraw.Draw(img)

    for i in range(H):
        r = int(15 + (30 - 15) * i / H)
        g = int(23 + (64 - 23) * i / H)
        b = int(42 + (175 - 42) * i / H)
        draw.line([(0, i), (W, i)], fill=(r, g, b))

    for x in range(0, W, 60):
        for y in range(0, H, 60):
            draw.rectangle([x, y, x+1, y+1], fill=(255, 255, 255, 30))

    title_font = get_font(64)
    sub_font = get_font(28)
    small_font = get_font(22)

    draw.text((W//2, 140), "Ghost Job Detector", fill="white", font=title_font, anchor="mm")
    draw.text((W//2, 210), "\uD83D\uDC7B", fill="white", font=get_font(50), anchor="mm")
    draw.text((W//2, 280), "Sahte ve hayalet is ilanlarini aninda tespit edin", fill="#93c5fd", font=sub_font, anchor="mm")

    sites = ["LinkedIn", "Kariyer.net", "Yenibiris.com"]
    total_w = len(sites) * 180 + (len(sites) - 1) * 20
    start_x = (W - total_w) // 2
    for i, site in enumerate(sites):
        x = start_x + i * 200
        draw.rounded_rectangle([x, 340, x + 180, 385], radius=8, fill="#1e40af")
        draw.text((x + 90, 362), site, fill="white", font=small_font, anchor="mm")

    badges = [("Yuksek Risk", "#dc2626"), ("Orta Risk", "#d97706"), ("Dusuk Risk", "#2563eb")]
    badge_start = (W - 3 * 160 - 2 * 20) // 2
    for i, (label, color) in enumerate(badges):
        x = badge_start + i * 180
        draw.rounded_rectangle([x, 420, x + 160, 460], radius=8, fill=color)
        draw.text((x + 80, 440), "\uD83D\uDC7B " + label, fill="white", font=small_font, anchor="mm")

    draw.text((W//2, 510), "Akilli risk puanlama sistemi ile zaman kaybetmeyin", fill="#94a3b8", font=small_font, anchor="mm")

    img.save(os.path.join(OUT, "promo-1400x560.png"))
    print("promo OK")

def screenshot_mockup(name, w, h, title, subtitle, cards_data):
    img = Image.new("RGB", (w, h), "#f1f5f9")
    draw = ImageDraw.Draw(img)

    font_title = get_font(28)
    font_sub = get_font(18)
    font_small = get_font(14)
    font_tiny = get_font(12)

    draw.rectangle([0, 0, w, 70], fill="#0f172a")
    draw.text((20, 22), title, fill="white", font=font_title)
    draw.text((20, 52), subtitle, fill="#94a3b8", font=font_tiny)

    draw.rounded_rectangle([w - 320, 80, w - 20, h - 20], radius=12, fill="white", outline="#e2e8f0")
    draw.rectangle([w - 320, 80, w - 20, 130], fill="#1e40af")
    draw.text((w - 310, 92), "Ghost Job Detector", fill="white", font=font_sub)
    draw.text((w - 310, 115), "Popup Panel", fill="#93c5fd", font=font_tiny)

    stats_y = 145
    stat_colors = [("#dc2626", "3", "Yuksek"), ("#d97706", "5", "Orta"), ("#2563eb", "2", "Dusuk")]
    for i, (color, num, label) in enumerate(stat_colors):
        sx = w - 310 + i * 95
        draw.rounded_rectangle([sx, stats_y, sx + 85, stats_y + 55], radius=6, fill="#f8fafc")
        draw.text((sx + 42, stats_y + 15), num, fill=color, font=font_title, anchor="mm")
        draw.text((sx + 42, stats_y + 40), label, fill="#6b7280", font=font_tiny, anchor="mm")

    y = 80
    for i, (job_title, company, badge_text, badge_color, flags) in enumerate(cards_data):
        card_y = y + i * 120
        draw.rounded_rectangle([20, card_y, w - 340, card_y + 110], radius=10, fill="white", outline="#e2e8f0")
        draw.text((35, card_y + 12), job_title, fill="#111827", font=font_sub)

        bx = 35 + len(job_title) * 10
        draw.rounded_rectangle([bx, card_y + 10, bx + len(badge_text) * 8 + 16, card_y + 32], radius=4, fill=badge_color)
        draw.text((bx + 8, card_y + 12), badge_text, fill="white", font=font_tiny)

        draw.text((35, card_y + 40), company, fill="#6b7280", font=font_small)

        fx = 35
        for flag in flags:
            fw = len(flag) * 7 + 12
            draw.rounded_rectangle([fx, card_y + 65, fx + fw, card_y + 85], radius=3, fill="#fef2f2")
            draw.text((fx + 6, card_y + 68), flag, fill="#991b1b", font=font_tiny)
            fx += fw + 6

    popup_y = 215
    popup_items = [
        ("Senior Developer", "TechCorp", "#dc2626"),
        ("Data Analyst", "DataCo", "#d97706"),
        ("UX Designer", "DesignHub", "#d97706"),
    ]
    for i, (pt, pc, pc2) in enumerate(popup_items):
        iy = popup_y + i * 65
        draw.rounded_rectangle([w - 305, iy, w - 35, iy + 58], radius=6, fill="white", outline="#e2e8f0")
        draw.line([(w - 305, iy), (w - 305, iy + 58)], fill=pc2, width=3)
        draw.text((w - 295, iy + 8), pt, fill="#111827", font=font_small)
        draw.text((w - 295, iy + 28), pc, fill="#6b7280", font=font_tiny)
        draw.rounded_rectangle([w - 295, iy + 42, w - 230, iy + 54], radius=2, fill="#fef2f2")
        draw.text((w - 292, iy + 42), "30+ gun", fill="#991b1b", font=get_font(10))

    img.save(os.path.join(OUT, name))
    print(name, "OK")

promo_banner()

cards1 = [
    ("Senior Software Engineer", "TechCorp Inc.", "Yuksek Risk", "#dc2626", ["45 gundur yayinda", "Yeniden yayinlanmis"]),
    ("Data Analyst", "DataCo", "Orta Risk", "#d97706", ["Yeniden yayinlanmis ilan"]),
    ("Product Manager", "StartupXYZ", "Orta Risk", "#d97706", ["250+ basvuru", "Sponsorlu ilan"]),
    ("Frontend Developer", "WebAgency", "Dusuk Risk", "#2563eb", ["Konum/detay eksik"]),
    ("DevOps Engineer", "CloudSoft", "Yuksek Risk", "#dc2626", ["60 gundur yayinda", "Sirket bilgisi eksik"]),
]

screenshot_mockup("screenshot-1280x800-linkedin.png", 1280, 800,
    "LinkedIn Jobs - Ghost Job Detector",
    "linkedin.com/jobs/search/?keywords=developer",
    cards1)

cards2 = [
    ("Yazilim Uzmani", "ABC Teknoloji", "Yuksek Risk", "#dc2626", ["35 gundur yayinda", "Sirket bilgisi eksik"]),
    ("Proje Yoneticisi", "XYZ Holding", "Orta Risk", "#d97706", ["Yeniden yayinlanmis"]),
    ("Veri Analisti", "DataTR", "Dusuk Risk", "#2563eb", ["Sponsorlu ilan"]),
    ("Satis Muduru", "MarketPlus", "Yuksek Risk", "#dc2626", ["50 gundur yayinda", "300+ basvuru"]),
    ("IK Uzmani", "HRCompany", "Orta Risk", "#d97706", ["Konum/detay eksik", "Yeniden yayinlanmis"]),
]

screenshot_mockup("screenshot-1280x800-kariyer.png", 1280, 800,
    "Kariyer.net - Ghost Job Detector",
    "kariyer.net/is-ilanlari?arama=yazilim",
    cards2)

print("Tum gorseller olusturuldu!")
