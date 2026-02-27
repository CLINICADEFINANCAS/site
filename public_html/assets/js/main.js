(() => {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));


  // Cookie notice
  const COOKIE_KEY = "cf_cookie_ok";
  const COOKIE_PREFS_KEY = "cf_cookie_prefs";

  function saveCookiePrefs(prefs) {
    localStorage.setItem(COOKIE_PREFS_KEY, JSON.stringify(prefs));
    localStorage.setItem(COOKIE_KEY, "1");
  }

  function openCookieModal() {
    if (document.querySelector(".cookie-modal")) return;

    const modal = document.createElement("div");
    modal.className = "cookie-modal";
    modal.innerHTML = `
  <div class="cookie-modal__card">
    <h3 class="cookie-modal__title">Preferências de cookies</h3>
    <p class="cookie-modal__desc">Você pode escolher quais cookies deseja permitir.</p>

    <div class="cookie-list">
      <label class="cookie-item">
        <input type="checkbox" checked disabled>
        <span>Necessários (sempre ativos)</span>
      </label>

      <label class="cookie-item">
        <input type="checkbox" name="analytics" checked>
        <span>Analytics</span>
      </label>

      <label class="cookie-item">
        <input type="checkbox" name="marketing" checked>
        <span>Marketing</span>
      </label>
    </div>

    <div class="cookie-modal__actions">
      <button class="cookie-banner__btn cookie-save" type="button">Salvar</button>
      <button class="cookie-banner__btn cookie-banner__btn--ghost cookie-cancel" type="button">Fechar</button>
    </div>
  </div>
`;

    const saveBtn = modal.querySelector(".cookie-save");
    const cancelBtn = modal.querySelector(".cookie-cancel");

    saveBtn?.addEventListener("click", () => {
      const analytics = modal.querySelector('input[name="analytics"]')?.checked;
      const marketing = modal.querySelector('input[name="marketing"]')?.checked;
      saveCookiePrefs({ necessary: true, analytics: !!analytics, marketing: !!marketing });
      modal.remove();
      document.querySelector(".cookie-banner")?.remove();
    });

    cancelBtn?.addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });

    document.body.appendChild(modal);
  }

  function initCookieNotice() {
    if (localStorage.getItem(COOKIE_KEY) === "1") return;
    if (document.querySelector(".cookie-banner")) return;

    const banner = document.createElement("div");
    banner.className = "cookie-banner";
    banner.innerHTML = `
      <div class="cookie-banner__content">
        <div class="cookie-banner__text">Este site utiliza cookies para melhorar sua experiência e medir desempenho.</div>
        <div class="cookie-banner__actions">
          <button class="cookie-banner__btn" type="button">Aceitar</button>
          <button class="cookie-banner__btn cookie-banner__btn--ghost" type="button">Gerenciar cookies</button>
          <button class="cookie-banner__btn cookie-banner__btn--ghost" type="button">Fechar</button>
        </div>
      </div>
    `;

    const [acceptBtn, manageBtn, closeBtn] = banner.querySelectorAll(".cookie-banner__actions .cookie-banner__btn");
    acceptBtn?.addEventListener("click", () => {
      saveCookiePrefs({ necessary: true, analytics: true, marketing: true });
      banner.remove();
    });
    manageBtn?.addEventListener("click", () => openCookieModal());
    closeBtn?.addEventListener("click", () => {
      saveCookiePrefs({ necessary: true, analytics: true, marketing: true });
      banner.remove();
    });
    document.body.appendChild(banner);
  }

  // Mobile menu
  const toggle = $("[data-menu-toggle]");
  const mobileNav = $("[data-mobile-nav]");
  let scrollY = 0;

  function lockScroll() {
    scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.classList.add('menu-open');
  }

  function unlockScroll() {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.classList.remove('menu-open');
    window.scrollTo(0, scrollY);
  }

  function openMenu() {
    if (mobileNav) {
      mobileNav.classList.add("open");
      if (toggle) {
        toggle.setAttribute("aria-expanded", "true");
        toggle.setAttribute("aria-label", "Fechar menu");
      }
      lockScroll();
    }
  }

  function closeMenu() {
    if (mobileNav) {
      mobileNav.classList.remove("open");
      if (toggle) {
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Abrir menu");
      }
      unlockScroll();
    }
  }

  if (toggle && mobileNav) {
    toggle.addEventListener("click", () => {
      const isOpen = mobileNav.classList.contains("open");
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Fechar ao clicar nos links
    $$("[data-mobile-nav] a").forEach((link) => {
      link.addEventListener("click", () => {
        closeMenu();
      });
    });

    // Fechar ao clicar no overlay
    const overlay = mobileNav.querySelector(".mobile-nav__overlay");
    if (overlay) {
      overlay.addEventListener("click", () => {
        closeMenu();
      });
    }

    // Fechar com ESC
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && mobileNav.classList.contains("open")) {
        closeMenu();
        toggle.focus();
      }
    });

    // Fechar ao clicar fora
    document.addEventListener("click", (e) => {
      if (mobileNav.classList.contains("open")) {
        if (!mobileNav.contains(e.target) && e.target !== toggle) {
          closeMenu();
        }
      }
    });

    // Prevenir foco fora do menu quando aberto
    mobileNav.addEventListener("keydown", (e) => {
      if (e.key === "Tab" && mobileNav.classList.contains("open")) {
        const focusableElements = mobileNav.querySelectorAll(
          'a, button, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    });
  }

  // Tracking helpers
  window.trackEvent = function trackEvent(name, params = {}) {
    try {
      if (window.gtag) window.gtag("event", name, params);
      if (window.fbq) window.fbq("trackCustom", name, params);
    } catch (e) {
      // silencioso
    }
  };

  // Click tracking by data attributes
  $$("[data-track]").forEach((el) => {
    el.addEventListener("click", () => {
      const evt = el.getAttribute("data-track");
      const label = el.getAttribute("data-track-label") || el.textContent.trim();
      window.trackEvent(evt, { label, page: location.pathname });
    });
  });

  initCookieNotice();

  // Contact form submit (envio via Apps Script)
  const contactForm = $("#contactForm");
  const CONTACT_STORAGE_KEY = "cf_contato_v1";
  if (contactForm) {
    const phoneInput = contactForm.querySelector('input[name="whatsapp"]');
    const loadContactState = () => {
      const raw = localStorage.getItem(CONTACT_STORAGE_KEY);
      if (!raw) return;
      let data;
      try { data = JSON.parse(raw); } catch { return; }
      Object.keys(data || {}).forEach((key) => {
        const el = contactForm.querySelector(`[name="${key}"]`);
        if (el) el.value = data[key];
      });
    };

    const saveContactState = () => {
      const data = {};
      contactForm.querySelectorAll("input[name]").forEach((el) => {
        data[el.name] = el.value;
      });
      localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(data));
    };

    loadContactState();
    contactForm.addEventListener("input", (e) => {
      const t = e.target;
      if (t && t.name === "whatsapp") {
        t.value = normalizePhone(t.value);
      }
      if (t && t.tagName === "INPUT" && t.type === "text" && t.name !== "email") {
        t.value = titleCaseFirstLetter(t.value);
      }
      saveContactState();
    });

    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      window.trackEvent("lead_submit", { page: location.pathname });
      if (window.fbq) window.fbq("track", "Lead");

      const statusEl = $("#contactStatus");
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      if (statusEl) statusEl.textContent = "Enviando...";
      if (submitBtn) submitBtn.disabled = true;

      try {
        const APP_SCRIPT_URL = window.APP_SCRIPT_URL || "https://script.google.com/macros/s/SEU_ID/exec";
        if (!APP_SCRIPT_URL || APP_SCRIPT_URL.includes("SEU_ID")) {
          throw new Error("APP_SCRIPT_URL não configurada.");
        }

        const data = new FormData(contactForm);
        const nomeCompleto = String(data.get("nome") || "").trim();
        const whatsapp = String(data.get("whatsapp") || "").trim();
        const email = String(data.get("email") || "").trim();
        const objetivo = String(data.get("objetivo") || "").trim();
        const { firstName, lastName } = splitFullName(nomeCompleto);

        const payload = {
          lead: {
            firstName,
            lastName,
            email,
            phone: whatsapp
          },
          scores: {},
          answers: [
            { question: "Nome completo", value: nomeCompleto },
            { question: "WhatsApp", value: whatsapp },
            { question: "E-mail", value: email },
            { question: "Objetivo", value: objetivo }
          ]
        };

        const resp = await fetch(APP_SCRIPT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const resJson = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          const reason = resJson?.details
            ? `${resJson?.error || "Erro"}: ${resJson.details}`
            : (resJson?.error || "Falha ao enviar.");
          throw new Error(reason);
        }

        if (statusEl) {
          statusEl.textContent = "Mensagem enviada com sucesso, em breve entraremos em contato.";
        }
        contactForm.reset();
        localStorage.removeItem(CONTACT_STORAGE_KEY);
      } catch (err) {
        if (statusEl) statusEl.textContent = "";
        console.error(err);
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  // -------------------- CALCULADORA (só roda na página) --------------------
  if (!$("#cardLead") || !$("#cardQuiz") || !$("#resultView")) return;

  const WEIGHTS = { habilidade: 0.25, comportamento: 0.25, seguranca: 0.30, liberdade: 0.20 };
  const Q1_OVERALL_BOOST = 0.10;

  const DIM_MAP = {
    habilidade: ["q5", "q6", "q7", "q13"],
    comportamento: ["q8", "q9", "q10", "q15"],
    seguranca: ["q2", "q3", "q4", "q14"],
    liberdade: ["q11", "q12"],
  };

  const BR_AVG = { overall: 53, habilidade: 52, comportamento: 59, seguranca: 54, liberdade: 46 };

  const QUESTIONS = {
    q1: "Nos últimos 12 meses, qual frase melhor descreve a comparação entre a renda total e os gastos na sua casa?",
    q2: "Preocupações com despesas e compromissos financeiros são motivo de estresse na minha casa.",
    q3: "Por causa dos compromissos financeiros, o padrão de vida da minha casa foi bastante reduzido.",
    q4: "Estou apertado(a) financeiramente.",
    q5: "Eu sei tomar decisões financeiras complicadas.",
    q6: "Eu sou capaz de reconhecer um bom investimento.",
    q7: "Eu sei me informar para tomar decisões financeiras.",
    q8: "Eu sei como me controlar para não gastar muito.",
    q9: "Eu sei como me obrigar a poupar.",
    q10: "Eu sei como me obrigar a cumprir minhas metas financeiras.",
    q11: "Estou garantindo meu futuro financeiro.",
    q12: "O jeito que eu cuido do meu dinheiro me permite aproveitar a vida.",
    q13: "Eu consigo perceber quando me falta informação para tomar uma boa decisão sobre o meu dinheiro.",
    q14: "Eu consigo perceber quando não estou cuidando bem do meu dinheiro.",
    q15: "Eu consigo perceber quando as contas estão saindo do controle.",
    income: "Qual é, aproximadamente, a renda total por mês (família)?",
    edu: "Qual é o seu grau de instrução?",
  };

  const byId = (id) => document.getElementById(id);

  function clamp(n) { return Math.max(0, Math.min(100, n)); }
  function avg(arr) { return arr.reduce((a, b) => a + b, 0) / Math.max(1, arr.length); }
  function getRadio(name) {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : null;
  }
  function getRadioNumber(name) {
    const v = getRadio(name);
    if (v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  function setBar(elId, val) { const el = byId(elId); if (el) el.style.width = `${clamp(val)}%`; }
  function setAvgLine(lineId, val) { const el = byId(lineId); if (el) el.style.left = `${clamp(val)}%`; }

  function getClassification(score) {
    if (score < 30) return { label: "Ruim", className: "class-ruim" };
    if (score < 45) return { label: "Muito Baixo", className: "class-muito-baixo" };
    if (score < 60) return { label: "Baixo", className: "class-baixo" };
    if (score < 75) return { label: "Ok", className: "class-ok" };
    if (score < 90) return { label: "Boa", className: "class-boa" };
    return { label: "Ótima", className: "class-otima" };
  }

  function classification(score) {
    if (score < 30) return { label: "Ruim", desc: "Círculo de fragilidade e desorganização financeira. Prioridade: estabilizar e reduzir pressão." };
    if (score < 45) return { label: "Muito Baixo", desc: "Desequilíbrios importantes e pouco espaço para erro. Foco em controle, organização e interrupção de vazamentos." };
    if (score < 60) return { label: "Baixo", desc: "Risco recorrente de estresse financeiro. Fortaleça rotina, previsibilidade e decisões." };
    if (score < 75) return { label: "Ok", desc: "Equilíbrio no limite. O próximo passo é construir segurança (reserva) e reduzir vulnerabilidades." };
    if (score < 90) return { label: "Boa", desc: "Base consistente. O caminho é consolidar hábitos e ampliar patrimônio com estratégia." };
    return { label: "Ótima", desc: "Finanças com segurança e liberdade. Mantenha disciplina e uma estratégia de longo prazo." };
  }

  function rendaLabel(v) {
    const map = {
      ate_1412: "Até R$ 1.412",
      1413_2824: "De R$ 1.413 até R$ 2.824",
      2825_4236: "De R$ 2.825 até R$ 4.236",
      4237_7060: "De R$ 4.237 até R$ 7.060",
      7061_14120: "De R$ 7.061 até R$ 14.120",
      14121_28240: "De R$ 14.121 até R$ 28.240",
      acima_28240: "Acima de R$ 28.240",
    };
    return map[v] || "—";
  }

  function eduLabel(v) {
    const map = {
      analfabeto_f1i: "Analfabeto / Fundamental 1 Incompleto",
      f1c_f2i: "Fundamental 1 Completo / Fundamental 2 Incompleto",
      f2c_mi: "Fundamental 2 Completo / Médio Incompleto",
      mc_si: "Médio Completo / Superior Incompleto",
      sc: "Superior Completo",
      pg: "Pós-Graduação Completa",
    };
    return map[v] || "—";
  }

  function normalizePhone(v) {
    const d = (v || "").replace(/\D/g, "").slice(0, 11);
    const p1 = d.slice(0, 2);
    const p2 = d.slice(2, 7);
    const p3 = d.slice(7, 11);
    let out = "";
    if (p1) out += `(${p1}`;
    if (p1.length === 2) out += `)`;
    if (p2) out += p2;
    if (p3) out += `-${p3}`;
    return out;
  }

  function titleCaseFirstLetter(v) {
    if (!v) return v;
    const first = v.charAt(0);
    const rest = v.slice(1);
    return first.toUpperCase() + rest;
  }

  function splitFullName(fullName) {
    const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return { firstName: "", lastName: "" };
    if (parts.length === 1) return { firstName: parts[0], lastName: "" };
    return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
  }

  function isValidPhone(v) { return /^\(\d{2}\)\d{5}-\d{4}$/.test(v); }
  function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || ""); }

  function leadIsValid() {
    const fn = byId("firstName")?.value?.trim() || "";
    const ln = byId("lastName")?.value?.trim() || "";
    const ph = byId("phone")?.value?.trim() || "";
    const em = byId("email")?.value?.trim() || "";
    return fn.length >= 2 && ln.length >= 2 && isValidPhone(ph) && isValidEmail(em);
  }

  function updateLeadProgress() {
    const total = 4;
    let done = 0;

    if ((byId("firstName")?.value?.trim() || "").length >= 2) done++;
    if ((byId("lastName")?.value?.trim() || "").length >= 2) done++;
    if (isValidPhone(byId("phone")?.value?.trim() || "")) done++;
    if (isValidEmail(byId("email")?.value?.trim() || "")) done++;

    const pct = Math.round((done / total) * 100);
    if (byId("pTxt")) byId("pTxt").textContent = pct + "%";
    if (byId("pBar")) byId("pBar").style.width = pct + "%";
  }

  function updateProgress() {
    const total = 4 + 15 + 2;
    let done = 0;

    if ((byId("firstName")?.value?.trim() || "").length >= 2) done++;
    if ((byId("lastName")?.value?.trim() || "").length >= 2) done++;
    if (isValidPhone(byId("phone")?.value?.trim() || "")) done++;
    if (isValidEmail(byId("email")?.value?.trim() || "")) done++;

    // Só verificar respostas do questionário se estiver na página do questionário
    if (byId("cardQuiz")?.style.display !== "none") {
      for (let i = 1; i <= 15; i++) if (getRadio(`q${i}`) !== null) done++;
      if (document.querySelector('input[name="income"]:checked')) done++;
      if (document.querySelector('input[name="edu"]:checked')) done++;
    }

    const pct = Math.round((done / total) * 100);
    if (byId("pTxt")) byId("pTxt").textContent = pct + "%";
    if (byId("pBar")) byId("pBar").style.width = pct + "%";
  }

  function isAnsweredBlock(qEl) {
    const radios = qEl.querySelectorAll('input[type="radio"]');
    return Array.from(radios).some((r) => r.checked);
  }

  function clearFocus() {
    document.querySelectorAll(".calc-q.calc-nextFocus").forEach((x) => x.classList.remove("calc-nextFocus"));
  }

  function scrollToNext(fromEl) {
    const blocks = Array.from(document.querySelectorAll("#cardQuiz .calc-q"));
    const idx = blocks.indexOf(fromEl);
    for (let i = idx + 1; i < blocks.length; i++) {
      if (!isAnsweredBlock(blocks[i])) {
        clearFocus();
        blocks[i].classList.add("calc-nextFocus");
        blocks[i].scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }
    clearFocus();
    byId("btnFinish")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function attachAutoAdvance() {
    document.querySelectorAll('#cardQuiz input[type="radio"]').forEach((input) => {
      input.addEventListener("change", (e) => {
        updateProgress();
        saveCalcState();
        const qEl = e.target.closest(".calc-q");
        if (qEl) scrollToNext(qEl);
      });
    });
  }

  function quizIsComplete() {
    for (let i = 1; i <= 15; i++) {
      if (getRadio(`q${i}`) === null) return false;
    }
    const inc = document.querySelector('input[name="income"]:checked')?.value || null;
    const edu = document.querySelector('input[name="edu"]:checked')?.value || null;
    return !!inc && !!edu;
  }

  function compute() {
    const dims = {};
    for (const [dim, qs] of Object.entries(DIM_MAP)) {
      const values = qs.map((q) => getRadioNumber(q)).filter((n) => typeof n === "number");
      dims[dim] = clamp(avg(values));
    }
    const q1 = clamp(getRadioNumber("q1") ?? 0);

    const dimWeighted =
      dims.habilidade * WEIGHTS.habilidade +
      dims.comportamento * WEIGHTS.comportamento +
      dims.seguranca * WEIGHTS.seguranca +
      dims.liberdade * WEIGHTS.liberdade;

    const overall = clamp((1 - Q1_OVERALL_BOOST) * dimWeighted + Q1_OVERALL_BOOST * q1);
    return { overall, dims };
  }

  function collectAnswers() {
    const answers = {};
    for (let i = 1; i <= 15; i++) {
      const name = `q${i}`;
      const raw = getRadio(name);
      answers[name] = {
        question: QUESTIONS[name] || name,
        value: raw,
        scoreValue: getRadioNumber(name),
      };
    }

    const inc = document.querySelector('input[name="income"]:checked')?.value || null;
    const edu = document.querySelector('input[name="edu"]:checked')?.value || null;

    answers.income = { question: QUESTIONS.income, value: inc, label: rendaLabel(inc) };
    answers.edu = { question: QUESTIONS.edu, value: edu, label: eduLabel(edu) };

    return answers;
  }

  function renderResult() {
    const inc = document.querySelector('input[name="income"]:checked')?.value || null;
    const edu = document.querySelector('input[name="edu"]:checked')?.value || null;

    const lead = {
      firstName: (byId("firstName")?.value || "").trim(),
      lastName: (byId("lastName")?.value || "").trim(),
      phone: (byId("phone")?.value || "").trim(),
      email: (byId("email")?.value || "").trim(),
    };

    const { overall, dims } = compute();
    const cls = getClassification(overall);
    const clsDesc = classification(overall);

    const pill = byId("clsPill");
    if (pill) {
      pill.textContent = `Classificação: ${cls.label}`;
      pill.className = `calc-pill ${cls.className}`;
    }
    if (byId("overallScore")) byId("overallScore").textContent = String(Math.round(overall));
    setBar("overallBar2", overall);
    if (byId("overallDesc")) byId("overallDesc").textContent = clsDesc.desc;

    if (byId("dHab")) byId("dHab").textContent = String(Math.round(dims.habilidade));
    if (byId("dComp")) byId("dComp").textContent = String(Math.round(dims.comportamento));
    if (byId("dSeg")) byId("dSeg").textContent = String(Math.round(dims.seguranca));
    if (byId("dLib")) byId("dLib").textContent = String(Math.round(dims.liberdade));

    setBar("bHab", dims.habilidade);
    setBar("bComp", dims.comportamento);
    setBar("bSeg", dims.seguranca);
    setBar("bLib", dims.liberdade);

    if (byId("outName")) byId("outName").textContent = `${lead.firstName} ${lead.lastName}`.trim();
    if (byId("outPhone")) byId("outPhone").textContent = lead.phone;
    if (byId("outEmail")) byId("outEmail").textContent = lead.email;
    if (byId("outIncome")) byId("outIncome").textContent = rendaLabel(inc);
    if (byId("outEdu")) byId("outEdu").textContent = eduLabel(edu);

    const weakest = Object.entries(dims).sort((a, b) => a[1] - b[1])[0]?.[0] || "—";
    if (byId("nextStep")) {
      byId("nextStep").innerHTML =
        `<b>Leitura inicial:</b> seu índice indica <b>${cls.label}</b>. A dimensão mais frágil agora é <b>${weakest}</b>.<br><br>` +
        `<b>Próximo passo recomendado:</b> seguir para um diagnóstico de causa (cartão rotativo, cheque especial, atrasos, comprometimento de renda etc.) ` +
        `para definir o <b>ponto de ataque</b> e o plano de ação.`;
    }

    const youOverall = Math.round(overall);
    const youHab = Math.round(dims.habilidade);
    const youComp = Math.round(dims.comportamento);
    const youSeg = Math.round(dims.seguranca);
    const youLib = Math.round(dims.liberdade);

    if (byId("avgOverallTxt")) byId("avgOverallTxt").textContent = String(BR_AVG.overall);
    if (byId("youOverallTxt")) byId("youOverallTxt").textContent = String(youOverall);

    if (byId("avgHabTxt")) byId("avgHabTxt").textContent = String(BR_AVG.habilidade);
    if (byId("youHabTxt")) byId("youHabTxt").textContent = String(youHab);

    if (byId("avgCompTxt")) byId("avgCompTxt").textContent = String(BR_AVG.comportamento);
    if (byId("youCompTxt")) byId("youCompTxt").textContent = String(youComp);

    if (byId("avgSegTxt")) byId("avgSegTxt").textContent = String(BR_AVG.seguranca);
    if (byId("youSegTxt")) byId("youSegTxt").textContent = String(youSeg);

    if (byId("avgLibTxt")) byId("avgLibTxt").textContent = String(BR_AVG.liberdade);
    if (byId("youLibTxt")) byId("youLibTxt").textContent = String(youLib);

    setAvgLine("avgLineOverall", BR_AVG.overall);
    setAvgLine("avgLineHab", BR_AVG.habilidade);
    setAvgLine("avgLineComp", BR_AVG.comportamento);
    setAvgLine("avgLineSeg", BR_AVG.seguranca);
    setAvgLine("avgLineLib", BR_AVG.liberdade);

    const answers = collectAnswers();

    window.__diagnosis = {
      lead,
      demographics: { renda: rendaLabel(inc), educacao: eduLabel(edu) },
      answers,
      scores: {
        overall: youOverall,
        classification: cls.label,
        dims: {
          habilidade: youHab,
          comportamento: youComp,
          seguranca: youSeg,
          liberdade: youLib
        },
        comparison: {
          brAvg: { ...BR_AVG },
          delta: {
            overall: youOverall - BR_AVG.overall,
            habilidade: youHab - BR_AVG.habilidade,
            comportamento: youComp - BR_AVG.comportamento,
            seguranca: youSeg - BR_AVG.seguranca,
            liberdade: youLib - BR_AVG.liberdade
          }
        }
      },
      meta: { createdAt: new Date().toISOString(), userAgent: navigator.userAgent, page: location.href }
    };
  }

  async function sendDiagnosisEmail() {
    try {
      if (!window.__diagnosis) throw new Error("Diagnóstico ausente.");

      const APP_SCRIPT_URL = window.APP_SCRIPT_URL || "https://script.google.com/macros/s/SEU_ID/exec";
      if (!APP_SCRIPT_URL || APP_SCRIPT_URL.includes("SEU_ID")) {
        throw new Error("APP_SCRIPT_URL não configurada.");
      }

      const answers = window.__diagnosis?.answers || {};
      const answersArray = Array.isArray(answers)
        ? answers
        : Object.keys(answers).map((k) => {
          const item = answers[k] || {};
          return {
            question: item.question || k,
            label: item.label,
            value: item.label || item.value || ""
          };
        });

      const payload = {
        lead: window.__diagnosis?.lead || {},
        scores: window.__diagnosis?.scores || {},
        answers: answersArray
      };

      const resp = await fetch(APP_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resText = await resp.text();
      let data = {};
      try { data = JSON.parse(resText || "{}"); } catch { data = { raw: resText }; }
      if (!resp.ok || data?.ok === false) {
        const reason = data?.details
          ? `${data?.error || "Erro"}: ${data.details}`
          : (data?.error || data?.raw || resText || `HTTP ${resp.status}`);
        throw new Error(reason);
      }

      const ms = document.getElementById("mailStatus");
      if (ms) ms.textContent = "Diagnóstico enviado com sucesso. Em breve você receberá o próximo passo.";
      return true;
    } catch (err) {
      const ms = document.getElementById("mailStatus");
      if (ms) ms.textContent = "";
      console.error(err);
      return false;
    }
  }

  const CALC_STORAGE_KEY = "cf_calc_v1";

  function saveCalcState() {
    const state = {
      firstName: byId("firstName")?.value || "",
      lastName: byId("lastName")?.value || "",
      phone: byId("phone")?.value || "",
      email: byId("email")?.value || "",
      answers: {},
      income: null,
      edu: null
    };

    // Só salvar respostas do questionário se estiver na página do questionário
    if (byId("cardQuiz")?.style.display !== "none") {
      state.income = getRadio("income");
      state.edu = getRadio("edu");
      
      for (let i = 1; i <= 15; i++) {
        state.answers[`q${i}`] = getRadio(`q${i}`);
      }
    }

    localStorage.setItem(CALC_STORAGE_KEY, JSON.stringify(state));
  }

  function loadCalcState() {
    const raw = localStorage.getItem(CALC_STORAGE_KEY);
    if (!raw) return;
    let state;
    try { state = JSON.parse(raw); } catch { return; }

    if (byId("firstName")) byId("firstName").value = state.firstName || "";
    if (byId("lastName")) byId("lastName").value = state.lastName || "";
    if (byId("phone")) byId("phone").value = state.phone || "";
    if (byId("email")) byId("email").value = state.email || "";

    const answers = state.answers || {};
    Object.keys(answers).forEach((k) => {
      const val = answers[k];
      if (!val) return;
      const el = document.querySelector(`input[name="${k}"][value="${val}"]`);
      if (el) el.checked = true;
    });

    if (state.income) {
      const el = document.querySelector(`input[name="income"][value="${state.income}"]`);
      if (el) el.checked = true;
    }

    if (state.edu) {
      const el = document.querySelector(`input[name="edu"][value="${state.edu}"]`);
      if (el) el.checked = true;
    }

    const hasQuiz = Object.values(answers).some((v) => v);
    if (hasQuiz || state.income || state.edu) {
      byId("cardLead")?.style.setProperty("display", "none");
      byId("cardQuiz")?.style.setProperty("display", "block");
    }
  }

  function clearCalcState() {
    localStorage.removeItem(CALC_STORAGE_KEY);
  }

  function bindUI() {
    const phoneEl = byId("phone");
    if (phoneEl) {
      phoneEl.addEventListener("input", (e) => {
        e.target.value = normalizePhone(e.target.value);
        updateLeadProgress();
        saveCalcState();
      });
    }

    ["firstName", "lastName", "email"].forEach((id) => {
      const el = byId(id);
      if (el) el.addEventListener("input", () => {
        if (el.type === "text" && el.id !== "email") {
          el.value = titleCaseFirstLetter(el.value);
        }
        updateLeadProgress();
        saveCalcState();
      });
    });

    byId("btnStart")?.addEventListener("click", () => {
      if (!leadIsValid()) {
        if (byId("leadWarn")) byId("leadWarn").style.display = "block";
        return;
      }
      if (byId("leadWarn")) byId("leadWarn").style.display = "none";
      byId("cardLead").style.display = "none";
      byId("cardQuiz").style.display = "block";
      clearFocus();
      byId("q1")?.classList.add("calc-nextFocus");
      byId("q1")?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.trackEvent?.("calc_start", { page: location.pathname });
      saveCalcState();
    });

    byId("btnBackLead")?.addEventListener("click", () => {
      byId("cardQuiz").style.display = "none";
      byId("cardLead").style.display = "block";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    byId("btnFinish")?.addEventListener("click", async () => {
      if (byId("quizWarn")) byId("quizWarn").style.display = "none";

      if (!quizIsComplete()) {
        if (byId("quizWarn")) byId("quizWarn").style.display = "block";
        const blocks = Array.from(document.querySelectorAll("#cardQuiz .calc-q"));
        for (const b of blocks) {
          if (!isAnsweredBlock(b)) {
            clearFocus();
            b.classList.add("calc-nextFocus");
            b.scrollIntoView({ behavior: "smooth", block: "center" });
            break;
          }
        }
        return;
      }

      renderResult();
      byId("formView").style.display = "none";
      byId("resultView").style.display = "block";
      window.scrollTo({ top: 0, behavior: "smooth" });

      window.trackEvent?.("calc_finish", { page: location.pathname });
      if (window.fbq) window.fbq("track", "Lead");

      await sendDiagnosisEmail();
    });

    byId("btnBackQuiz")?.addEventListener("click", () => {
      byId("resultView").style.display = "none";
      byId("formView").style.display = "block";
      byId("cardLead").style.display = "none";
      byId("cardQuiz").style.display = "block";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    byId("btnRestart")?.addEventListener("click", () => {
      document.querySelectorAll('input[type="radio"]').forEach((el) => (el.checked = false));
      if (byId("firstName")) byId("firstName").value = "";
      if (byId("lastName")) byId("lastName").value = "";
      if (byId("phone")) byId("phone").value = "";
      if (byId("email")) byId("email").value = "";
      if (byId("leadWarn")) byId("leadWarn").style.display = "none";
      if (byId("quizWarn")) byId("quizWarn").style.display = "none";
      if (byId("mailStatus")) byId("mailStatus").textContent = "";

      byId("resultView").style.display = "none";
      byId("formView").style.display = "block";
      byId("cardQuiz").style.display = "none";
      byId("cardLead").style.display = "block";

      updateProgress();
      window.scrollTo({ top: 0, behavior: "smooth" });
      clearCalcState();
    });

    byId("btnClearAll")?.addEventListener("click", () => {
      if (byId("firstName")) byId("firstName").value = "";
      if (byId("lastName")) byId("lastName").value = "";
      if (byId("phone")) byId("phone").value = "";
      if (byId("email")) byId("email").value = "";
      document.querySelectorAll('input[type="radio"]').forEach((el) => (el.checked = false));
      if (byId("leadWarn")) byId("leadWarn").style.display = "none";
      if (byId("quizWarn")) byId("quizWarn").style.display = "none";
      if (byId("mailStatus")) byId("mailStatus").textContent = "";
      updateProgress();
      clearCalcState();
    });

    attachAutoAdvance();
    loadCalcState();
    updateLeadProgress();
  }

  document.addEventListener("DOMContentLoaded", () => {
    bindUI();
  });
})();
