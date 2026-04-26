from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
OUTPUT = ROOT / "docs" / "guidebook" / "visual-supplement"

BG = "#fcf8f3"
PANEL = "#fffdf9"
LINE = "#d8cfbf"
INK = "#2a2431"
MUTED = "#6d6775"
ACCENT = "#356b59"
WARM = "#7f4f24"
SOFT = "#eef5f1"
SOFT_WARM = "#f8eee4"

WING_SPLIT_X = 900
WING_SPLIT_Y = 600
BODY_CENTER = (540, 540)
WING_ANCHORS = {
    "foreLeft": {"onBody": (375, 549), "relative": (841, 500)},
    "foreRight": {"onBody": (700, 549), "relative": (68, 500)},
    "hindLeft": {"onBody": (375, 682), "relative": (852, -18)},
    "hindRight": {"onBody": (700, 682), "relative": (51, -18)},
}
ANTENNA_ANCHORS = {
    "left": {"onBody": (488, 290), "onAntenna": (494, 425)},
    "right": {"onBody": (559, 290), "onAntenna": (555, 425)},
}

ARCHETYPES = [
    ("friendly", "Warm Welcome", "warm-welcome"),
    ("cautious", "Delicate Pink", "delicate-pink"),
    ("energetic", "Electric Violet", "electric-violet"),
    ("skittish", "Nervous Jewel", "nervous-jewel"),
    ("wise", "Ancient Scholar", "ancient-scholar"),
    ("mystic", "Twilight Dancer", "twilight-dancer"),
    ("golden", "Legendary One", "legendary-one"),
]


def load_font(size: int, bold: bool = False):
    font_paths = [
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
    ]
    for font_path in font_paths:
        path = Path(font_path)
        if path.exists():
            return ImageFont.truetype(str(path), size=size)
    return ImageFont.load_default()


FONT_H1 = load_font(60, bold=True)
FONT_H2 = load_font(34, bold=True)
FONT_H3 = load_font(26, bold=True)
FONT_BODY = load_font(24)
FONT_SMALL = load_font(20)
FONT_TINY = load_font(16)


def ensure_output():
    OUTPUT.mkdir(parents=True, exist_ok=True)


def rgba(hex_color: str):
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i:i + 2], 16) for i in (0, 2, 4)) + (255,)


def new_canvas(size):
    return Image.new("RGBA", size, rgba(BG))


def draw_wrapped(draw: ImageDraw.ImageDraw, text: str, box, font, fill=INK, line_gap=6):
    x1, y1, x2, y2 = box
    words = text.split()
    lines = []
    current = ""
    for word in words:
        candidate = word if not current else f"{current} {word}"
        width = draw.textbbox((0, 0), candidate, font=font)[2]
        if width <= (x2 - x1):
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    y = y1
    for line in lines:
        draw.text((x1, y), line, font=font, fill=fill)
        bbox = draw.textbbox((x1, y), line, font=font)
        y = bbox[3] + line_gap
        if y > y2:
            break
    return y


def draw_panel(draw: ImageDraw.ImageDraw, box, title=None, subtitle=None, fill=PANEL):
    x1, y1, x2, y2 = box
    draw.rounded_rectangle(box, radius=24, fill=fill, outline=LINE, width=3)
    content_y = y1 + 24
    if title:
        draw.text((x1 + 24, content_y), title, font=FONT_H3, fill=INK)
        content_y += 42
    if subtitle:
        content_y = draw_wrapped(draw, subtitle, (x1 + 24, content_y, x2 - 24, y2 - 24), FONT_SMALL, fill=MUTED)
        content_y += 12
    return (x1 + 24, content_y, x2 - 24, y2 - 24)


def fit_image(img: Image.Image, box_size, contain=True):
    img = img.convert("RGBA")
    bw, bh = box_size
    scale = min(bw / img.width, bh / img.height) if contain else max(bw / img.width, bh / img.height)
    size = (max(1, int(img.width * scale)), max(1, int(img.height * scale)))
    return img.resize(size, Image.Resampling.LANCZOS)


def paste_center(base: Image.Image, overlay: Image.Image, box):
    x1, y1, x2, y2 = box
    x = x1 + (x2 - x1 - overlay.width) // 2
    y = y1 + (y2 - y1 - overlay.height) // 2
    base.alpha_composite(overlay, (x, y))
    return x, y


def load_body():
    return Image.open(ASSETS / "butterflies" / "papilionem-butterfly-body.png").convert("RGBA")


def load_antenna():
    return Image.open(ASSETS / "butterflies" / "papilionem-butterfly-antenna.png").convert("RGBA")


def load_wing_sheet(stem: str, sex: str):
    folder = "male" if sex == "M" else "female"
    suffix = "M" if sex == "M" else "F"
    return Image.open(ASSETS / "butterflies" / folder / f"{stem}-wing-full-{suffix}.png").convert("RGBA")


def crop_wing_pieces(sheet: Image.Image):
    return {
        "foreLeft": sheet.crop((0, 0, WING_SPLIT_X, WING_SPLIT_Y)),
        "foreRight": sheet.crop((WING_SPLIT_X, 0, sheet.width, WING_SPLIT_Y)),
        "hindLeft": sheet.crop((0, WING_SPLIT_Y, WING_SPLIT_X, sheet.height)),
        "hindRight": sheet.crop((WING_SPLIT_X, WING_SPLIT_Y, sheet.width, sheet.height)),
    }


def compose_butterfly(personality_stem: str, sex: str, wing_donors=None, spread_fore=1.0, spread_hind=0.86, child_sex=None):
    body = load_body()
    antenna = load_antenna()
    actual_sex = child_sex or sex
    body_scale = 0.8 if actual_sex == "M" else 1.0
    wing_scale = 1.2 if actual_sex == "F" else 1.0

    canvas = Image.new("RGBA", (1700, 1700), (0, 0, 0, 0))
    center = (850, 900)

    s = body_scale * 0.58
    ws = wing_scale * 1.45 * 0.58

    body_img = body.resize((int(body.width * s), int(body.height * s)), Image.Resampling.LANCZOS)
    antenna_img = antenna.resize((int(antenna.width * s), int(antenna.height * s)), Image.Resampling.LANCZOS)

    def anchor_to_canvas(point):
        return (
            center[0] + int((point[0] - BODY_CENTER[0]) * s),
            center[1] + int((point[1] - BODY_CENTER[1]) * s),
        )

    for wing_key in ["hindLeft", "hindRight", "foreLeft", "foreRight"]:
        donor = wing_donors[wing_key] if wing_donors else {"personality": personality_stem, "sex": sex}
        sheet = load_wing_sheet(donor["personality"], donor["sex"])
        piece = crop_wing_pieces(sheet)[wing_key]
        scale = ws
        piece = piece.resize((int(piece.width * scale), int(piece.height * scale)), Image.Resampling.LANCZOS)
        spread = spread_hind if wing_key.startswith("hind") else spread_fore
        spread_w = max(1, int(piece.width * spread))
        piece = piece.resize((spread_w, piece.height), Image.Resampling.LANCZOS)

        rel = WING_ANCHORS[wing_key]["relative"]
        draw_anchor = anchor_to_canvas(WING_ANCHORS[wing_key]["onBody"])
        body_conn_y = draw_anchor[1] - (int(5 * s) if wing_key.startswith("hind") else 0)
        draw_x = int(draw_anchor[0] - (rel[0] * scale * spread))
        draw_y = int(body_conn_y - (rel[1] * scale))
        canvas.alpha_composite(piece, (draw_x, draw_y))

    body_pos = (center[0] - body_img.width // 2, center[1] - body_img.height // 2)
    canvas.alpha_composite(body_img, body_pos)

    antenna_pos = (center[0] - antenna_img.width // 2, center[1] - antenna_img.height // 2)
    canvas.alpha_composite(antenna_img, antenna_pos)
    return canvas


def draw_title(canvas: Image.Image, title: str, subtitle: str):
    draw = ImageDraw.Draw(canvas)
    draw.text((90, 70), title, font=FONT_H1, fill=INK)
    draw_wrapped(draw, subtitle, (90, 150, canvas.width - 90, 260), FONT_BODY, fill=MUTED)


def draw_chip(draw, xy, text, fill=SOFT, outline=LINE):
    x, y = xy
    bbox = draw.textbbox((0, 0), text, font=FONT_SMALL)
    w = bbox[2] - bbox[0] + 28
    h = bbox[3] - bbox[1] + 16
    draw.rounded_rectangle((x, y, x + w, y + h), radius=18, fill=fill, outline=outline, width=2)
    draw.text((x + 14, y + 8), text, font=FONT_SMALL, fill=INK)
    return x + w


def build_sprite_anatomy():
    canvas = new_canvas((2800, 2100))
    draw_title(
        canvas,
        "Visual Supplement 01 · Sprite Anatomy",
        "The butterfly is built from separate runtime layers: body, antenna, and a full wing sheet split into four independent pieces."
    )
    draw = ImageDraw.Draw(canvas)

    left = draw_panel(draw, (90, 300, 1060, 1180), "Body + antenna source sprites", "These are separate images. The body sets the center. The antenna image is anchored to the body, not baked into the wing sheet.")
    right = draw_panel(draw, (1120, 300, 2710, 1180), "Wing sheet split and anchor logic", "The runtime sheet is cut at x=900 and y=600, producing fore-left, fore-right, hind-left, and hind-right pieces that can come from different donors in hybrids.")
    bottom = draw_panel(draw, (90, 1230, 2710, 1980), "Composition facts", "These labels are taken from the live sprite manager and show what the renderer actually uses.")

    body = fit_image(load_body(), (380, 380))
    antenna = fit_image(load_antenna(), (380, 380))
    paste_center(canvas, body, (left[0], left[1] + 20, left[0] + 420, left[1] + 430))
    paste_center(canvas, antenna, (left[0] + 430, left[1] + 20, left[0] + 850, left[1] + 430))
    draw.text((left[0] + 95, left[1] + 430), "body sprite\n1080×1080", font=FONT_SMALL, fill=INK, spacing=4)
    draw.text((left[0] + 515, left[1] + 430), "antenna sprite\n1080×1080", font=FONT_SMALL, fill=INK, spacing=4)

    body_box = (left[0] + 40, left[1] + 520, left[0] + 400, left[1] + 760)
    draw.rounded_rectangle(body_box, radius=20, fill=SOFT, outline=LINE, width=2)
    draw.text((body_box[0] + 22, body_box[1] + 18), "Body center", font=FONT_H3, fill=INK)
    draw.text((body_box[0] + 22, body_box[1] + 64), "540, 540", font=FONT_BODY, fill=ACCENT)

    antenna_box = (left[0] + 450, left[1] + 520, left[0] + 850, left[1] + 760)
    draw.rounded_rectangle(antenna_box, radius=20, fill=SOFT_WARM, outline=LINE, width=2)
    draw.text((antenna_box[0] + 22, antenna_box[1] + 18), "Antenna mounts", font=FONT_H3, fill=INK)
    draw.text((antenna_box[0] + 22, antenna_box[1] + 64), "left 488,290 · right 559,290", font=FONT_SMALL, fill=WARM)
    draw.text((antenna_box[0] + 22, antenna_box[1] + 104), "The antenna sprite is anchored to these body points.", font=FONT_SMALL, fill=INK)

    sheet = fit_image(load_wing_sheet("warm-welcome", "F"), (right[2] - right[0] - 40, 560))
    sheet_pos = paste_center(canvas, sheet, (right[0], right[1], right[2], right[1] + 620))
    scale_x = sheet.width / 1920
    scale_y = sheet.height / 1080
    sx = sheet_pos[0]
    sy = sheet_pos[1]
    split_x = sx + int(WING_SPLIT_X * scale_x)
    split_y = sy + int(WING_SPLIT_Y * scale_y)
    draw.line((split_x, sy, split_x, sy + sheet.height), fill=ACCENT, width=6)
    draw.line((sx, split_y, sx + sheet.width, split_y), fill=ACCENT, width=6)
    for label, point in {
        "fore-left": (sx + 140, sy + 120),
        "fore-right": (split_x + 110, sy + 120),
        "hind-left": (sx + 140, split_y + 110),
        "hind-right": (split_x + 110, split_y + 110),
    }.items():
        draw_chip(draw, point, label)

    pieces = crop_wing_pieces(load_wing_sheet("warm-welcome", "F"))
    piece_y = right[1] + 670
    labels = [("foreLeft", "fore-left"), ("foreRight", "fore-right"), ("hindLeft", "hind-left"), ("hindRight", "hind-right")]
    for i, (key, label) in enumerate(labels):
        px = right[0] + i * 330
        box = (px, piece_y, px + 290, piece_y + 220)
        draw.rounded_rectangle(box, radius=18, fill=rgba("#f7f2ea"), outline=LINE, width=2)
        thumb = fit_image(pieces[key], (250, 150))
        paste_center(canvas, thumb, (box[0] + 10, box[1] + 10, box[2] - 10, box[1] + 150))
        draw.text((box[0] + 16, box[1] + 165), label, font=FONT_SMALL, fill=INK)

    facts = [
        "Wing sheet size: 1920×1080",
        "Body sprite size: 1080×1080",
        "Antenna sprite size: 1080×1080",
        "Split points: x=900, y=600",
        "Render order: body → antenna → hindwings → forewings",
        "Hybrid children can pull each wing piece from a different parent donor",
    ]
    y = bottom[1]
    for fact in facts:
        draw_chip(draw, (bottom[0], y), fact)
        y += 60

    draw.text((bottom[0] + 950, bottom[1]), "Wing anchor points on body", font=FONT_H3, fill=INK)
    anchor_y = bottom[1] + 60
    for key, anchor in WING_ANCHORS.items():
        draw.text((bottom[0] + 950, anchor_y), f"{key}: body {anchor['onBody'][0]},{anchor['onBody'][1]} · piece {anchor['relative'][0]},{anchor['relative'][1]}", font=FONT_SMALL, fill=MUTED)
        anchor_y += 42

    canvas.save(OUTPUT / "01-sprite-anatomy.png")


def build_archetype_page(filename: str, entries, title_suffix: str):
    row_count = len(entries)
    canvas = new_canvas((2800, 900 + row_count * 520))
    draw_title(
        canvas,
        f"Visual Supplement {title_suffix} · Archetype Male/Female Comparisons",
        "Each row uses the real in-game sprite assets and the same sex-based scale rules the renderer uses: males use a smaller body scale, while females use a larger wing scale."
    )
    draw = ImageDraw.Draw(canvas)
    x_label = 120
    x_male = 760
    x_female = 1760
    header_y = 300
    draw.text((x_male + 120, header_y), "Male render", font=FONT_H2, fill=INK)
    draw.text((x_female + 100, header_y), "Female render", font=FONT_H2, fill=INK)
    y = 380
    for archetype_key, label, stem in entries:
        row_box = (90, y, 2710, y + 430)
        draw.rounded_rectangle(row_box, radius=24, fill=PANEL, outline=LINE, width=3)
        draw.text((x_label, y + 30), label, font=FONT_H2, fill=INK)
        draw.text((x_label, y + 84), archetype_key, font=FONT_SMALL, fill=MUTED)
        male = fit_image(compose_butterfly(stem, "M"), (760, 300))
        female = fit_image(compose_butterfly(stem, "F"), (760, 300))
        paste_center(canvas, male, (x_male, y + 50, x_male + 760, y + 360))
        paste_center(canvas, female, (x_female, y + 50, x_female + 760, y + 360))
        y += 470
    canvas.save(OUTPUT / filename)


def build_hybrid_inheritance():
    canvas = new_canvas((2800, 2200))
    draw_title(
        canvas,
        "Visual Supplement 04 · Hybrid Inheritance Visual",
        "Hybrid butterflies do not inherit a single parent sprite sheet. Each wing can choose its donor independently, while traits and colors are blended and one parent ability is chosen."
    )
    draw = ImageDraw.Draw(canvas)

    mother_box = draw_panel(draw, (90, 300, 820, 1080), "Mother donor", "Friendly female / Warm Welcome")
    father_box = draw_panel(draw, (1980, 300, 2710, 1080), "Father donor", "Energetic male / Electric Violet")
    child_box = draw_panel(draw, (920, 300, 1880, 1320), "Hybrid child", "Example child uses female body/wing scaling, averaged traits, averaged colors, and mixed wing donors.")
    donor_box = draw_panel(draw, (90, 1140, 820, 1980), "Per-wing donor map", "Each wing key chooses mother or father independently.")
    rules_box = draw_panel(draw, (920, 1380, 2710, 1980), "What else inherits", "The visual donor map is only one part of breeding. The lifecycle system also chooses traits, colors, sex, and ability.")

    mother = fit_image(compose_butterfly("warm-welcome", "F"), (620, 560))
    father = fit_image(compose_butterfly("electric-violet", "M"), (620, 560))
    wing_donors = {
        "foreLeft": {"personality": "warm-welcome", "sex": "F"},
        "foreRight": {"personality": "electric-violet", "sex": "M"},
        "hindLeft": {"personality": "electric-violet", "sex": "M"},
        "hindRight": {"personality": "warm-welcome", "sex": "F"},
    }
    child = fit_image(compose_butterfly("warm-welcome", "F", wing_donors=wing_donors, child_sex="F"), (820, 700))
    paste_center(canvas, mother, mother_box)
    paste_center(canvas, father, father_box)
    paste_center(canvas, child, child_box)

    donor_rows = [
        ("fore-left", "mother · friendly female"),
        ("fore-right", "father · energetic male"),
        ("hind-left", "father · energetic male"),
        ("hind-right", "mother · friendly female"),
    ]
    yy = donor_box[1]
    for left_text, right_text in donor_rows:
        draw.rounded_rectangle((donor_box[0], yy, donor_box[2], yy + 90), radius=16, fill=SOFT, outline=LINE, width=2)
        draw.text((donor_box[0] + 20, yy + 24), left_text, font=FONT_BODY, fill=INK)
        draw.text((donor_box[0] + 290, yy + 24), right_text, font=FONT_SMALL, fill=MUTED)
        yy += 108

    pieces_y = donor_box[1] + 470
    for i, (key, label) in enumerate([("foreLeft", "FL"), ("foreRight", "FR"), ("hindLeft", "HL"), ("hindRight", "HR")]):
        donor = wing_donors[key]
        thumb = fit_image(crop_wing_pieces(load_wing_sheet(donor["personality"], donor["sex"]))[key], (150, 120))
        x = donor_box[0] + i * 165
        draw.rounded_rectangle((x, pieces_y, x + 150, pieces_y + 170), radius=14, fill=rgba("#f7f2ea"), outline=LINE, width=2)
        paste_center(canvas, thumb, (x + 8, pieces_y + 8, x + 142, pieces_y + 120))
        draw.text((x + 50, pieces_y + 130), label, font=FONT_SMALL, fill=INK)

    draw.text((rules_box[0], rules_box[1]), "Runtime inheritance summary", font=FONT_H3, fill=INK)
    bullets = [
        "Child sex is chosen randomly and determines body/wing scale profile.",
        "Core traits are averaged across both parents.",
        "The visible body colors are averaged pairwise.",
        "One parent ability is chosen for the child.",
        "The hybrid genome stores wingDonors per wing key.",
    ]
    yy = rules_box[1] + 60
    for bullet in bullets:
        draw.text((rules_box[0], yy), f"• {bullet}", font=FONT_BODY, fill=INK)
        yy += 54

    canvas.save(OUTPUT / "04-hybrid-inheritance-visual.png")


def build_animation_lifecycle():
    canvas = new_canvas((2800, 2200))
    draw_title(
        canvas,
        "Visual Supplement 05 · Animation And Lifecycle Breakdown",
        "The lifecycle visuals are assembled from multiple asset types: caterpillar frames, cocoon states, and a layered adult butterfly whose wings animate by spread instead of swapping whole body sprites."
    )
    draw = ImageDraw.Draw(canvas)

    top_left = draw_panel(draw, (90, 300, 1340, 990), "Caterpillar crawl frames", "The larval stage uses a small frame cycle rather than the adult wing-spread system.")
    top_right = draw_panel(draw, (1460, 300, 2710, 990), "Cocoon states", "The chrysalis stage has explicit unhatched and hatched sprites.")
    mid = draw_panel(draw, (90, 1040, 2710, 1520), "Adult composition order", "The runtime render draws body first, then antenna, then hindwings, then forewings. Forewings sit on top.")
    bottom = draw_panel(draw, (90, 1570, 2710, 2100), "Adult wing motion", "Adult butterfly animation comes from changing wing spread and tilt, not from swapping a separate frame sheet.")

    crawl_files = ["caterpillar-crawl1.png", "caterpillar-crawl2.png", "caterpillar-crawl3.png"]
    for i, name in enumerate(crawl_files):
        img = fit_image(Image.open(ASSETS / "caterpillars" / name).convert("RGBA"), (280, 280))
        box = (top_left[0] + i * 360, top_left[1] + 20, top_left[0] + i * 360 + 280, top_left[1] + 320)
        paste_center(canvas, img, box)
        draw.text((box[0] + 55, box[1] + 280), f"frame {i + 1}", font=FONT_SMALL, fill=INK)
        if i < 2:
            draw.text((box[0] + 305, box[1] + 130), "→", font=FONT_H1, fill=ACCENT)

    cocoon_names = [("cocoon-unhatched.png", "unhatched"), ("cocoon-hatched.png", "hatched")]
    for i, (name, label) in enumerate(cocoon_names):
        img = fit_image(Image.open(ASSETS / "cocoons" / name).convert("RGBA"), (360, 360))
        box = (top_right[0] + i * 430, top_right[1] + 20, top_right[0] + i * 430 + 360, top_right[1] + 380)
        paste_center(canvas, img, box)
        draw.text((box[0] + 110, box[1] + 310), label, font=FONT_SMALL, fill=INK)
        if i == 0:
            draw.text((box[0] + 390, box[1] + 150), "→", font=FONT_H1, fill=ACCENT)

    layers = [
        ("body", fit_image(load_body(), (220, 220))),
        ("antenna", fit_image(load_antenna(), (220, 220))),
        ("hindwings", fit_image(compose_butterfly("ancient-scholar", "F", spread_fore=0.0, spread_hind=0.9), (280, 260))),
        ("full adult", fit_image(compose_butterfly("ancient-scholar", "F", spread_fore=0.92, spread_hind=0.74), (280, 260))),
    ]
    x = mid[0] + 40
    for i, (label, img) in enumerate(layers):
        box = (x, mid[1] + 10, x + 280, mid[1] + 290)
        draw.rounded_rectangle(box, radius=18, fill=rgba("#f7f2ea"), outline=LINE, width=2)
        paste_center(canvas, img, box)
        draw.text((x + 85, mid[1] + 310), label, font=FONT_SMALL, fill=INK)
        if i < len(layers) - 1:
            draw.text((x + 310, mid[1] + 105), "▶", font=FONT_H1, fill=ACCENT)
        x += 610

    spreads = [0.35, 0.65, 1.0]
    labels = ["resting spread", "mid flap", "wide flap"]
    for i, spread in enumerate(spreads):
        img = fit_image(compose_butterfly("twilight-dancer", "F", spread_fore=spread, spread_hind=max(0.3, spread - 0.15)), (500, 300))
        box = (bottom[0] + 40 + i * 560, bottom[1] + 10, bottom[0] + 520 + i * 560, bottom[1] + 320)
        draw.rounded_rectangle(box, radius=18, fill=rgba("#f7f2ea"), outline=LINE, width=2)
        paste_center(canvas, img, box)
        draw.text((box[0] + 150, bottom[1] + 340), labels[i], font=FONT_SMALL, fill=INK)

    canvas.save(OUTPUT / "05-animation-lifecycle-breakdown.png")


def main():
    ensure_output()
    build_sprite_anatomy()
    build_archetype_page(
        "02-archetype-male-female-comparisons-core.png",
        ARCHETYPES[:4],
        "02"
    )
    build_archetype_page(
        "03-archetype-male-female-comparisons-special.png",
        ARCHETYPES[4:],
        "03"
    )
    build_hybrid_inheritance()
    build_animation_lifecycle()
    print(f"Wrote visual supplement plates to {OUTPUT}")


if __name__ == "__main__":
    main()
