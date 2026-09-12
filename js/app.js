/* ===== 公考倒计时 · 应用逻辑 ===== */
(function () {
  "use strict";

  const STORE_KEY = "gkdjs_exams_v1";
  const SETTINGS_KEY = "gkdjs_settings_v1";
  const NOTIFIED_KEY = "gkdjs_notified_v1";
  const CATEGORY_LABEL = { guokao: "国考", shengkao: "省考", diaoxuan: "选调" };

  let exams = loadExams();
  let filter = "all";
  let editingId = null;
  let settings = loadSettings();

  const $ = (sel) => document.querySelector(sel);
  const listEl = $("#list");
  const emptyEl = $("#empty");
  const modalEl = $("#modal");
  const formEl = $("#form");
  const noticeEl = $("#notice");

  /* ---------- 存储 ---------- */
  function loadExams() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr;
      }
    } catch (e) { /* ignore */ }
    return DEFAULT_EXAMS.map((x) => ({ ...x }));
  }
  function persistExams() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(exams)); } catch (e) { /* ignore */ }
  }
  function loadSettings() {
    try {
      return Object.assign({ notify: false, tipSeen: false },
        JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"));
    } catch (e) { return { notify: false, tipSeen: false }; }
  }
  function persistSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) { /* ignore */ }
  }

  /* ---------- 时间工具 ---------- */
  function parse(str) {
    if (!str) return null;
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }
  function now() { return new Date(); }

  function diff(target) {
    const ms = target.getTime() - Date.now();
    const abs = Math.abs(ms);
    return {
      ms,
      d: Math.floor(abs / 86400000),
      h: Math.floor((abs % 86400000) / 3600000),
      m: Math.floor((abs % 3600000) / 60000),
      s: Math.floor((abs % 60000) / 1000)
    };
  }

  function fmtMD(str) {
    const d = parse(str);
    if (!d) return "";
    return (d.getMonth() + 1) + "月" + d.getDate() + "日" +
      (str.length > 10 ? " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0") : "");
  }

  /* ---------- 状态计算 ---------- */
  function enrollState(ex) {
    const s = parse(ex.enrollStart);
    const e = parse(ex.enrollEnd);
    if (!s && !e) return null;
    const n = now();
    if (s && n < s) return { key: "soon", label: "未开始", s, e, pct: 0 };
    if (e && n <= e) {
      const pct = s ? Math.min(100, Math.max(0, ((n - s) / (e - s)) * 100)) : 100;
      /* 公告未发布、日期为参考去年时，窗口期显示"预计窗口"，避免误认为真实报名中 */
      if (!ex.announced) return { key: "ref", label: "预计窗口", s, e, pct };
      return { key: "open", label: "报名中", s, e, pct };
    }
    return { key: "closed", label: "已截止", s, e, pct: 100 };
  }

  function isDone(ex) {
    const d = parse(ex.examAt);
    if (d) return now() > d;
    const es = enrollState(ex);
    return es && es.key === "closed";
  }

  function primaryDate(ex) {
    return parse(ex.examAt) || parse(ex.enrollEnd) || parse(ex.enrollStart);
  }

  function sorted() {
    return exams.slice().sort((a, b) => {
      const da = isDone(a), db = isDone(b);
      if (da !== db) return da ? 1 : -1;
      const ta = primaryDate(a), tb = primaryDate(b);
      if (!ta && !tb) return 0;
      if (!ta) return 1;
      if (!tb) return -1;
      return ta - tb;
    });
  }

  /* ---------- 渲染 ---------- */
  function render() {
    const list = sorted().filter((ex) => filter === "all" || ex.category === filter);
    listEl.innerHTML = "";
    if (list.length === 0) {
      emptyEl.hidden = false;
      return;
    }
    emptyEl.hidden = true;
    list.forEach((ex) => listEl.appendChild(cardEl(ex)));
    updateNotifyBtn();
  }

  function cardEl(ex) {
    const art = document.createElement("article");
    art.className = "card cat-" + ex.category + (isDone(ex) ? " done" : "");
    art.dataset.id = ex.id;

    /* 顶部：类别 + 状态章 */
    const top = el("div", "card-top");
    const badge = el("span", "cat-badge " + ex.category, CATEGORY_LABEL[ex.category]);
    const seal = el("span", "status-seal");
    const es = enrollState(ex);
    if (es) {
      seal.textContent = es.label;
      seal.classList.add(es.key);
    } else if (parse(ex.examAt)) {
      seal.textContent = "待报名";
      seal.classList.add("soon");
    } else {
      seal.textContent = "待公告";
      seal.classList.add("soon");
    }
    top.append(badge, seal);

    /* 标题 */
    const title = el("h2", "card-title", ex.name);
    if (ex.announced) title.appendChild(el("span", "announced-tag", "已公布"));

    /* 倒计时主体 */
    const body = document.createElement("div");
    const examD = parse(ex.examAt);
    if (examD && now() < examD) {
      body.appendChild(el("div", "cd-label", "距考试还有"));
      const cd = countdownEl(examD);
      cd.dataset.target = ex.examAt;
      cd.dataset.kind = "exam";
      body.appendChild(cd);
    } else if (es && es.key === "open" && es.e) {
      body.appendChild(el("div", "cd-label", "距报名截止还有"));
      const cd = countdownEl(es.e);
      cd.dataset.target = ex.enrollEnd;
      cd.dataset.kind = "enroll";
      body.appendChild(cd);
    } else if (es && es.key === "soon" && es.s) {
      body.appendChild(el("div", "cd-label", "距报名开始还有"));
      const cd = countdownEl(es.s);
      cd.dataset.target = ex.enrollStart;
      cd.dataset.kind = "enroll";
      body.appendChild(cd);
    } else if (examD) {
      body.appendChild(el("div", "cd-label", "已开考，祝上岸"));
      const cd = el("div", "countdown");
      cd.appendChild(el("div", "cd-block finished", null,
        el("b", null, "—")));
      body.appendChild(cd);
    } else {
      body.appendChild(el("div", "cd-label", "时间以官方公告为准"));
      const cd = el("div", "countdown");
      cd.appendChild(el("div", "cd-block finished", null,
        el("b", null, "待公告")));
      body.appendChild(cd);
    }

    /* 报名行 + 进度条 */
    if (es) {
      const wrap = el("div", "enroll");
      const line = el("div", "enroll-line");
      const stateEl = el("span", "e-state");
      stateEl.textContent = "报名 " + fmtMD(ex.enrollStart) + " – " + fmtMD(ex.enrollEnd);
      const leftEl = el("span", "e-state");
      if (es.key === "open" && es.e) {
        leftEl.textContent = "剩 " + niceLeft(es.e);
        leftEl.classList.add("warn");
      } else if (es.key === "ref" && es.e) {
        leftEl.textContent = "参考窗口剩 " + niceLeft(es.e);
        leftEl.classList.add("warn");
      } else if (es.key === "soon" && es.s) {
        leftEl.textContent = "还有 " + niceLeft(es.s) + " 开始";
        leftEl.classList.add("ok");
      } else {
        leftEl.textContent = "已结束";
        leftEl.classList.add("closed");
        leftEl.style.color = "var(--ink-faint)";
      }
      line.append(stateEl, leftEl);
      const prog = el("div", "progress");
      const bar = el("div", "bar");
      bar.style.width = Math.round(es.pct) + "%";
      if (es.key === "closed") bar.classList.add("gray");
      if (es.key === "soon") bar.classList.add("blue");
      if (es.key === "ref") bar.classList.add("gold");
      prog.appendChild(bar);
      wrap.append(line, prog);
      body.appendChild(wrap);
    }

    /* 底部：来源 + 操作 */
    const foot = el("div", "card-foot");
    const meta = el("span", "meta", (ex.note || "") + (ex.source ? " ｜ 来源：" + ex.source : ""));
    const ops = el("div", "ops");
    const editBtn = el("button", "op-btn", "编辑");
    editBtn.type = "button";
    editBtn.addEventListener("click", () => openForm(ex));
    const delBtn = el("button", "op-btn del", "删除");
    delBtn.type = "button";
    delBtn.addEventListener("click", () => askDelete(delBtn, ex));
    ops.append(editBtn, delBtn);
    foot.append(meta, ops);

    art.append(top, title, body, foot);
    return art;
  }

  /* 两段确认删除，避免误触 */
  function askDelete(btn, ex) {
    if (btn.dataset.arm === "1") {
      exams = exams.filter((x) => x.id !== ex.id);
      persistExams();
      render();
      return;
    }
    btn.dataset.arm = "1";
    btn.textContent = "确认删除";
    setTimeout(() => {
      delete btn.dataset.arm;
      btn.textContent = "删除";
    }, 3000);
  }

  function countdownEl(target) {
    const cd = el("div", "countdown");
    const d = diff(target);
    const blocks = [
      [Math.floor(d.d), "天"],
      [Math.floor(d.h), "时"],
      [Math.floor(d.m), "分"],
      [Math.floor(d.s), "秒"]
    ];
    blocks.forEach(([v, unit], i) => {
      const b = el("div", "cd-block" + (i === 0 ? " hot" : ""));
      b.appendChild(el("b", "cd-num", String(v).padStart(2, "0")));
      b.appendChild(el("span", null, unit));
      cd.appendChild(b);
    });
    return cd;
  }

  function niceLeft(target) {
    const d = diff(target);
    if (d.d > 0) return d.d + " 天 " + d.h + " 小时";
    if (d.h > 0) return d.h + " 小时 " + d.m + " 分";
    return d.m + " 分 " + d.s + " 秒";
  }

  /* 每秒刷新倒计时数字 */
  function tick() {
    document.querySelectorAll(".countdown[data-target]").forEach((cd) => {
      const target = parse(cd.dataset.target);
      if (!target) return;
      const d = diff(target);
      if (d.ms <= 0) {
        render();
        return;
      }
      const nums = cd.querySelectorAll(".cd-num");
      if (nums.length === 4) {
        nums[0].textContent = String(d.d).padStart(2, "0");
        nums[1].textContent = String(d.h).padStart(2, "0");
        nums[2].textContent = String(d.m).padStart(2, "0");
        nums[3].textContent = String(d.s).padStart(2, "0");
      }
    });
    const enrollLines = document.querySelectorAll(".enroll-line .e-state.warn, .enroll-line .e-state.ok");
    enrollLines.forEach((el2) => {
      const card = el2.closest(".card");
      const cd = card && card.querySelector(".countdown[data-target]");
      if (cd && cd.dataset.kind === "enroll") return; // 大倒计时已覆盖
      const ex = exams.find((x) => x.id === card.dataset.id);
      if (!ex) return;
      const es = enrollState(ex);
      if (es && es.key === "open" && es.e) el2.textContent = "剩 " + niceLeft(es.e);
      else if (es && es.key === "ref" && es.e) el2.textContent = "参考窗口剩 " + niceLeft(es.e);
      else if (es && es.key === "soon" && es.s) el2.textContent = "还有 " + niceLeft(es.s) + " 开始";
    });
  }

  function el(tag, cls, text, child) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = text;
    if (child) e.appendChild(child);
    return e;
  }

  /* ---------- 页签 ---------- */
  $("#tabs").addEventListener("click", (ev) => {
    const btn = ev.target.closest(".tab");
    if (!btn) return;
    filter = btn.dataset.filter;
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t === btn));
    render();
  });

  /* ---------- 表单 ---------- */
  function openForm(ex) {
    editingId = ex ? ex.id : null;
    $("#formTitle").textContent = ex ? "编辑考试" : "添加考试";
    $("#fName").value = ex ? ex.name : "";
    $("#fCategory").value = ex ? ex.category : (filter !== "all" ? filter : "guokao");
    $("#fEnrollStart").value = ex ? ex.enrollStart || "" : "";
    $("#fEnrollEnd").value = ex ? ex.enrollEnd || "" : "";
    $("#fExamAt").value = ex ? ex.examAt || "" : "";
    $("#fNote").value = ex ? ex.note || "" : "";
    $("#fAnnounced").checked = ex ? !!ex.announced : false;
    modalEl.hidden = false;
    $("#fName").focus();
  }

  function closeForm() {
    modalEl.hidden = true;
    editingId = null;
    formEl.reset();
  }

  $("#addBtn").addEventListener("click", () => openForm(null));
  $("#formCancel").addEventListener("click", closeForm);
  modalEl.addEventListener("click", (ev) => {
    if (ev.target === modalEl) closeForm();
  });

  formEl.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const name = $("#fName").value.trim();
    if (!name) {
      showNotice("请填写考试名称");
      return;
    }
    const data = {
      name,
      category: $("#fCategory").value,
      enrollStart: $("#fEnrollStart").value,
      enrollEnd: $("#fEnrollEnd").value,
      examAt: $("#fExamAt").value,
      note: $("#fNote").value.trim(),
      announced: $("#fAnnounced").checked
    };
    /* 简单校验：报名截止不早于开始 */
    if (data.enrollStart && data.enrollEnd && data.enrollEnd < data.enrollStart) {
      showNotice("报名截止时间不能早于开始时间");
      return;
    }
    if (editingId) {
      const i = exams.findIndex((x) => x.id === editingId);
      if (i >= 0) exams[i] = Object.assign({}, exams[i], data);
    } else {
      exams.push(Object.assign({ id: "u" + Date.now().toString(36) }, data));
    }
    persistExams();
    closeForm();
    render();
  });

  /* ---------- 提示 ---------- */
  let noticeTimer = null;
  function showNotice(msg) {
    noticeEl.textContent = msg;
    noticeEl.hidden = false;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => { noticeEl.hidden = true; }, 3000);
  }

  /* ---------- 通知 ---------- */
  const notifyBtn = $("#notifyBtn");
  function updateNotifyBtn() {
    notifyBtn.classList.toggle("on", settings.notify);
    notifyBtn.title = settings.notify ? "考试提醒已开启" : "开启考试提醒";
    notifyBtn.setAttribute("aria-label", notifyBtn.title);
  }

  notifyBtn.addEventListener("click", async () => {
    if (settings.notify) {
      settings.notify = false;
      persistSettings();
      updateNotifyBtn();
      showNotice("提醒已关闭");
      return;
    }
    if (!("Notification" in window)) {
      showNotice("当前浏览器不支持通知");
      return;
    }
    try {
      const p = await Notification.requestPermission();
      if (p === "granted") {
        settings.notify = true;
        persistSettings();
        updateNotifyBtn();
        showNotice("提醒已开启：报名开始/截止、考试前提醒");
        checkReminders(true);
      } else {
        showNotice("未获得通知权限，请在系统设置中开启");
      }
    } catch (e) {
      showNotice("无法开启通知");
    }
  });

  function notifiedKeys() {
    try { return JSON.parse(localStorage.getItem(NOTIFIED_KEY) || "[]"); }
    catch (e) { return []; }
  }
  function markNotified(key) {
    try {
      const arr = notifiedKeys();
      arr.push(key);
      localStorage.setItem(NOTIFIED_KEY, JSON.stringify(arr.slice(-200)));
    } catch (e) { /* ignore */ }
  }

  /* 提醒点：报名开始当天、报名截止当天、考试前3天/前1天/当天 */
  function reminderPoints(ex) {
    const pts = [];
    const day = (dt, hh, mm, key) => {
      if (!dt) return;
      const d = new Date(dt);
      d.setHours(hh, mm, 0, 0);
      pts.push({ at: d, key: key + ":" + d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() });
    };
    day(ex.enrollStart, 8, 0, ex.id + ":es");
    day(ex.enrollEnd, 9, 0, ex.id + ":ee");
    if (ex.examAt) {
      const exd = new Date(ex.examAt);
      [-3, -1, 0].forEach((off) => {
        const d = new Date(exd);
        d.setDate(d.getDate() + off);
        d.setHours(7, 30, 0, 0);
        pts.push({ at: d, key: ex.id + ":ex" + off + ":" + d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() });
      });
    }
    return pts;
  }

  function checkReminders(force) {
    if (!settings.notify || !("Notification" in window)) return;
    const done = notifiedKeys();
    exams.forEach((ex) => {
      if (isDone(ex)) return;
      reminderPoints(ex).forEach((pt) => {
        if (done.includes(pt.key)) return;
        if (Date.now() >= pt.at.getTime()) {
          if (Notification.permission === "granted") {
            const label = pt.key.includes(":es") ? "开始报名" :
              pt.key.includes(":ee") ? "报名截止" : "考试临近";
            try {
              new Notification("公考倒计时提醒", {
                body: ex.name + "：" + label + (pt.key.includes(":ex-3") ? "（还有3天）" : pt.key.includes(":ex-1") ? "（明天）" : pt.key.includes(":ex0") ? "（今天）" : ""),
                icon: "icons/icon-192.png"
              });
            } catch (e) { /* ignore */ }
            showNotice("提醒：" + ex.name + " " + label);
          }
          markNotified(pt.key);
        }
      });
    });
  }

  /* ---------- iOS 安装提示 ---------- */
  function installTip() {
    if (settings.tipSeen) return;
    const ua = navigator.userAgent;
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const standalone = window.navigator.standalone === true;
    if (isIOS && !standalone && !("onbeforeinstallprompt" in window)) {
      settings.tipSeen = true;
      persistSettings();
      showNotice("提示：在 Safari 点分享按钮，选择\u201c添加到主屏幕\u201d，即可像 App 一样使用");
    }
  }

  /* ---------- 启动 ---------- */
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) render();
  });
  render();
  setInterval(tick, 1000);
  setInterval(() => checkReminders(false), 3600000);
  setTimeout(installTip, 1500);
  setTimeout(() => checkReminders(false), 3000);
})();
