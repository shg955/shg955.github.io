"""manifest.json -> assets/js/config.js 의 gallery 배열 동기화.

사진을 추가/삭제/합성한 뒤 이 스크립트를 실행하면 config.js가 갱신된다.
기존 캡션은 src 경로 기준으로 찾아 보존한다.

사용법:
    python tools/sync_gallery_config.py
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "assets" / "images" / "gallery" / "manifest.json"
CONFIG = ROOT / "assets" / "js" / "config.js"

# manifest의 orientation -> app.js가 붙일 CSS 수식자
LAYOUT = {
    "portrait": None,        # 기본 4:5 한 칸
    "landscape": "wide",     # 가로: 전체 폭 8:5
    "tall": "tall",          # 세로 합성본: 전체 폭 1:2
}


def existing_captions(text: str) -> dict:
    """현재 config.js에서 src -> caption 매핑을 추출."""
    captions = {}
    block = re.search(r"gallery:\s*\[(.*?)\n  \]", text, re.S)
    if not block:
        return captions
    for item in re.finditer(
        r'\{[^}]*?src:\s*"([^"]+)"[^}]*?caption:\s*"([^"]*)"[^}]*?\}', block.group(1)
    ):
        captions[item.group(1)] = item.group(2)
    return captions


def build_array(manifest: list, captions: dict) -> str:
    lines = []
    for i, entry in enumerate(manifest, start=1):
        src = entry["src"]
        parts = [
            f'src: "{src}"',
            f'thumb: "{entry["thumb"]}"',
        ]
        if entry.get("hero"):
            parts.append(f'hero: "{entry["hero"]}"')
        parts.append(f'alt: "웨딩 사진 {i}"')
        layout = LAYOUT.get(entry["orientation"])
        if layout:
            parts.append(f'layout: "{layout}"')
        caption = captions.get(src, "")
        if caption:
            parts.append(f'caption: "{caption}"')
        lines.append("    { " + ", ".join(parts) + " }")
    return "  gallery: [\n" + ",\n".join(lines) + "\n  ],"


def main() -> int:
    if not MANIFEST.exists():
        print(f"[!] manifest가 없습니다: {MANIFEST}")
        return 1

    # manifest에 적힌 순서를 그대로 노출 순서로 쓴다 (id 정렬하지 않음)
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))

    text = CONFIG.read_text(encoding="utf-8")
    captions = existing_captions(text)

    new_block = build_array(manifest, captions)
    updated, count = re.subn(
        r"  gallery: \[.*?\n  \],", new_block, text, count=1, flags=re.S
    )
    if count != 1:
        print("[!] config.js에서 gallery 배열을 찾지 못했습니다.")
        return 1

    CONFIG.write_text(updated, encoding="utf-8")

    by_layout = {}
    for e in manifest:
        by_layout[e["orientation"]] = by_layout.get(e["orientation"], 0) + 1

    print(f"config.js gallery 갱신: {len(manifest)}장")
    for k, v in sorted(by_layout.items()):
        print(f"  {k:<10} {v}장  -> layout: {LAYOUT.get(k) or '(기본)'}")
    if captions:
        print(f"  캡션 보존: {len(captions)}건")
    return 0


if __name__ == "__main__":
    sys.exit(main())
