/* Lumen Stadium: fly in, pick a stand, a block and a seat, see the pitch from it, book it.
 * Seven full-screen views that replace each other. Two of the moves are video clips (from the sky into the stadium,
 * and from the block into the seat); every other move is a zoom into the place that was clicked.
 * All the words and positions are in config.js. Nothing is really booked. */
(() => {
  "use strict";
  const D = window.LUMEN, W = D.words, DIR = "assets/stadium";
  const $ = (id) => document.getElementById(id);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const money = (n) => `${D.money}${Number(n).toLocaleString("en-GB")}`;
  const views = Object.fromEntries([...document.querySelectorAll(".view")].map((v) => [v.dataset.view, v]));

  // ---------- pictures: a small copy first if there is one, then the full picture; an empty slot says which file it wants ----------
  const found = new Map();
  function find(name) {
    if (!found.has(name)) {
      found.set(name, new Promise((resolve) => {
        const types = ["webp", "jpg", "png"], attempt = (n) => {
          if (n >= types.length) return resolve(null);
          const img = new Image(); img.onload = () => resolve(img.src); img.onerror = () => attempt(n + 1); img.src = `${DIR}/${name}.${types[n]}`;
        };
        attempt(0);
      }));
    }
    return found.get(name);
  }
  function picture(view, name) {
    const el = views[view].querySelector("[data-pic]");
    if (el.dataset.want === name) return;
    el.dataset.want = name; el.classList.remove("is-empty"); el.style.backgroundImage = "";
    find(name).then((url) => {
      if (el.dataset.want !== name) return;
      if (url) el.style.backgroundImage = `url("${url}")`; else { el.classList.add("is-empty"); el.dataset.file = `${W.waiting} ${name}.webp`; }
    });
  }
  // Which clips exist is asked once. Each one that does is then fetched whole, one after the other, and kept in memory,
  // so it plays at once and never waits for the network in the middle.
  const clips = {}, held = {};
  const CLIPS = ["intro", "view-upper", "intro-back", "view-lower", "view-vip", "seat"];
  const clipSrc = (name) => held[name] || `${DIR}/${name}.mp4`;
  const hold = (name) => fetch(`${DIR}/${name}.mp4`).then((r) => (r.ok ? r.blob() : null)).then((b) => { if (b) held[name] = URL.createObjectURL(b); }).catch(() => {});
  Promise.all(CLIPS.map((name) => fetch(`${DIR}/${name}.mp4`, { method: "HEAD" }).then((r) => { clips[name] = r.ok; }).catch(() => { clips[name] = false; })))
    .then(() => CLIPS.filter((name) => clips[name]).reduce((chain, name) => chain.then(() => hold(name)), Promise.resolve()));

  // ---------- the state ----------
  const S = { view: "intro", stand: null, tier: null, block: null, seat: null, vip: false };
  const origin = { x: 50, y: 50 };                                     // where the last click was, in percent of the screen
  const at = (e) => { origin.x = (e.clientX / innerWidth) * 100; origin.y = (e.clientY / innerHeight) * 100; };
  const UP = { bowl: "intro", stand: "bowl", block: "stand", seat: "block", vip: "stand", booked: "intro" };

  // a random number that is the same every time for the same seed, so the taken seats do not move
  const rand = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  // which seats of a block are taken: the same answer wherever it is asked, so the counts and the seats agree
  const seedOf = (blockNo, stand) => blockNo * 7919 + [...(stand ? stand.id : "")].reduce((n, c) => n + c.charCodeAt(0), 0) * 131;
  // every seat of a block, section by section: where it is on the picture, how big, and whether it is taken
  function seatsOf(blockNo, tier, stand) {
    const b = D.blocks[tier], r = rand(seedOf(blockNo, stand)), out = []; let first = 1;
    b.sections.forEach((sec) => {
      const [tl, tr, br, bl] = sec.corners, f = sec.fans, n = sec.rows, g = sec.grow; let most = 0;
      for (let row = 0; row < n; row++) {
        const v = n > 1 ? (g ** row - 1) / (g ** (n - 1) - 1) : 0;              // rows nearer the camera are further apart
        const l = tl[0] + (bl[0] - tl[0]) * v, rt = tr[0] + (br[0] - tr[0]) * v, y = tl[1] + (bl[1] - tl[1]) * v;
        const m = Math.round((rt - l) / (sec.pitch[0] + (sec.pitch[1] - sec.pitch[0]) * v)) + 1;   // as many seats as fit in this row
        most = Math.max(most, m);
        for (let c = 0; c < m; c++) {
          const u = c / (m - 1), roll = r();
          out.push({ row: b.firstRow + (n - 1 - row), seat: first + c, x: l + (rt - l) * u, y, size: (rt - l) / (m - 1) * 0.76,
            taken: f ? (u >= f[0] && v >= f[1] && u <= f[2] && v <= f[3]) : roll < D.takenShare });
        }
      }
      first += most;
    });
    return out.filter((x) => x.x > 1.5 && x.x < 98.5);
  }
  const tierOf = (no, id) => D.stand.tiers.find((t) => (!id || t.id === id) && no >= t.first && no < t.first + t.cats.length);
  const catOf = (no, id = S.vip ? "vip" : S.tier) => { const t = tierOf(no, id); return D.categories[t.cats[no - t.first]]; };
  const leftIn = (blockNo, tier, stand = S.stand) => seatsOf(blockNo, tier, stand).filter((x) => !x.taken).length;

  // ---------- moving between views ----------
  let running = [];
  function swap(prev, next, dir) {
    running.forEach((a) => a.finish()); running = [];
    next.hidden = false;
    if (reduced || !prev.animate) { prev.hidden = true; return; }
    const spot = `${origin.x}% ${origin.y}%`, easing = "cubic-bezier(0.6, 0, 0.2, 1)";
    const near = { transform: "scale(3)", filter: "blur(14px)", opacity: 0 }, here = { transform: "scale(1)", filter: "blur(0px)", opacity: 1 };
    let leaving, arriving;
    if (dir === "in") {
      prev.style.transformOrigin = spot; prev.style.zIndex = 2;
      leaving = prev.animate([here, near], { duration: 850, easing });
      arriving = next.animate([{ transform: "scale(1.12)", opacity: 0 }, { transform: "scale(1)", opacity: 1 }], { duration: 850, easing });
    } else {
      next.style.transformOrigin = spot; next.style.zIndex = 2;
      leaving = prev.animate([{ transform: "scale(1)", opacity: 1 }, { transform: "scale(0.94)", opacity: 0 }], { duration: 600, easing });
      arriving = next.animate([near, here], { duration: 850, easing });
    }
    running = [leaving, arriving];
    leaving.onfinish = () => { prev.hidden = true; [prev, next].forEach((v) => { v.style.transformOrigin = ""; v.style.zIndex = ""; }); };
  }
  // a clip plays over everything; the next view is put in place under it and the clip fades away
  function play(name, prev, next, then) {
    const v = $("clip"), live = $("live"), root = document.documentElement; let over = false, cover = 0;
    const end = (ok) => {
      if (over) return; over = true; clearTimeout(cover); v.onended = v.onerror = v.oncanplay = null; root.classList.remove("playing"); prev.style.visibility = "";
      if (!ok) { v.classList.remove("on"); swap(prev, next, "in"); then(); return; }
      next.hidden = false; prev.hidden = true; then();
      v.classList.remove("on"); setTimeout(() => { v.removeAttribute("src"); v.load(); }, 500);
    };
    v.onended = () => end(true); v.onerror = () => end(false);
    v.oncanplay = () => {
      v.oncanplay = null; v.playbackRate = D.clipSpeed || 1;
      live.pause();                                              // nothing else moves while the clip plays
      v.classList.add("on"); root.classList.add("playing");      // the bar's Back and step hide too
      cover = setTimeout(() => { if (!over) prev.style.visibility = "hidden"; }, 500);   // once the clip covers the view under it, that view is not drawn
      v.play().catch(() => end(false));
    };
    v.src = clipSrc(name); v.load();
    setTimeout(() => { if (v.readyState < 2) end(false); }, 4000);
  }
  function go(view, how = "in", clip) {
    const prev = views[S.view], next = views[view];
    if (prev === next) { chrome(); return; }
    hideTag();
    const done = () => { S.view = view; chrome(); if (view !== "seat") { $("live").classList.remove("on"); $("live").pause(); } };
    if (clip && clips[clip] && !reduced) play(clip, prev, next, done); else { swap(prev, next, how); done(); }
  }
  const back = () => { if (S.view === "seat" && S.vip) { render.vip(); go("vip", "out"); } else if (UP[S.view]) { if (S.view === "vip") S.vip = false; go(UP[S.view], "out"); } };

  // ---------- the bar: where you are ----------
  function chrome() {
    const v = S.view, T = D.steps;
    const names = { bowl: [`${T.of} 1 of 3`, T.stand], stand: [`${T.of} 2 of 3`, S.stand ? S.stand.name : ""], block: [`${T.of} 3 of 3`, `${W.block} ${S.block} · ${T.seat}`],
      vip: [`${W.box} ${S.block} · ${S.stand ? S.stand.name : ""}`, T.vip], seat: ["", ""], intro: ["", ""], booked: ["", ""] }[v];
    $("stepNo").textContent = names[0]; $("stepName").textContent = names[1]; $("step").hidden = !names[1];
    $("back").hidden = v === "intro" || v === "booked"; $("backText").textContent = W.back;
    document.documentElement.dataset.view = v;
  }

  // ---------- the tag that follows what you point at ----------
  const tag = $("tag");
  function showTag(el, html) {
    tag.innerHTML = html; tag.hidden = false;
    const b = el.getBoundingClientRect(), t = tag.getBoundingClientRect();
    let left = b.left + b.width / 2 - t.width / 2, top = b.top - t.height - 12;
    if (top < 76) top = b.bottom + 12;
    tag.style.left = `${Math.max(10, Math.min(innerWidth - t.width - 10, left))}px`; tag.style.top = `${top}px`;
  }
  function hideTag() { tag.hidden = true; }
  const hover = (box, sel, html) => {
    box.addEventListener("pointerover", (e) => { const el = e.target.closest(sel); if (el) showTag(el, html(el)); else hideTag(); });
    box.addEventListener("pointerleave", hideTag);
  };

  // ---------- what each view shows ----------
  const render = {
    intro() { picture("intro", D.intro.picture); },
    bowl() {
      picture("bowl", D.bowl.picture);
      $("standAreas").innerHTML = D.bowl.stands.map((s, i) => `<polygon data-i="${i}" points="${s.area.map((p) => p.join(",")).join(" ")}" tabindex="0" role="button" aria-label="${esc(s.name)}"></polygon>`).join("");
    },
    stand() {
      picture("stand", D.stand.picture);
      $("blockAreas").innerHTML = D.stand.tiers.map((t) => t.cats.map((c, k) => {
        const no = t.first + k, cat = D.categories[c], x0 = t.edges[k], x1 = t.edges[k + 1];
        return `<button type="button" class="blk${t.id === "vip" ? " is-vip" : ""}" data-no="${no}" data-tier="${t.id}" style="left:${x0}%;top:${t.top}%;width:${(x1 - x0).toFixed(2)}%;height:${(t.bottom - t.top).toFixed(2)}%;--c:${cat.color}" aria-label="${t.id === "vip" ? W.box : W.block} ${no}, ${money(cat.price)}"></button>`;
      }).join("")).join("");
      $("legend").innerHTML = [1, 2, 3, 4, "vip"].map((c) => `<li><i style="background:${D.categories[c].color}"></i>${c === "vip" ? esc(W.vipCat) : `${esc(W.category)} ${c}`}<b>${money(D.categories[c].price)}</b></li>`).join("");
    },
    block() {
      const b = D.blocks[S.tier], price = catOf(S.block).price;
      picture("block", b.picture);
      const dots = seatsOf(S.block, S.tier, S.stand).map((x) => `<button type="button" class="st${x.taken ? " taken" : ""}" data-row="${x.row}" data-seat="${x.seat}" style="left:${x.x.toFixed(2)}%;top:${x.y.toFixed(2)}%;width:${x.size.toFixed(2)}%" ${x.taken ? 'tabindex="-1"' : ""} aria-label="${W.row} ${x.row}, ${W.seat} ${x.seat}, ${x.taken ? W.taken : money(price)}"></button>`);
      $("seats").innerHTML = dots.join(""); $("seatChip").innerHTML = `<small>${esc(W.yourSeat)}</small>${esc(W.pick)}`;
    },
    seat() {
      const vip = S.vip, name = vip ? D.vip.view : D.blocks[S.tier].view;
      picture("seat", name);
      const live = $("live");                                    // the same view as a short clip of the match, looping
      live.classList.remove("on"); live.pause();
      if (clips[name] && !reduced) { live.src = clipSrc(name); live.oncanplay = () => { live.classList.add("on"); live.play().catch(() => {}); }; live.load(); }
      $("ticket").innerHTML = ticket(false);
      $("seatActions").innerHTML = `<button class="btn btn-ghost" type="button" data-do="another">${esc(W.another)}</button>${vip ? "" : `<button class="btn btn-gold" type="button" data-do="vip">${esc(W.goVip)}</button>`}<button class="btn btn-light" type="button" data-do="confirm">${esc(W.confirm)}</button>`;
    },
    vip() {
      picture("vip", D.vip.picture);
      $("chairs").innerHTML = D.vip.chairs.map((c, i) => { const taken = D.vip.taken.includes(i), n = D.vip.chairs.slice(0, i + 1).filter((o) => o.row === c.row).length;
        return `<button type="button" class="chair${taken ? " taken" : ""}" data-row="${c.row}" data-seat="${n}" style="left:${c.x}%;top:${c.y}%" aria-label="${W.row} ${c.row}, ${W.seat} ${n}, ${taken ? W.taken : money(D.categories.vip.price)}"></button>`; }).join("");
      $("vipChip").innerHTML = `<small>${esc(W.yourSeat)}</small>${esc(W.pick)}`;
    },
    booked() { picture("booked", D.intro.picture); $("bookedTicket").innerHTML = ticket(true); },
  };
  function ticket(booked) {
    const vip = S.vip, price = vip ? D.categories.vip.price : catOf(S.block).price, where = vip ? `${W.box} ${S.block}` : `${W.block} ${S.block}`;
    return `<div class="tk-main">
        <p class="tk-top"><b>${esc(D.cup)}</b><span>${esc(D.event)}</span></p>
        <h2>${booked ? `<em>${esc(W.booked)}</em>` : esc(vip ? where : W.yourSeat)}</h2>
        <dl><div><dt>Stand</dt><dd>${esc(S.stand.name)}${vip ? " · VIP" : ""}</dd></div><div><dt>${vip ? "Box" : "Block"} · ${esc(W.row)}</dt><dd>${S.block} · ${S.seat.row}</dd></div>
          <div><dt>${esc(W.seat)}</dt><dd>${S.seat.n}</dd></div><div><dt>${esc(W.total)}</dt><dd>${money(price)}</dd></div></dl>
        <p class="tk-foot">${esc(D.stadium)}</p>
      </div>
      <div class="tk-stub"><svg viewBox="0 0 60 44" aria-hidden="true"><rect x="2" y="2" width="56" height="40" rx="12" fill="none" stroke="currentColor" stroke-width="2"/><rect x="16" y="13" width="28" height="18" rx="2" fill="currentColor" opacity=".9"/></svg><i></i></div>`;
  }

  // ---------- clicks ----------
  $("enter").addEventListener("click", (e) => { at(e); render.bowl(); go("bowl", "in", "intro"); });
  $("standAreas").addEventListener("click", (e) => { const p = e.target.closest("polygon"); if (!p) return; at(e); S.stand = D.bowl.stands[+p.dataset.i]; render.stand(); go("stand"); });
  $("standAreas").addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.matches("polygon")) e.target.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: innerWidth / 2, clientY: innerHeight / 2 })); });
  $("blockAreas").addEventListener("click", (e) => {
    const b = e.target.closest(".blk"); if (!b) return; at(e); S.block = +b.dataset.no;
    if (b.dataset.tier === "vip") { S.vip = true; S.tier = null; render.vip(); go("vip"); } else { S.vip = false; S.tier = b.dataset.tier; render.block(); go("block"); }
  });
  $("seats").addEventListener("click", (e) => { const s = e.target.closest(".st:not(.taken)"); if (!s) return; at(e); S.seat = { row: s.dataset.row, n: s.dataset.seat }; render.seat(); go("seat", "in", D.blocks[S.tier].clip); });
  $("chairs").addEventListener("click", (e) => { const c = e.target.closest(".chair:not(.taken)"); if (!c) return; at(e); S.seat = { row: c.dataset.row, n: c.dataset.seat }; render.seat(); go("seat"); });
  $("seatActions").addEventListener("click", (e) => {
    const b = e.target.closest("[data-do]"); if (!b) return; at(e);
    if (b.dataset.do === "another") back();
    if (b.dataset.do === "vip") { S.vip = true; S.block = D.stand.tiers.find((t) => t.id === "vip").first + 2; render.vip(); go("vip"); }
    if (b.dataset.do === "confirm") { render.booked(); go("booked", "out", "intro-back"); }
  });
  $("again").addEventListener("click", (e) => { at(e); S.vip = false; render.bowl(); go("bowl", "in"); });
  $("back").addEventListener("click", (e) => { at(e); back(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("back").hidden) { origin.x = origin.y = 50; back(); } });

  hover($("standAreas"), "polygon", (el) => { const s = D.bowl.stands[+el.dataset.i], left = D.stand.tiers.filter((t) => t.id !== "vip").reduce((a, t) => a + t.cats.reduce((x, _, k) => x + leftIn(t.first + k, t.id, s), 0), 0);
    return `<small>Stand</small><b>${esc(s.name)}</b><span>${esc(W.from)} ${money(D.categories[4].price)} · ${left.toLocaleString("en-GB")} ${esc(W.left)}</span>`; });
  hover($("blockAreas"), ".blk", (el) => { const no = +el.dataset.no, vip = el.dataset.tier === "vip", t = tierOf(no, el.dataset.tier), c = t.cats[no - t.first], cat = D.categories[c];
    return `<small>${esc(S.stand.name)} · ${vip ? esc(W.vipCat) : `${esc(W.category)} ${c}`}</small><b>${vip ? esc(W.box) : esc(W.block)} ${no}</b><span>${money(cat.price)} · ${vip ? D.vip.chairs.length - D.vip.taken.length : leftIn(no, el.dataset.tier)} ${esc(W.left)}</span>`; });
  hover($("seats"), ".st", (el) => `<b>${esc(W.row)} ${el.dataset.row} · ${esc(W.seat)} ${el.dataset.seat}</b><span>${el.classList.contains("taken") ? esc(W.taken) : money(catOf(S.block).price)}</span>`);
  hover($("chairs"), ".chair", (el) => `<b>${esc(W.row)} ${el.dataset.row} · ${esc(W.seat)} ${el.dataset.seat}</b><span>${el.classList.contains("taken") ? esc(W.taken) : money(D.categories.vip.price)}</span>`);

  // ---------- the words that never change, and the first view ----------
  $("markCup").textContent = D.cup; $("markEvent").textContent = D.event;
  $("introEyebrow").textContent = D.intro.eyebrow; $("introTitle").textContent = D.intro.title; $("introText").textContent = D.intro.text; $("enter").textContent = D.intro.button;
  $("demoNote").textContent = W.demo; $("again").textContent = W.again;
  render.intro(); chrome();
  // the next pictures are fetched while the first one is looked at
  find(D.intro.picture).then(() => [D.bowl.picture, D.stand.picture].forEach(find));

  // ---------- reading positions (?place in the address) ----------
  if (new URLSearchParams(location.search).has("place")) {
    const out = $("placeRead"); out.hidden = false; out.textContent = "Click on a picture to read a position.";
    document.addEventListener("click", (e) => { const f = views[S.view].querySelector(".frame").getBoundingClientRect(); out.textContent = `[${(((e.clientX - f.left) / f.width) * 100).toFixed(1)}, ${(((e.clientY - f.top) / f.height) * 100).toFixed(1)}]`; }, true);
  }
  window.__lumen = { S, go, render, back, clips };
})();
