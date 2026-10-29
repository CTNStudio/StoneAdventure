# -*- coding: utf-8 -*-
"""Paint a semi-transparent rim on the stone star frames.

For every frame: keep the body opaque, and fade the pixels that touch the
silhouette (ring 1) and their neighbours (ring 2).  The brighter a rim pixel is,
the more transparent it becomes -- that is the "glowing edge" look, and the dark
outline keeps most of its weight so the shape does not dissolve.

    ring 1 alphas (tone -> alpha 0..255)
        179 -> 100      (brightest highlight, 39%)
        158 -> 112      (the rim tone, 44%)
        128 -> 124
        104 -> 136
         79 -> 168
         59 -> 180
         38 -> 196
          0 -> 210      (the black underside stays readable)
    ring 2 = ring1 + 76, capped at 255     (soft second step)
"""
import os
import numpy as np
from PIL import Image

P = r"C:\Users\NewBee_Bar\AppData\Roaming\Minecraft Bedrock\Users\Shared\games\com.mojang\development_resource_packs\磐石之旅test(RP)"
OUT = os.path.join(os.environ["TEMP"], "starwork")

RING1 = {179: 100, 158: 112, 128: 124, 104: 136, 79: 168, 59: 180, 38: 196, 0: 210}
RING2_ADD = 76


def nearest_alpha(luma):
    best = min(RING1, key=lambda k: abs(k - luma))
    return RING1[best]


def paint(frame: Image.Image) -> Image.Image:
    a = np.asarray(frame.convert("RGBA")).copy()
    mask = a[..., 3] > 127
    h, w = mask.shape
    # ring 1: opaque pixel with at least one 4-neighbour that is transparent
    pad = np.zeros((h + 2, w + 2), bool)
    pad[1:-1, 1:-1] = mask
    all_nb = (pad[:-2, 1:-1] & pad[2:, 1:-1] & pad[1:-1, :-2] & pad[1:-1, 2:])
    ring1 = mask & ~all_nb
    # ring 2: opaque, not ring1, touching ring1
    p1 = np.zeros((h + 2, w + 2), bool)
    p1[1:-1, 1:-1] = ring1
    nb1 = (p1[:-2, 1:-1] | p1[2:, 1:-1] | p1[1:-1, :-2] | p1[1:-1, 2:])
    ring2 = mask & ~ring1 & nb1

    luma = (a[..., 0].astype(int) * 299 + a[..., 1].astype(int) * 587
            + a[..., 2].astype(int) * 114) // 1000
    for y in range(h):
        for x in range(w):
            if not mask[y, x]:
                continue
            if ring1[y, x]:
                a[y, x, 3] = nearest_alpha(int(luma[y, x]))
            elif ring2[y, x]:
                a[y, x, 3] = min(255, nearest_alpha(int(luma[y, x])) + RING2_ADD)
    return Image.fromarray(a, "RGBA")


def make(src_rel, dst_rel):
    src = Image.open(os.path.join(P, src_rel)).convert("RGBA")
    w, h = src.size
    n = h // 16
    dst = Image.new("RGBA", src.size, (0, 0, 0, 0))
    for f in range(n):
        dst.paste(paint(src.crop((0, f * 16, w, f * 16 + 16))), (0, f * 16))
    out = os.path.join(P, dst_rel)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    dst.save(out)
    print(f"{dst_rel}  {dst.size}  frames={n}")
    return dst


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    strip = make(r"textures\blocks\items\stone_star.png",
                 r"textures\blocks\items\stone_star_glow.png")
    icon = make(r"textures\items\treasures\stone_star.png",
                r"textures\items\treasures\stone_star_glow.png")

    # ---- preview: original vs glow, over a grass-like backdrop -------------
    rng = np.random.default_rng(7)
    bg = np.zeros((16 * 14 + 20, 16 * 2 + 30, 4), np.uint8)
    for y in range(bg.shape[0]):
        for x in range(bg.shape[1]):
            t = rng.integers(-14, 15)
            bg[y, x] = (86 + t, 122 + t, 58 + t // 2, 255)
    bgim = Image.fromarray(bg, "RGBA")
    bgim.alpha_composite(Image.open(os.path.join(P, r"textures\blocks\items\stone_star.png")).convert("RGBA"), (10, 10))
    bgim.alpha_composite(strip, (26, 10))
    S = 12
    bgim.resize((bgim.width * S, bgim.height * S), Image.NEAREST).save(
        os.path.join(OUT, "preview_strip.png"))
    print("preview_strip.png", bgim.size)

    side = Image.new("RGBA", (16 * 2 + 30, 40), (60, 62, 68, 255))
    side.alpha_composite(Image.open(os.path.join(P, r"textures\items\treasures\stone_star.png")).convert("RGBA"), (10, 12))
    side.alpha_composite(icon, (26, 12))
    side.resize((side.width * 18, side.height * 18), Image.NEAREST).save(
        os.path.join(OUT, "preview_icon.png"))
    print("preview_icon.png", side.size)
