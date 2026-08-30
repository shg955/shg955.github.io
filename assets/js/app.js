(function () {
  const config = window.INVITATION_CONFIG;

  if (!config) {
    return;
  }

  const $ = (selector) => document.querySelector(selector);
  const params = new URLSearchParams(window.location.search);

  const guestName = (params.get("to") || "").trim();
  const group = (params.get("group") || "").trim().toLowerCase();
  const invitationType = (params.get("type") || "1").trim() === "2" ? "2" : "1";

  function setText(selector, value) {
    const el = $(selector);
    if (el) {
      el.textContent = value;
    }
  }

  function setFeedback(message) {
    const feedback = $("#shareFeedback");
    if (!feedback) {
      return;
    }
    feedback.textContent = message;
    window.setTimeout(function () {
      feedback.textContent = "";
    }, 2400);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise(function (resolve, reject) {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      try {
        const ok = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (ok) {
          resolve();
        } else {
          reject(new Error("copy failed"));
        }
      } catch (error) {
        document.body.removeChild(textarea);
        reject(error);
      }
    });
  }

  function loadExternalScript(src, id) {
    return new Promise(function (resolve, reject) {
      if (id) {
        const existing = document.getElementById(id);
        if (existing) {
          resolve();
          return;
        }
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      if (id) {
        script.id = id;
      }

      script.onload = function () {
        resolve();
      };
      script.onerror = function () {
        reject(new Error("script load failed: " + src));
      };

      document.head.appendChild(script);
    });
  }

  function disableButton(btn, label) {
    if (!btn) {
      return;
    }
    btn.disabled = true;
    btn.classList.add("is-disabled");
    if (label) {
      btn.textContent = label;
    }
  }

  function getTypeStartConfig() {
    const byType = (config.wedding && config.wedding.startByType) || {};
    return (
      byType[invitationType] ||
      byType["1"] || { hour24: 12, label: "오전 12시 00분", short: "12:00" }
    );
  }

  function getDateText() {
    return config.wedding.dateText || "2026년 10월 17일 토요일";
  }

  function getEntryEndShort() {
    return config.wedding.entryEndShort || "14:30";
  }

  function getEntryWindowShort() {
    const start = getTypeStartConfig();
    return start.short + " ~ " + getEntryEndShort();
  }

  function resolveDynamicText(text) {
    if (typeof text !== "string") {
      return "";
    }

    const start = getTypeStartConfig();
    return text
      .split("{{ENTRY_WINDOW}}").join(getEntryWindowShort())
      .split("{{START_SHORT}}").join(start.short);
  }

  function getEntryWindowLabel() {
    return resolveDynamicText(config.wedding.entryWindowLabel || "입장 {{ENTRY_WINDOW}}");
  }

  function getHeroMetaText() {
    const start = getTypeStartConfig();
    return getDateText() + " " + start.label + " · " + config.wedding.venueName;
  }

  function getWeddingDateLabel() {
    const start = getTypeStartConfig();
    return getDateText() + " " + start.label + "\n(" + getEntryWindowLabel() + ")";
  }

  function getScheduleNotes() {
    const start = getTypeStartConfig();
    const notes = [
      "예식일: " + getDateText(),
      "시간: " + start.label
    ];

    (config.wedding.notes || []).forEach(function (note) {
      notes.push(resolveDynamicText(note));
    });

    return notes;
  }

  function getShareDescription() {
    const byType = config.share && config.share.kakaoDescriptionByType;
    if (byType && byType[invitationType]) {
      return resolveDynamicText(byType[invitationType]);
    }
    if (config.share && config.share.kakaoDescription) {
      return resolveDynamicText(config.share.kakaoDescription);
    }
    return resolveDynamicText(getHeroMetaText());
  }

  function renderHeroMeta() {
    const el = $("#heroMeta");
    if (!el) {
      return;
    }

    // 한 문장으로 두면 폭에 따라 아무 데서나 끊기므로 줄을 직접 나눈다
    const start = getTypeStartConfig();
    const lines = [getDateText(), start.label, config.wedding.venueName];

    el.innerHTML = "";
    lines.filter(Boolean).forEach(function (line) {
      const span = document.createElement("span");
      span.className = "meta-line";
      span.textContent = line;
      el.appendChild(span);
    });
  }

  function renderHeader() {
    setText("#groomName", config.couple.groom);
    setText("#brideName", config.couple.bride);
    renderHeroMeta();
    setText("#footerText", config.footer);
  }

  function getHeroImages() {
    const hero = config.hero || {};

    if (Array.isArray(hero.images) && hero.images.length) {
      return hero.images.slice();
    }

    // 지정이 없으면 갤러리 사진을 전부 쓴다.
    // contain으로 넣어 잘리는 곳이 없으므로 가로/합성 사진도 그대로 포함한다.
    const picked = config.gallery || [];

    // maxImages가 0이거나 없으면 제한 없음
    const max = hero.maxImages || 0;
    return (max > 0 ? picked.slice(0, max) : picked).map(function (item) {
      // 커버는 표시 크기에 맞춘 중간 해상도를 쓴다. 확대 뷰어용 원본은 과하다.
      return item.hero || item.src;
    });
  }

  function setHeroLayer(layer, src) {
    // 한 겹은 흐린 배경용, 한 겹은 실제 사진용. 같은 파일이라 요청은 한 번만 나간다.
    const blur = layer.querySelector(".hero-blur");
    const photo = layer.querySelector(".hero-photo");
    if (blur) {
      blur.src = src;
    }
    if (photo) {
      photo.src = src;
    }
  }

  function initHeroSlideshow() {
    const front = $("#heroLayerA");
    const back = $("#heroLayerB");

    if (!front || !back) {
      return;
    }

    const images = getHeroImages();
    if (!images.length) {
      return;
    }

    const hero = config.hero || {};
    const intervalMs = hero.intervalMs || 5000;
    const fadeMs = hero.fadeMs || 1200;

    setHeroLayer(front, images[0]);
    front.classList.add("is-active");

    const reduceMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // 사진이 한 장뿐이거나 사용자가 모션 최소화를 켜두었으면 첫 장으로 고정
    if (images.length < 2 || reduceMotion) {
      return;
    }

    let layers = { shown: front, hidden: back };
    let index = 0;
    let timer = null;

    [front, back].forEach(function (el) {
      el.style.transitionDuration = fadeMs + "ms";
    });

    // 다음 사진은 숨은 레이어에 미리 받아둬 전환 시 깜빡임을 막는다
    setHeroLayer(layers.hidden, images[1]);

    function step() {
      index = (index + 1) % images.length;

      layers.hidden.classList.add("is-active");
      layers.shown.classList.remove("is-active");
      layers = { shown: layers.hidden, hidden: layers.shown };

      // 페이드가 끝난 뒤(= 완전히 가려진 뒤)에 다음 사진을 채운다
      window.setTimeout(function () {
        setHeroLayer(layers.hidden, images[(index + 1) % images.length]);
      }, fadeMs);
    }

    function start() {
      if (!timer) {
        timer = window.setInterval(step, intervalMs);
      }
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    // 탭이 가려져 있는 동안은 돌리지 않는다 (데이터/배터리 절약)
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    });

    start();
  }

  function renderMessage() {
    const greetingBase = config.message.groupGreeting[group] || config.message.defaultGreeting;
    const greeting = guestName ? guestName + "님, " + greetingBase : greetingBase;

    setText("#guestGreeting", greeting);
    setText("#invitationMessage", config.message.defaultBody);
    renderFamilyLines();
  }

  function renderFamilyLines() {
    const wrap = $("#familyLines");
    if (!wrap) {
      return;
    }

    const groomParents = config.couple.groomParents || {};
    const brideParents = config.couple.brideParents || {};

    const groomLine = [groomParents.father, groomParents.mother].filter(Boolean).join(" · ");
    const brideLine = [brideParents.father, brideParents.mother].filter(Boolean).join(" · ");

    const lines = [];
    if (groomLine && config.couple.groom) {
      lines.push(groomLine + "의 아들 " + config.couple.groom);
    }
    if (brideLine && config.couple.bride) {
      lines.push(brideLine + "의 딸 " + config.couple.bride);
    }

    wrap.innerHTML = "";
    lines.forEach(function (line) {
      const p = document.createElement("p");
      p.className = "family-line";
      p.textContent = line;
      wrap.appendChild(p);
    });
  }

  function renderSchedule() {
    const weddingDateEl = $("#weddingDateText");
    if (weddingDateEl) {
      weddingDateEl.innerHTML = getWeddingDateLabel().replace(/\n/g, "<br>");
    }

    const notesEl = $("#scheduleNotes");
    if (notesEl) {
      notesEl.innerHTML = "";
      getScheduleNotes().forEach(function (note) {
        const li = document.createElement("li");
        li.textContent = note;
        notesEl.appendChild(li);
      });
    }

    const targetDate = new Date(config.wedding.isoDateTime);
    const start = getTypeStartConfig();
    if (typeof start.hour24 === "number") {
      targetDate.setHours(start.hour24, 0, 0, 0);
    }

    renderCalendar(targetDate);

    // 일시 카드를 뺀 구성에서는 D-day 요소가 없으므로 타이머도 걸지 않는다
    if ($("#countdown")) {
      updateCountdown(targetDate);
      setInterval(function () {
        updateCountdown(targetDate);
      }, 60000);
    }
  }

  function updateCountdown(targetDate) {
    const diffMs = targetDate.getTime() - Date.now();
    const countdownEl = $("#countdown");

    if (!countdownEl) {
      return;
    }

    const absMs = Math.abs(diffMs);
    const days = Math.floor(absMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((absMs / (1000 * 60 * 60)) % 24);

    if (diffMs >= 0) {
      countdownEl.textContent = "D-" + days;
    } else {
      countdownEl.textContent = "D+" + days;
    }
  }

  function renderCalendar(targetDate) {
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const targetDay = targetDate.getDate();

    // getDay()가 일요일=0이므로 그대로 쓰면 일요일 시작이 된다
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    const weekDays = ["일", "월", "화", "수", "목", "금", "토"];
    const calendarEl = $("#calendar");

    if (!calendarEl) {
      return;
    }

    // 일요일 시작 기준 인덱스(0~6)에서 일/토를 가려낸다
    function weekendClass(dayIndex) {
      if (dayIndex === 0) {
        return " is-sun";
      }
      if (dayIndex === 6) {
        return " is-sat";
      }
      return "";
    }

    const cells = [];

    weekDays.forEach(function (w, i) {
      cells.push('<div class="weekday' + weekendClass(i) + '">' + w + "</div>");
    });

    for (let i = 0; i < firstDay; i += 1) {
      cells.push('<div class="day empty">.</div>');
    }

    for (let d = 1; d <= lastDate; d += 1) {
      const cls = d === targetDay ? "day target" : "day";
      cells.push(
        '<div class="' + cls + weekendClass((firstDay + d - 1) % 7) + '">' + d + "</div>"
      );
    }

    calendarEl.innerHTML =
      '<div class="calendar-header">' +
      year +
      "년 " +
      (month + 1) +
      "월</div>" +
      '<div class="calendar-grid">' +
      cells.join("") +
      "</div>";
  }

  function renderLocation() {
    setText("#venueName", config.wedding.venueName);
    setText("#venueAddress", config.wedding.address);
    // 문구를 비워두면 빈 문단이 여백만 차지하므로 아예 숨긴다
    const guideText = resolveDynamicText(config.wedding.transportGuide);
    const guideEl = $("#transportGuide");
    if (guideEl) {
      guideEl.textContent = guideText;
      guideEl.style.display = guideText ? "" : "none";
    }

    const primary = $("#mapPrimary");
    const secondary = $("#mapSecondary");

    if (primary) {
      primary.href = config.wedding.mapLinks.primary;
    }
    if (secondary) {
      secondary.href = config.wedding.mapLinks.secondary;
    }

    renderTransportDetails();
  }

  function renderTransportDetails() {
    const wrap = $("#transportDetails");
    const sections = config.wedding.transportDetails || [];

    if (!wrap) {
      return;
    }

    wrap.innerHTML = "";

    sections.forEach(function (section) {
      const sectionEl = document.createElement("section");
      sectionEl.className = "transport-section";

      const titleEl = document.createElement("h4");
      titleEl.className = "transport-title";
      titleEl.textContent = (section.icon ? section.icon + " " : "") + section.title;
      sectionEl.appendChild(titleEl);

      (section.lines || []).forEach(function (line) {
        const lineEl = document.createElement("p");
        lineEl.className = "transport-line";
        lineEl.textContent = line;
        sectionEl.appendChild(lineEl);
      });

      wrap.appendChild(sectionEl);
    });
  }

  function renderGallery() {
    const grid = $("#galleryGrid");
    if (!grid) {
      return;
    }

    config.gallery.forEach(function (item, idx) {
      const figure = document.createElement("figure");
      figure.className = "gallery-item reveal";
      if (item.layout) {
        figure.classList.add("is-" + item.layout);
      }
      // 행 단위로만 순차 등장시킨다 (사진이 많아도 지연이 누적되지 않도록)
      figure.style.transitionDelay = (idx % 4) * 65 + "ms";

      const img = document.createElement("img");
      img.loading = "lazy";
      img.decoding = "async";
      img.src = item.thumb || item.src;
      img.alt = item.alt || "";
      img.dataset.index = String(idx);
      figure.appendChild(img);

      grid.appendChild(figure);
    });

    bindGalleryDialog();
  }

  function bindGalleryDialog() {
    const dialog = $("#galleryDialog");
    const dialogImage = $("#dialogImage");
    const dialogCaption = $("#dialogCaption");
    const closeBtn = $("#dialogClose");
    const prevBtn = $("#dialogPrev");
    const nextBtn = $("#dialogNext");

    if (!dialog || !dialogImage || !dialogCaption || !closeBtn || !prevBtn || !nextBtn) {
      return;
    }

    let current = 0;

    function renderDialogImage(index) {
      const item = config.gallery[index];
      dialogImage.src = item.src;
      dialogImage.alt = item.alt || "";
      // 캡션이 없으면 몇 번째 사진인지라도 보여준다
      dialogCaption.textContent =
        item.caption || index + 1 + " / " + config.gallery.length;
    }

    function openDialog(index) {
      current = index;
      renderDialogImage(current);
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      }
    }

    function closeDialog() {
      if (dialog.open) {
        dialog.close();
      }
    }

    function move(step) {
      current = (current + step + config.gallery.length) % config.gallery.length;
      renderDialogImage(current);
    }

    document.addEventListener("click", function (event) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      if (target.matches("#galleryGrid img")) {
        const idx = Number(target.dataset.index);
        openDialog(idx);
      }
    });

    closeBtn.addEventListener("click", closeDialog);
    prevBtn.addEventListener("click", function () {
      move(-1);
    });
    nextBtn.addEventListener("click", function () {
      move(1);
    });

    dialog.addEventListener("click", function (event) {
      const rect = dialog.getBoundingClientRect();
      const clickedInDialog =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;

      if (!clickedInDialog) {
        closeDialog();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (!dialog.open) {
        return;
      }
      if (event.key === "ArrowLeft") {
        move(-1);
      }
      if (event.key === "ArrowRight") {
        move(1);
      }
      if (event.key === "Escape") {
        closeDialog();
      }
    });
  }

  function renderContacts() {
    const wrap = $("#contactList");
    if (!wrap) {
      return;
    }

    config.contacts.forEach(function (person) {
      const phone = (person.phone || "").trim();
      const card = document.createElement("article");
      card.className = "card";

      if (phone) {
        card.innerHTML =
          "<h3>" +
          person.role +
          "</h3>" +
          "<p>" +
          person.name +
          "</p>" +
          '<div class="button-row">' +
          '<a class="btn btn-primary" href="tel:' +
          phone +
          '">전화하기</a>' +
          '<a class="btn btn-ghost" href="sms:' +
          phone +
          '">문자하기</a>' +
          "</div>";
      } else {
        card.innerHTML =
          "<h3>" +
          person.role +
          "</h3>" +
          "<p>" +
          person.name +
          '</p><p class="muted-text">연락처는 추후 업데이트 예정입니다.</p>';
      }

      wrap.appendChild(card);
    });
  }

  function renderAccounts() {
    const wrap = $("#accountsList");
    if (!wrap) {
      return;
    }

    (config.accounts || []).forEach(function (group, index) {
      const box = document.createElement("article");
      box.className = "account";

      const head = document.createElement("div");
      head.className = "account-head";

      const title = document.createElement("strong");
      title.textContent = group.side;

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "inline-button";
      toggle.dataset.toggle = String(index);
      toggle.textContent = "계좌 보기";

      head.appendChild(title);
      head.appendChild(toggle);

      const body = document.createElement("div");
      body.className = "account-body";

      // entries가 없으면 예전의 한 항목짜리 형식으로 간주한다
      const entries = group.entries || [group];

      entries.forEach(function (item) {
        const account = item.bank + " " + item.number;

        const row = document.createElement("div");
        row.className = "account-row";

        const who = document.createElement("p");
        who.className = "account-who";
        who.textContent = [item.role, item.holder].filter(Boolean).join(" · ");

        const line = document.createElement("div");
        line.className = "account-line";

        const num = document.createElement("p");
        num.className = "account-number";
        num.textContent = account;

        const copy = document.createElement("button");
        copy.type = "button";
        copy.className = "inline-button";
        copy.dataset.copy = account;
        copy.textContent = "복사";

        line.appendChild(num);
        line.appendChild(copy);
        row.appendChild(who);
        row.appendChild(line);
        body.appendChild(row);
      });

      box.appendChild(head);
      box.appendChild(body);
      wrap.appendChild(box);
    });

    wrap.addEventListener("click", function (event) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      if (target.dataset.toggle) {
        const root = target.closest(".account");
        if (root) {
          const opened = root.classList.toggle("open");
          target.textContent = opened ? "접기" : "계좌 보기";
        }
      }

      if (target.dataset.copy) {
        copyText(target.dataset.copy)
          .then(function () {
            setFeedback("계좌번호를 복사했습니다.");
          })
          .catch(function () {
            setFeedback("복사에 실패했습니다. 다시 시도해 주세요.");
          });
      }
    });
  }

  function bindShare() {
    const copyBtn = $("#copyLinkBtn");
    const smsBtn = $("#smsShareBtn");
    const shareText = config.share.smsText;
    const pageUrl = window.location.href;

    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        copyText(pageUrl)
          .then(function () {
            setFeedback("링크를 복사했습니다.");
          })
          .catch(function () {
            setFeedback("링크 복사에 실패했습니다.");
          });
      });
    }

    if (smsBtn) {
      smsBtn.href = "sms:?body=" + encodeURIComponent(shareText + " " + pageUrl);
    }

    initKakaoShare(pageUrl);
  }

  function initKakaoShare(pageUrl) {
    const kakaoBtn = $("#kakaoShareBtn");
    const kakaoKey = config.kakao && config.kakao.javascriptKey;

    if (!kakaoBtn) {
      return;
    }

    if (!kakaoKey) {
      disableButton(kakaoBtn, "카카오톡 공유 (키 필요)");
      return;
    }

    loadExternalScript("https://developers.kakao.com/sdk/js/kakao.min.js", "kakao-js-sdk")
      .then(function () {
        if (!window.Kakao) {
          throw new Error("Kakao SDK not found");
        }

        if (!window.Kakao.isInitialized()) {
          window.Kakao.init(kakaoKey);
        }

        kakaoBtn.addEventListener("click", function () {
          // 카카오 규격: 400x400~800x800, 500KB 이하. SVG는 쓰지 말 것.
          const shareImage =
            (config.share && config.share.imageUrl) || "assets/images/share-thumb.jpg";
          const imageUrl = new URL(shareImage, window.location.href).href;

          window.Kakao.Share.sendDefault({
            objectType: "feed",
            content: {
              title: config.share.kakaoTitle || config.footer,
              description: getShareDescription(),
              imageUrl: imageUrl,
              link: {
                mobileWebUrl: pageUrl,
                webUrl: pageUrl
              }
            },
            buttons: [
              {
                title: "청첩장 보기",
                link: {
                  mobileWebUrl: pageUrl,
                  webUrl: pageUrl
                }
              },
              {
                title: "카카오지도 열기",
                link: {
                  mobileWebUrl: config.wedding.mapLinks.secondary,
                  webUrl: config.wedding.mapLinks.secondary
                }
              }
            ]
          });
        });
      })
      .catch(function () {
        disableButton(kakaoBtn, "카카오톡 공유 불가");
      });
  }

  function showStaticMap(mapEl) {
    // 카카오 지도를 못 쓰는 상황(키 없음/앱 정지/로드 실패/주소 검색 실패)에서
    // 직접 만든 약도 이미지로 대체한다. 아래 지도앱 링크 버튼은 그대로 동작한다.
    const staticMap = config.wedding.staticMapImage;

    if (!staticMap) {
      mapEl.innerHTML =
        '<p class="map-placeholder">지도를 불러오지 못했습니다. 아래 지도 버튼을 이용해 주세요.</p>';
      return;
    }

    mapEl.classList.add("is-static");
    mapEl.innerHTML = "";

    const img = document.createElement("img");
    img.className = "map-static";
    img.src = staticMap;
    img.alt = config.wedding.venueName + " 약도";
    img.loading = "lazy";
    mapEl.appendChild(img);
  }

  function initKakaoMap() {
    const mapEl = $("#kakaoMap");
    const kakaoKey = config.kakao && config.kakao.javascriptKey;

    if (!mapEl) {
      return;
    }

    if (!kakaoKey) {
      showStaticMap(mapEl);
      return;
    }

    const scriptUrl =
      "https://dapi.kakao.com/v2/maps/sdk.js?appkey=" +
      encodeURIComponent(kakaoKey) +
      "&autoload=false&libraries=services";

    loadExternalScript(scriptUrl, "kakao-map-sdk")
      .then(function () {
        if (!(window.kakao && window.kakao.maps)) {
          throw new Error("kakao map sdk unavailable");
        }

        window.kakao.maps.load(function () {
          function drawMap(lat, lng) {
            const center = new window.kakao.maps.LatLng(lat, lng);

            const map = new window.kakao.maps.Map(mapEl, {
              center: center,
              level: config.kakao.mapLevel || 4
            });

            const marker = new window.kakao.maps.Marker({
              position: center
            });
            marker.setMap(map);

            const info = new window.kakao.maps.InfoWindow({
              content:
                '<div style="padding:6px 10px;font-size:12px;">' + config.wedding.venueName + "</div>"
            });
            info.open(map, marker);
          }

          // 좌표를 직접 지정해두면 주소 검색 실패에 좌우되지 않는다
          const coords = config.wedding.coords;
          if (coords && typeof coords.lat === "number" && typeof coords.lng === "number") {
            drawMap(coords.lat, coords.lng);
            return;
          }

          const geocoder = new window.kakao.maps.services.Geocoder();
          geocoder.addressSearch(config.wedding.address, function (result, status) {
            if (status !== window.kakao.maps.services.Status.OK || !result.length) {
              showStaticMap(mapEl);
              return;
            }
            drawMap(Number(result[0].y), Number(result[0].x));
          });
        });
      })
      .catch(function () {
        showStaticMap(mapEl);
      });
  }

  function bindScrollReveal() {
    const targets = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16 }
    );

    targets.forEach(function (el) {
      observer.observe(el);
    });
  }

  function init() {
    renderHeader();
    initHeroSlideshow();
    renderMessage();
    renderSchedule();
    renderLocation();
    renderGallery();
    renderContacts();
    renderAccounts();
    bindShare();
    initKakaoMap();
    bindScrollReveal();
  }

  init();
})();
