"""약도 PNG -> 웹 배포용 경량 이미지 변환.

원본(4762x2980, 12MB)은 인쇄용(PSD 300dpi)으로 로컬에 남겨두고,
종이 시안 HTML 프리뷰에서 쓸 웹 버전만 생성한다.

PNG 팔레트 축소본과 WebP를 모두 만들어 크기를 비교한다.

사용법:
    python tools/optimize_map.py
"""

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "images" / "map-sebit-minimal-bw.png"
OUT_DIR = ROOT / "assets" / "images"

TARGET_WIDTH = 1600  # 시안 프리뷰 표시 폭 기준 충분


def kb(path: Path) -> float:
    return path.stat().st_size / 1024


def main() -> int:
    if not SRC.exists():
        print(f"[!] 원본이 없습니다: {SRC}")
        return 1

    with Image.open(SRC) as im:
        im = im.convert("RGB")
        src_size = im.size
        scale = TARGET_WIDTH / im.size[0]
        resized = im.resize(
            (TARGET_WIDTH, round(im.size[1] * scale)), Image.LANCZOS
        )

    webp_path = OUT_DIR / "map-sebit-minimal-bw.webp"
    resized.save(webp_path, "WEBP", quality=88, method=6)

    # 흑백 약도는 색 수가 적어 팔레트 축소가 잘 먹는다
    png_path = OUT_DIR / "map-sebit-minimal-bw-web.png"
    resized.quantize(colors=64, method=Image.MEDIANCUT, dither=Image.FLOYDSTEINBERG).save(
        png_path, "PNG", optimize=True
    )

    print(f"원본       {src_size[0]}x{src_size[1]}  {kb(SRC)/1024:.1f} MB")
    print(f"WebP       {resized.size[0]}x{resized.size[1]}  {kb(webp_path):.0f} KB  -> {webp_path.name}")
    print(f"PNG(64색)  {resized.size[0]}x{resized.size[1]}  {kb(png_path):.0f} KB  -> {png_path.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
