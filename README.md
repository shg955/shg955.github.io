# mobile-letter

GitHub Pages로 바로 배포 가능한 모바일 청첩장 템플릿입니다.

## 포함 기능
- 모바일 우선 레이아웃
- 수신자 개인화 문구 (`?to=홍길동&group=friends`)
- D-day 카운트다운 + 예식 달력
- 갤러리(확대 보기)
- 연락처 원터치(전화/문자)
- 계좌 토글 + 복사
- 링크 공유

## 폴더 구조
```text
.
├─ index.html
├─ assets/
│  ├─ css/styles.css
│  ├─ js/config.js
│  ├─ js/app.js
│  └─ images/
├─ 모바일청첩장_기획서.md
└─ README.md
```

## 빠른 커스터마이징
1. `assets/js/config.js`에서 이름/일시/장소/연락처/계좌를 수정합니다.
2. `assets/images/hero.svg`, `assets/images/gallery-*.svg`를 실제 사진으로 교체합니다.
3. 필요하면 `assets/css/styles.css` 색상 변수(`:root`)를 브랜드 톤으로 조정합니다.

## 로컬 미리보기
정적 파일 서버로 확인하면 가장 정확합니다.

```powershell
# Python이 설치되어 있다면
python -m http.server 5500
```

브라우저에서 `http://localhost:5500` 접속.

## GitHub Pages 배포
1. 이 폴더를 GitHub 저장소로 업로드합니다.
2. GitHub 저장소 `Settings > Pages`로 이동합니다.
3. `Build and deployment`에서 `Deploy from a branch` 선택.
4. Branch를 `main`, 폴더를 `/ (root)`로 선택 후 저장.
5. 배포 URL 접속:
- 사용자 사이트: `https://<username>.github.io`
- 프로젝트 사이트: `https://<username>.github.io/<repo-name>/`

## 자동 배포 워크플로
- `.github/workflows/deploy-pages.yml`이 포함되어 있습니다.
- `main` 브랜치에 push하면 GitHub Actions가 Pages를 자동 배포합니다.
- 이 방식을 사용할 경우 `Settings > Pages`에서 Source를 `GitHub Actions`로 변경하세요.

## 개인화 링크 예시
- 기본: `https://<username>.github.io/<repo-name>/`
- 친구용: `https://<username>.github.io/<repo-name>/?to=민지&group=friends`
- 회사용: `https://<username>.github.io/<repo-name>/?to=OOO&group=company`

## 참고
- GitHub Pages 문서: https://docs.github.com/en/pages
