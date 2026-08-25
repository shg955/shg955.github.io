"""여러 원본 사진을 세로로 이어붙여 한 장으로 합성한다.

같은 비율의 사진들을 위->아래 순서로 쌓는다. 비율이 다르면
가장 좁은 폭에 맞춰 폭을 통일하고 높이는 비율대로 유지한다.

사용법:
    python tools/make_stack.py 5 6 7 --out g05-07
    python tools/make_stack.py 5 6 7 --out g05-07 --gap 24        # 흰 여백 삽입
    python tools/make_stack.py 5 6 7 --out g05-07 --gap 24 --bg "#ffffff"
"""

import argparse
import json
import sys
from pathlib import Path

from PIL import Image, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "assets" / "images"
OUT_DIR = SRC_DIR / "gallery"

OUT_WIDTH = 1500       # 합성 결과 폭 (확대 뷰어용)
HERO_WIDTH = 1100      # 커버 슬라이드쇼용
THUMB_WIDTH = 700      # 썸네일 폭 (전체 비율 유지)
FULL_QUALITY = 90
HERO_QUALITY = 88
THUMB_QUALITY = 85

SHARPEN = ImageFilter.UnsharpMask(radius=1.0, percent=55, threshold=3)


def load_clean(path: Path) -> Image.Image:
    """EXIF 회전을 적용하고 메타데이터가 없는 RGB 이미지를 반환."""
    with Image.open(path) as im:
        im = ImageOps.exif_transpose(im)
        im = im.convert("RGB")
        clean = Image.new("RGB", im.size)
        clean.paste(im)
        return clean


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("indexes", nargs="+", type=int, help="원본 번호 (위->아래 순서)")
    ap.add_argument("--out", required=True, help="출력 파일명 (확장자 제외)")
    ap.add_argument("--gap", type=int, default=0, help="사진 사이 여백 px (합성 폭 1200 기준)")
    ap.add_argument("--bg", default="#ffffff", help="여백 색상")
    args = ap.parse_args()

    sources = [SRC_DIR / f"gallery- ({i}).jpg" for i in args.indexes]
    missing = [p.name for p in sources if not p.exists()]
    if missing:
        print(f"[!] 원본을 찾지 못했습니다: {', '.join(missing)}")
        return 1

    images = [load_clean(p) for p in sources]

    # 폭을 OUT_WIDTH로 통일하고 높이는 원본 비율 유지
    scaled = []
    for im in images:
        h = round(im.size[1] * OUT_WIDTH / im.size[0])
        scaled.append(im.resize((OUT_WIDTH, h), Image.LANCZOS).filter(SHARPEN))

    total_h = sum(im.size[1] for im in scaled) + args.gap * (len(scaled) - 1)
    canvas = Image.new("RGB", (OUT_WIDTH, total_h), args.bg)

    y = 0
    for im in scaled:
        canvas.paste(im, (0, y))
        y += im.size[1] + args.gap

    full_path = OUT_DIR / f"{args.out}.webp"
    canvas.save(full_path, "WEBP", quality=FULL_QUALITY, method=6)

    def downscale(width, quality, suffix):
        h = round(total_h * width / OUT_WIDTH)
        out = canvas.resize((width, h), Image.LANCZOS).filter(SHARPEN)
        path = OUT_DIR / f"{args.out}{suffix}.webp"
        out.save(path, "WEBP", quality=quality, method=6)
        return out, path

    hero, hero_path = downscale(HERO_WIDTH, HERO_QUALITY, "-hero")
    thumb, thumb_path = downscale(THUMB_WIDTH, THUMB_QUALITY, "-thumb")

    ratio = OUT_WIDTH / total_h
    print(f"합성 대상 : {', '.join(p.name for p in sources)}")
    for i, im in zip(args.indexes, scaled):
        print(f"  gallery- ({i})  ->  {im.size[0]}x{im.size[1]}")
    print()
    for label, img, path in (
        ("full ", canvas, full_path),
        ("hero ", hero, hero_path),
        ("thumb", thumb, thumb_path),
    ):
        print(f"{label}  {img.size[0]}x{img.size[1]}  "
              f"{path.stat().st_size/1024:6.0f} KB  -> {path.name}")
    print(f"비율   {ratio:.3f}  (1 : {1/ratio:.2f} 세로 긴 형태)")

    # manifest.json 갱신: 합성본 추가, 재료로 쓰인 개별 사진 제거
    manifest_path = OUT_DIR / "manifest.json"
    if manifest_path.exists():
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        used = {f"g{i:02d}" for i in args.indexes}

        # 재료 중 가장 앞에 있던 자리에 합성본을 끼워넣어 노출 순서를 지킨다
        slot = next((i for i, m in enumerate(manifest) if m["id"] in used), len(manifest))
        entry = {
            "id": args.out,
            "source": [p.name for p in sources],
            "orientation": "tall",
            "thumb": f"assets/images/gallery/{args.out}-thumb.webp",
            "hero": f"assets/images/gallery/{args.out}-hero.webp",
            "src": f"assets/images/gallery/{args.out}.webp",
            "width": canvas.size[0],
            "height": canvas.size[1],
            "bytes": sum(p.stat().st_size for p in (full_path, hero_path, thumb_path)),
        }
        manifest = [m for m in manifest if m["id"] not in used]
        manifest.insert(min(slot, len(manifest)), entry)

        manifest_path.write_text(
            json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        print(f"매니페스트 갱신 : {args.out} 추가, {', '.join(sorted(used))} 제거")

    return 0


if __name__ == "__main__":
    sys.exit(main())
