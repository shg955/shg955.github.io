"""갤러리 원본 사진 -> 웹 배포용 WebP 변환.

- EXIF 회전 정보를 픽셀에 반영한 뒤 전체 메타데이터(GPS 포함) 제거
용도별로 3단계를 만든다.
- thumb: 그리드용. 방향별 센터 크롭
    · 세로/정사각 원본 -> 4:5  (그리드 1칸)
    · 가로 원본        -> 8:5  (그리드 2칸 full-width, 좌우 잘림 방지)
- hero : 커버 슬라이드쇼용. 표시 크기에 맞춘 중간 해상도
- full : 확대 뷰어용. 핀치 줌 여유를 둔 고화질

축소하면 원본의 선명함이 죽으므로 리사이즈 직후 언샤프 마스크를 건다.
gallery/manifest.json 에 config.js 로 옮길 목록을 함께 출력하며,
기존 manifest가 있으면 그 노출 순서를 유지한다.

사용법:
    python tools/optimize_images.py
"""

import json
import re
import sys
from pathlib import Path

from PIL import Image, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "assets" / "images"
OUT_DIR = SRC_DIR / "gallery"

THUMB_PORTRAIT = (720, 900)    # 4:5, 모바일 2열 @DPR3 기준
THUMB_LANDSCAPE = (1280, 800)  # 8:5, 2칸 span 기준
THUMB_QUALITY = 85

HERO_LONG_EDGE = 1800          # 커버 표시 폭(모바일 @DPR3 약 1100px)에 맞춤
HERO_QUALITY = 88

FULL_LONG_EDGE = 2200          # 확대 뷰어 + 핀치 줌 여유
FULL_QUALITY = 90

# 축소 후 잃은 선명도를 되살린다. 과하면 윤곽에 흰 테가 생기므로 약하게.
SHARPEN = ImageFilter.UnsharpMask(radius=1.0, percent=55, threshold=3)


def natural_key(path: Path):
    """'gallery- (2).jpg' 가 'gallery- (10).jpg' 보다 앞에 오도록 정렬."""
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", path.name)]


def load_clean(path: Path) -> Image.Image:
    """EXIF 회전을 적용하고 메타데이터가 없는 RGB 이미지를 반환."""
    with Image.open(path) as im:
        im = ImageOps.exif_transpose(im)
        im = im.convert("RGB")
        # 새 캔버스로 복사해 info(EXIF/ICC/GPS)를 완전히 떼어낸다
        clean = Image.new("RGB", im.size)
        clean.paste(im)
        return clean


def resize_long_edge(im: Image.Image, long_edge: int) -> Image.Image:
    w, h = im.size
    if max(w, h) <= long_edge:
        return im.copy()
    scale = long_edge / max(w, h)
    resized = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
    return resized.filter(SHARPEN)


def saved_order(manifest_path: Path) -> list:
    """기존 manifest의 노출 순서를 읽어둔다. 재변환해도 순서가 초기화되지 않도록."""
    if not manifest_path.exists():
        return []
    try:
        return [e["id"] for e in json.loads(manifest_path.read_text(encoding="utf-8"))]
    except (ValueError, KeyError):
        return []


def mb(num_bytes: int) -> float:
    return num_bytes / (1024 * 1024)


def main() -> int:
    sources = sorted(SRC_DIR.glob("gallery- (*).jpg"), key=natural_key)
    if not sources:
        print(f"[!] 원본을 찾지 못했습니다: {SRC_DIR}")
        return 1

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    src_total = 0
    out_total = 0
    manifest = []

    for idx, src in enumerate(sources, start=1):
        stem = f"g{idx:02d}"
        img = load_clean(src)
        landscape = img.size[0] > img.size[1]

        full = resize_long_edge(img, FULL_LONG_EDGE)
        full_path = OUT_DIR / f"{stem}.webp"
        full.save(full_path, "WEBP", quality=FULL_QUALITY, method=6)

        hero = resize_long_edge(img, HERO_LONG_EDGE)
        hero_path = OUT_DIR / f"{stem}-hero.webp"
        hero.save(hero_path, "WEBP", quality=HERO_QUALITY, method=6)

        # 인물이 보통 중앙보다 살짝 위에 오므로 세로 기준점을 0.4로 당긴다
        box = THUMB_LANDSCAPE if landscape else THUMB_PORTRAIT
        thumb = ImageOps.fit(img, box, Image.LANCZOS, centering=(0.5, 0.4)).filter(SHARPEN)
        thumb_path = OUT_DIR / f"{stem}-thumb.webp"
        thumb.save(thumb_path, "WEBP", quality=THUMB_QUALITY, method=6)

        s = src.stat().st_size
        f = full_path.stat().st_size
        e = hero_path.stat().st_size
        t = thumb_path.stat().st_size
        src_total += s
        out_total += f + e + t

        manifest.append({
            "id": stem,
            "source": src.name,
            "orientation": "landscape" if landscape else "portrait",
            "thumb": f"assets/images/gallery/{stem}-thumb.webp",
            "hero": f"assets/images/gallery/{stem}-hero.webp",
            "src": f"assets/images/gallery/{stem}.webp",
            "width": full.size[0],
            "height": full.size[1],
            "bytes": f + e + t,
        })

        print(
            f"{stem}  {src.name:<20} "
            f"{img.size[0]}x{img.size[1]} {mb(s):5.1f}MB  ->  "
            f"full {full.size[0]}x{full.size[1]} {f/1024:5.0f}KB + "
            f"hero {e/1024:4.0f}KB + thumb {t/1024:4.0f}KB"
            f"{'  [가로]' if landscape else ''}"
        )

    manifest_path = OUT_DIR / "manifest.json"

    # 기존 노출 순서를 유지하고, 새로 생긴 사진만 뒤에 붙인다
    order = saved_order(manifest_path)
    if order:
        rank = {gid: i for i, gid in enumerate(order)}
        manifest.sort(key=lambda entry: rank.get(entry["id"], len(rank)))

    manifest_path.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    print()
    print(f"원본 {len(sources)}장 : {mb(src_total):8.1f} MB")
    print(f"변환 결과      : {mb(out_total):8.1f} MB  ({len(sources)*2}개 파일)")
    print(f"감축률         : {100 * (1 - out_total / src_total):8.1f} %")
    print(f"매니페스트     : {manifest_path.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
