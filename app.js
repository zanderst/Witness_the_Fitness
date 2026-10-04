(function () {
  "use strict";

  var STORE_KEY = "wtf-plan-v1";
  var TAB_KEY = "wtf-tab";

  function esc(t) {
    return String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  // ---------- Storage ----------
  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function store(plan) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(plan)); return true; } catch (e) { return false; }
  }
  function forget() { try { localStorage.removeItem(STORE_KEY); } catch (e) {} }
  function savedTab() { try { return localStorage.getItem(TAB_KEY) || "r-workout"; } catch (e) { return "r-workout"; } }
  function rememberTab(id) { try { localStorage.setItem(TAB_KEY, id); } catch (e) {} }

  // ---------- Rendering ----------
  // `E` is true while editing: fields become editable and lists get add/remove buttons.
  function make(E) {
    function f(tag, path, val, cls) {
      if (!E && (val === "" || val == null)) return "";
      return "<" + tag + (cls ? ' class="' + cls + '"' : "") + (E ? ' data-p="' + path + '" contenteditable="true"' : "") + ">" + esc(val) + "</" + tag + ">";
    }
    function del(path) {
      return E ? '<button type="button" class="ed-del" data-del="' + path + '" aria-label="Remove">×</button>' : "";
    }
    function cardDel(path, label) {
      return E ? '<button type="button" class="ed-card-del" data-del="' + path + '">Remove ' + label + "</button>" : "";
    }
    function add(path, kind, label) {
      return E ? '<button type="button" class="ed-add" data-add="' + path + '" data-kind="' + kind + '">+ ' + label + "</button>" : "";
    }
    function rows(path, list) {
      var h = '<ol class="ex">';
      list.forEach(function (r, i) {
        var p = path + "." + i;
        h += "<li>" + f("span", p + ".0", r[0], "name") + '<span class="sr-wrap">' + f("span", p + ".1", r[1], "sr") + del(p) + "</span></li>";
      });
      return h + "</ol>" + add(path, "row", "Add exercise");
    }
    function list(tag, cls, path, items, label) {
      if (!items.length && !E) return "";
      var h = "<" + tag + ' class="' + cls + '">';
      items.forEach(function (t, i) {
        h += '<li class="item">' + f("span", path + "." + i, t) + del(path + "." + i) + "</li>";
      });
      return h + "</" + tag + ">" + add(path, "text", label);
    }
    function head(path, o, tagKey) {
      return '<div class="card-head">' + f("h3", path + ".title", o.title) + f("span", path + "." + tagKey, o[tagKey], "tag") + "</div>";
    }
    return { f: f, del: del, cardDel: cardDel, add: add, rows: rows, list: list, head: head };
  }

  function renderPlan(S, E) {
    var h = make(E), f = h.f;
    var out = '<div class="wrap' + (E ? " editing" : "") + '">';
    out += '<header class="top">' + f("div", "eyebrow", S.eyebrow, "eyebrow") + f("h1", "title", S.title) + f("p", "subtitle", S.subtitle, "sub") + "</header>";
    out += '<input type="radio" name="tab" id="r-workout" class="tab-radio" checked>' +
      '<input type="radio" name="tab" id="r-diet" class="tab-radio">' +
      '<input type="radio" name="tab" id="r-info" class="tab-radio">' +
      '<nav class="tabs" aria-label="Plan sections"><label for="r-workout" id="tab-workout">Workout</label>' +
      '<label for="r-diet" id="tab-diet">Diet</label><label for="r-info" id="tab-info">Info</label></nav>';

    // Workout
    out += '<section class="panel" id="workout"><div class="block"><h2>Your week</h2><div class="week">';
    S.week.forEach(function (d, i) {
      out += '<div class="day ' + esc(d.kind) + '"><b>' + esc(d.day) + "</b>" + f("span", "week." + i + ".label", d.label) +
        (E ? '<button type="button" class="ed-kind" data-kind-i="' + i + '">' + esc(d.kind) + "</button>" : "") + "</div>";
    });
    out += "</div>" + f("p", "weekNote", S.weekNote, "small muted") + "</div>";
    S.sessions.forEach(function (s, i) {
      var p = "sessions." + i;
      out += '<div class="card">' + h.head(p, s, "tag") + h.rows(p + ".rows", s.rows) + h.cardDel(p, "workout") + "</div>";
    });
    out += h.add("sessions", "session", "Add workout") + "</section>";

    // Diet
    out += '<section class="panel" id="diet"><div class="block"><h2>Daily targets</h2><div class="tiles">';
    S.targets.forEach(function (t, i) {
      out += '<div class="tile' + (i === 0 ? " main" : "") + '">' + f("span", "targets." + i + ".0", t[0], "v") + f("span", "targets." + i + ".1", t[1], "l") + "</div>";
    });
    out += "</div>" + h.list("ul", "items small muted", "dietNotes", S.dietNotes, "Add note") + "</div>";
    S.meals.forEach(function (m, i) {
      var p = "meals." + i;
      out += '<div class="card">' + h.head(p, m, "time");
      m.options.forEach(function (o, j) {
        var q = p + ".options." + j;
        out += '<div class="opt">' + f("b", q + ".title", o.title) + f("span", q + ".macro", o.macro, "macro") +
          h.list("ul", "items", q + ".items", o.items, "Add item") + (E ? h.cardDel(q, "option") : "") + "</div>";
      });
      out += h.add(p + ".options", "option", "Add option") + f("p", p + ".note", m.note, "small muted") + h.cardDel(p, "meal") + "</div>";
    });
    out += h.add("meals", "meal", "Add meal");
    if (S.dayTotal || E) out += '<div class="total num"><span>Day total</span>' + f("span", "dayTotal", S.dayTotal) + "</div>";
    if (S.recipes.length || E) out += "<h2>Recipes</h2>";
    S.recipes.forEach(function (r, i) {
      var p = "recipes." + i;
      out += '<div class="card">' + h.head(p, r, "tag") + f("span", p + ".macro", r.macro, "macro") +
        h.list("ul", "items", p + ".ings", r.ings, "Add ingredient") + h.list("ol", "steps", p + ".steps", r.steps, "Add step") + h.cardDel(p, "recipe") + "</div>";
    });
    out += h.add("recipes", "recipe", "Add recipe") + "</section>";

    // Info
    out += '<section class="panel" id="info"><div class="block">' + f("h2", "infoTitle", S.infoTitle) + '<div class="facts">';
    S.facts.forEach(function (x, i) {
      out += '<div class="fact">' + f("div", "facts." + i + ".0", x[0], "l") + f("div", "facts." + i + ".1", x[1], "v") + "</div>";
    });
    out += "</div>" + f("p", "infoNote", S.infoNote, "small muted") + "</div>";
    if (S.tracking.length || E) out += '<div class="card"><h3>Tracking</h3>' + h.list("ul", "items", "tracking", S.tracking, "Add item") + "</div>";
    out += "</section>";

    if (E) out += '<div class="edit-bar"><span class="ed-hint">Tap any text to change it</span><button type="button" id="cancel-btn" class="ghost">Cancel</button><button type="button" id="save-btn">Save</button></div>';
    else out += '<div class="edit-bar"><button type="button" id="menu-btn" class="ghost" aria-expanded="false">Menu</button><button type="button" id="edit-btn">Edit plan</button></div>';
    return out + "</div>";
  }

  function renderWelcome() {
    return '<div class="wrap"><div class="welcome">' +
      '<div class="eyebrow">Your training &amp; diet plan</div><h1>Witness the Fitness</h1>' +
      '<p class="sub">Your plan is saved on this phone. Nobody else can see or change it.</p>' +
      '<div class="choices">' +
      '<button type="button" class="choice" data-start="example"><b>Use the example plan</b><span>A 3-day gym split, a simple daily menu and recipes. Edit anything after.</span></button>' +
      '<button type="button" class="choice" data-start="blank"><b>Start blank</b><span>Build your own plan from scratch.</span></button>' +
      '<label class="choice"><b>Restore a backup</b><span>Load a plan you exported earlier.</span><input type="file" accept="application/json,.json" class="visually-hidden" id="welcome-import"></label>' +
      "</div></div></div>";
  }

  // ---------- App state ----------
  var root = document.getElementById("app");
  var saved = load();
  var state = saved ? clone(saved) : null;
  var editing = false;

  function getP(o, path) { return path.split(".").reduce(function (a, k) { return a == null ? a : a[k]; }, o); }
  function setP(o, path, v) {
    var ks = path.split("."), last = ks.pop();
    (ks.length ? getP(o, ks.join(".")) : o)[last] = v;
  }

  function toast(msg) {
    var old = document.querySelector(".toast");
    if (old) old.remove();
    var t = document.createElement("div");
    t.className = "toast";
    t.setAttribute("role", "status");
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3200);
  }

  function mount() {
    var tab = document.querySelector(".tab-radio:checked");
    tab = tab ? tab.id : savedTab();
    var y = window.scrollY;
    closeMenu();
    if (!state) {
      root.innerHTML = renderWelcome();
      wireWelcome();
      return;
    }
    document.title = state.title || "Witness the Fitness";
    root.innerHTML = renderPlan(state, editing);
    var r = document.getElementById(tab);
    if (r) r.checked = true;
    document.querySelectorAll(".tab-radio").forEach(function (el) {
      el.addEventListener("change", function () { rememberTab(el.id); window.scrollTo(0, 0); });
    });
    window.scrollTo(0, y);
    if (editing) wireEdit(); else wireView();
  }

  function pullEdits() {
    document.querySelectorAll("[data-p]").forEach(function (el) {
      setP(state, el.getAttribute("data-p"), el.textContent.replace(/\s+/g, " ").trim());
    });
  }

  var NEW = {
    row: function () { return ["New exercise", "3 × 10"]; },
    text: function () { return "New item"; },
    session: function () { return { title: "New workout", tag: "", rows: [["Exercise", "3 × 10"]] }; },
    option: function () { return { title: "", macro: "", items: ["Food"] }; },
    meal: function () { return { title: "New meal", time: "", note: "", options: [{ title: "", macro: "", items: ["Food"] }] }; },
    recipe: function () { return { title: "New recipe", tag: "", macro: "", ings: ["Ingredient"], steps: ["Step"] }; }
  };
  var KINDS = ["rest", "lift", "run"];

  function wireEdit() {
    document.querySelectorAll("[data-p]").forEach(function (el) {
      el.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); el.blur(); } });
      el.addEventListener("paste", function (e) {
        e.preventDefault();
        var t = (e.clipboardData || window.clipboardData).getData("text");
        document.execCommand("insertText", false, t.replace(/\s+/g, " "));
      });
    });
    document.querySelectorAll("[data-del]").forEach(function (b) {
      b.onclick = function () {
        pullEdits();
        var ks = b.getAttribute("data-del").split("."), i = +ks.pop();
        getP(state, ks.join(".")).splice(i, 1);
        mount();
      };
    });
    document.querySelectorAll("[data-add]").forEach(function (b) {
      b.onclick = function () {
        pullEdits();
        getP(state, b.getAttribute("data-add")).push(NEW[b.getAttribute("data-kind")]());
        mount();
      };
    });
    document.querySelectorAll("[data-kind-i]").forEach(function (b) {
      b.onclick = function () {
        pullEdits();
        var d = state.week[+b.getAttribute("data-kind-i")];
        d.kind = KINDS[(KINDS.indexOf(d.kind) + 1) % KINDS.length];
        mount();
      };
    });
    document.getElementById("cancel-btn").onclick = function () {
      state = clone(saved);
      editing = false;
      mount();
    };
    document.getElementById("save-btn").onclick = function () {
      pullEdits();
      if (!store(state)) { toast("Couldn't save on this phone. Check your browser isn't in private mode."); return; }
      saved = clone(state);
      editing = false;
      mount();
      toast("Saved");
    };
  }

  // ---------- Menu: backup, restore, start over ----------
  var menuEl = null;
  function closeMenu() {
    if (menuEl) { menuEl.remove(); menuEl = null; }
    var b = document.getElementById("menu-btn");
    if (b) b.setAttribute("aria-expanded", "false");
  }
  function openMenu() {
    menuEl = document.createElement("div");
    menuEl.className = "menu";
    menuEl.innerHTML =
      '<button type="button" id="m-export">Export backup<small>Save your plan as a file, e.g. to move it to a new phone.</small></button>' +
      '<label>Restore backup<small>Replace this plan with one you exported.</small><input type="file" accept="application/json,.json" class="visually-hidden" id="m-import"></label>' +
      '<button type="button" id="m-reset" class="danger">Start over<small>Delete this plan and choose a new starting point.</small></button>';
    document.body.appendChild(menuEl);
    document.getElementById("menu-btn").setAttribute("aria-expanded", "true");
    document.getElementById("m-export").onclick = function () { exportPlan(); closeMenu(); };
    document.getElementById("m-import").onchange = function (e) { importPlan(e.target.files[0]); closeMenu(); };
    var reset = document.getElementById("m-reset"), armed = false;
    reset.onclick = function () {
      if (!armed) {
        armed = true;
        reset.innerHTML = "Tap again to delete your plan<small>This can't be undone unless you have a backup.</small>";
        return;
      }
      forget();
      saved = state = null;
      mount();
    };
  }
  function wireView() {
    document.getElementById("edit-btn").onclick = function () { editing = true; mount(); };
    document.getElementById("menu-btn").onclick = function () { if (menuEl) closeMenu(); else openMenu(); };
  }

  function exportPlan() {
    var data = JSON.stringify({ app: "witness-the-fitness", version: 1, plan: saved }, null, 1);
    var name = "witness-the-fitness-" + new Date().toISOString().slice(0, 10) + ".json";
    var file;
    try { file = new File([data], name, { type: "application/json" }); } catch (e) { file = null; }
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: "Plan backup" }).catch(function () {});
      return;
    }
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([data], { type: "application/json" }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  function validPlan(p) {
    return p && Array.isArray(p.week) && Array.isArray(p.sessions) && Array.isArray(p.meals) && Array.isArray(p.targets) &&
      Array.isArray(p.recipes) && Array.isArray(p.facts) && Array.isArray(p.tracking) && Array.isArray(p.dietNotes);
  }
  function importPlan(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var p;
      try { var j = JSON.parse(reader.result); p = j && j.plan ? j.plan : j; } catch (e) { p = null; }
      if (!validPlan(p)) { toast("That file isn't a plan backup."); return; }
      if (!store(p)) { toast("Couldn't save on this phone."); return; }
      saved = p;
      state = clone(p);
      editing = false;
      mount();
      toast("Plan restored");
    };
    reader.readAsText(file);
  }

  function wireWelcome() {
    document.querySelectorAll("[data-start]").forEach(function (b) {
      b.onclick = function () {
        var p = clone(window.PLAN_TEMPLATES[b.getAttribute("data-start")]);
        store(p);
        saved = p;
        state = clone(p);
        editing = b.getAttribute("data-start") === "blank";
        mount();
      };
    });
    document.getElementById("welcome-import").onchange = function (e) { importPlan(e.target.files[0]); };
  }

  document.addEventListener("click", function (e) {
    if (menuEl && !menuEl.contains(e.target) && e.target.id !== "menu-btn") closeMenu();
  });

  mount();

  if ("serviceWorker" in navigator && location.protocol === "https:") {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }
})();
