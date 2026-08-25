window.INVITATION_CONFIG = {
  couple: {
    groom: "신홍기",
    bride: "한효경",
    groomParents: {
      father: "신현호",
      mother: "남희엽"
    },
    brideParents: {
      father: "한상훈",
      mother: "이수희"
    }
  },
  wedding: {
    isoDateTime: "2026-10-17T12:00:00+09:00",
    dateText: "2026년 10월 17일 토요일",
    entryWindowLabel: "입장 {{ENTRY_WINDOW}}",
    entryEndShort: "14:30",
    endTimeLabel: "오후 2시 30분",
    startByType: {
      "1": { hour24: 12, label: "오후 12시 30분", short: "12:30" },
      "2": { hour24: 13, label: "오후 1시 30분", short: "13:30" }
    },
    dateLabel: "2026년 10월 17일 토요일 오후 12시 30분 (입장 12:30 ~ 14:30)",
    venueName: "서울 세빛섬 채빛퀴진",
    address: "서울 서초구 올림픽대로 2085-14",
    heroMeta: "2026년 10월 17일 토요일 오후 12시 30분 · 채빛퀴진",
    transportGuide: "",//"입장 가능 시간: {{ENTRY_WINDOW}} (입장 시작 {{START_SHORT}})",
    transportDetails: [
      {
        icon: "📍",
        title: "지하철",
        lines: [
          "3, 7, 9호선 고속터미널역 8-1번 출구, 약 650m (도보 약 15분)"
        ]
      },
      {
        icon: "🚌",
        title: "버스",
        lines: [
          "반포한강공원 정류장(22404, 22405): 간선 405, 740",
          "반포대교 남단 한강시민공원입구(22381, 22382): 간선 143, 401, 406",
          "고속터미널 정류장(22019, 22020): 간선 142, 143, 148, 360, 362, 401, 452, 540, 640, 643"
        ]
      },
      {
        icon: "🚗",
        title: "자동차",
        lines: [
          "내비게이션에서 '세빛섬주차장' 또는 '반포한강공원 2주차장' 검색",
          "주소: 서울특별시 서초구 올림픽대로 2085-14 (반포동)"
        ]
      }
    ],
    notes: [
      "본식은 별도로 진행하지 않고 피로연으로만 진행됩니다.",
      //"{{ENTRY_WINDOW}} 사이 편하신 시간에 자유롭게 오시면 됩니다."
    ],
    // 카카오 지도를 못 쓸 때 대신 보여줄 약도 (종이 시안과 동일한 이미지)
    staticMapImage: "assets/images/map-sebit-minimal-bw.webp",
    // 지정해두면 주소 검색(Geocoder) 없이 바로 이 좌표에 지도를 그린다.
    // 카카오 로컬 API가 반환한 "채빛퀴진" POI 좌표 (세빛섬 중 채빛섬).
    coords: { lat: 37.5125480, lng: 126.9958195 },
    mapLinks: {
      primary: "https://naver.me/xq3auZHs",
      secondary: "https://map.kakao.com/link/search/%EC%B1%84%EB%B9%9B%ED%80%B4%EC%A7%84"
    }
  },
  kakao: {
    javascriptKey: "03707c766f7ac402cc09da4086b3f41f",
    mapLevel: 4
  },
  message: {
    defaultGreeting: "소중한 분을 정중히 초대합니다.",
    defaultBody: "두 사람이 함께하는 시작의 순간에\n귀한 걸음으로 함께해 주시면 감사하겠습니다.\n\n본식은 별도로 진행하지 않으며,\n피로연으로 감사 인사를 전합니다.",
    groupGreeting: {
      company: "귀한 인연에 감사드리며 초대드립니다.",
      friends: "저희의 새로운 시작을 함께 축하해 주세요.",
      family: "가족의 따뜻한 축복을 기다립니다."
    }
  },
  contacts: [
    { role: "신랑", name: "신홍기", phone: "010-5628-5244" },
    { role: "신부", name: "한효경", phone: "010-2394-3150" }
  ],
  accounts: [
    {
      side: "신랑측",
      entries: [
        { role: "신랑", holder: "신홍기", bank: "국민은행", number: "163202-04-167659" },
        { role: "아버지", holder: "신현호", bank: "하나은행", number: "2398-905933-1007" },
        { role: "어머니", holder: "남희엽", bank: "국민은행", number: "228001-04-038163" }
      ]
    },
    {
      side: "신부측",
      entries: [
        { role: "신부", holder: "한효경", bank: "하나은행", number: "244-910027-09305" },
        { role: "아버지", holder: "한상훈", bank: "하나은행", number: "244-910027-09305" },
        { role: "어머니", holder: "이수희", bank: "하나은행", number: "244-910027-09305" }
      ]
    }
  ],
  hero: {
    // 커버에서 순환할 사진. 비워두면 gallery 전체를 순서대로 사용.
    // 직접 고르려면 예: images: ["assets/images/gallery/g13.webp", ...]
    images: [],
    maxImages: 0,       // 0 = 제한 없음 (갤러리 전체)
    intervalMs: 5000,   // 사진 유지 시간
    fadeMs: 1200        // 교차 전환 시간
  },
  gallery: [
    { src: "assets/images/gallery/g19.webp", thumb: "assets/images/gallery/g19-thumb.webp", hero: "assets/images/gallery/g19-hero.webp", alt: "웨딩 사진 1" },
    { src: "assets/images/gallery/g10.webp", thumb: "assets/images/gallery/g10-thumb.webp", hero: "assets/images/gallery/g10-hero.webp", alt: "웨딩 사진 2" },
    { src: "assets/images/gallery/g12.webp", thumb: "assets/images/gallery/g12-thumb.webp", hero: "assets/images/gallery/g12-hero.webp", alt: "웨딩 사진 3" },
    { src: "assets/images/gallery/g13.webp", thumb: "assets/images/gallery/g13-thumb.webp", hero: "assets/images/gallery/g13-hero.webp", alt: "웨딩 사진 4" },
    { src: "assets/images/gallery/g14.webp", thumb: "assets/images/gallery/g14-thumb.webp", hero: "assets/images/gallery/g14-hero.webp", alt: "웨딩 사진 5" },
    { src: "assets/images/gallery/g15.webp", thumb: "assets/images/gallery/g15-thumb.webp", hero: "assets/images/gallery/g15-hero.webp", alt: "웨딩 사진 6" },
    { src: "assets/images/gallery/g16.webp", thumb: "assets/images/gallery/g16-thumb.webp", hero: "assets/images/gallery/g16-hero.webp", alt: "웨딩 사진 7" },
    { src: "assets/images/gallery/g17.webp", thumb: "assets/images/gallery/g17-thumb.webp", hero: "assets/images/gallery/g17-hero.webp", alt: "웨딩 사진 8" },
    { src: "assets/images/gallery/g18.webp", thumb: "assets/images/gallery/g18-thumb.webp", hero: "assets/images/gallery/g18-hero.webp", alt: "웨딩 사진 9" },
    { src: "assets/images/gallery/g20.webp", thumb: "assets/images/gallery/g20-thumb.webp", hero: "assets/images/gallery/g20-hero.webp", alt: "웨딩 사진 10" },
    { src: "assets/images/gallery/g21.webp", thumb: "assets/images/gallery/g21-thumb.webp", hero: "assets/images/gallery/g21-hero.webp", alt: "웨딩 사진 11" },
    { src: "assets/images/gallery/g22.webp", thumb: "assets/images/gallery/g22-thumb.webp", hero: "assets/images/gallery/g22-hero.webp", alt: "웨딩 사진 12" },
    { src: "assets/images/gallery/g23.webp", thumb: "assets/images/gallery/g23-thumb.webp", hero: "assets/images/gallery/g23-hero.webp", alt: "웨딩 사진 13", layout: "wide" },
    { src: "assets/images/gallery/g26.webp", thumb: "assets/images/gallery/g26-thumb.webp", hero: "assets/images/gallery/g26-hero.webp", alt: "웨딩 사진 14" },
    { src: "assets/images/gallery/g03.webp", thumb: "assets/images/gallery/g03-thumb.webp", hero: "assets/images/gallery/g03-hero.webp", alt: "웨딩 사진 15" },
    { src: "assets/images/gallery/g11.webp", thumb: "assets/images/gallery/g11-thumb.webp", hero: "assets/images/gallery/g11-hero.webp", alt: "웨딩 사진 16" },
    { src: "assets/images/gallery/g01.webp", thumb: "assets/images/gallery/g01-thumb.webp", hero: "assets/images/gallery/g01-hero.webp", alt: "웨딩 사진 17" },
    { src: "assets/images/gallery/g02.webp", thumb: "assets/images/gallery/g02-thumb.webp", hero: "assets/images/gallery/g02-hero.webp", alt: "웨딩 사진 18" },
    { src: "assets/images/gallery/g04.webp", thumb: "assets/images/gallery/g04-thumb.webp", hero: "assets/images/gallery/g04-hero.webp", alt: "웨딩 사진 19" },
    { src: "assets/images/gallery/g05-07.webp", thumb: "assets/images/gallery/g05-07-thumb.webp", hero: "assets/images/gallery/g05-07-hero.webp", alt: "웨딩 사진 20", layout: "tall" },
    { src: "assets/images/gallery/g08.webp", thumb: "assets/images/gallery/g08-thumb.webp", hero: "assets/images/gallery/g08-hero.webp", alt: "웨딩 사진 21" },
    { src: "assets/images/gallery/g09.webp", thumb: "assets/images/gallery/g09-thumb.webp", hero: "assets/images/gallery/g09-hero.webp", alt: "웨딩 사진 22", layout: "wide" }
  ],
  share: {
    // 카카오 공유 썸네일. 규격: 400x400~800x800, 비율 2:1~3:4, 500KB 이하, SVG 불가
    imageUrl: "assets/images/share-thumb.jpg",
    smsText: "모바일 청첩장을 전해드립니다. 참석하셔서 자리를 빛내 주세요.",
    kakaoTitle: "홍기 · 효경 결혼식에 초대합니다",
    kakaoDescription: "2026년 10월 17일 토요일 오후 12시 30분 · 서울 세빛섬 채빛퀴진"
  },
  footer: "홍기 · 효경 결혼식에 초대합니다."
};
