const API_BASE=(window.NOVELHUB_CONFIG?.apiBase||"").replace(/\/$/,"");
const hashParts=location.hash.replace(/^#/,"").split("/"), p = new URLSearchParams(location.search), requestedId = p.get("id") || hashParts[0], id = requestedId === "seirei-gensouki" ? "seirei-gensouki-volume-1" : requestedId, chapterParam = p.get("chapter") || hashParts[1];

async function recordRead(n, chapter) {
  if (!API_BASE) return;
  const key = "novelhub-reader-visitor";
  let visitorId = localStorage.getItem(key);
  if (!visitorId) {
    visitorId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now();
    localStorage.setItem(key, visitorId);
  }
  try {
    await fetch(API_BASE + "/api/reads", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({novelId:n.id, volume:chapter.volume||1, chapter:String(chapter.number), visitorId})
    });
  } catch (error) {
    console.warn("Não foi possível registrar a leitura.", error);
  }
}

load().then(async ns => {
  const n = ns.find(x => x.id === id) || ns[0];
  const requestedChapterNumber = chapterParam && /\d+/.test(chapterParam) ? String(Number(chapterParam.match(/\d+/)[0])) : chapterParam;
  const foundIndex = chapterParam ? n.chapters.findIndex(c => String(c.number) === requestedChapterNumber || c.slug === chapterParam) : 0;
  const i = foundIndex >= 0 ? foundIndex : 0;
  const c = n.chapters[i] || {number:0,label:"Prólogo",title:"Prólogo",file:"prologo.html",volume:1};
  const storageId = n.id === "eighty-six-volume-1" ? "eighty-six" : (n.id === "the-eminence-in-shadow-volume-1" ? "the-eminence-in-shadow" : n.id);
  const chapterUrl = `novels/${storageId}/${c.file}`;
  const chapterKey = n.id === "eighty-six-volume-1" ? "eighty-six" : (n.id === "the-eminence-in-shadow-volume-1" ? "the-eminence-in-shadow" : n.id);
  let html = (window.CHAPTERS && window.CHAPTERS[chapterKey] && window.CHAPTERS[chapterKey][Number(c.number)]) || "<p>Capítulo não encontrado.</p>";

  const embeddedChapter = window.CHAPTERS && window.CHAPTERS[chapterKey] && window.CHAPTERS[chapterKey][Number(c.number)];
  if (embeddedChapter) html = embeddedChapter;
  if (location.protocol !== "file:" && !embeddedChapter) {
    try {
      const response = await fetch(chapterUrl);
      if (response.ok) html = await response.text();
    } catch (error) {
      console.warn("Capítulo externo indisponível; mantendo o conteúdo interno.", error);
    }
  }

  const chapterLabel = c.label || `Cap. ${c.number}`;
  document.title = `${n.title} — ${chapterLabel} — NovelHub`;
  recordRead(n, c);
  $("#backNovel").href = `novel.html?id=${n.id}`;
  $("#readerTitle").textContent = `${n.title} · ${chapterLabel}: ${c.title}`;
  $("#reader").innerHTML = html + `<div class="endmark">✦ Fim do ${c.label || `Capítulo ${c.number}`} ✦</div>`;

  const prev = n.chapters[i - 1], next = n.chapters[i + 1];
  const prevBtn = $("#prevChap"), nextBtn = $("#nextChap");
  if (prev) prevBtn.href = `reader.html?id=${n.id}&chapter=${prev.number}`;
  else prevBtn.classList.add("disabled");
  if (next) nextBtn.href = `reader.html?id=${n.id}&chapter=${next.number}`;
  else { nextBtn.href = `novel.html?id=${n.id}`; nextBtn.textContent = "Voltar à novel →"; }

  document.onkeydown = e => {
    if (e.key === "ArrowLeft" && prev) location.href = prevBtn.href;
    if (e.key === "ArrowRight" && next) location.href = nextBtn.href;
  };

  const bar = $("#progressBar"), h = document.documentElement;
  const onScroll = () => {
    const max = h.scrollHeight - h.clientHeight;
    bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
  };
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  let size = Number(localStorage.getItem("fontSize") || 19);
  const applySize = () => { $("#reader").style.fontSize = size + "px"; localStorage.setItem("fontSize", size); };
  $("#fontPlus").onclick = () => { size = Math.min(28, size + 1); applySize(); };
  $("#fontMinus").onclick = () => { size = Math.max(15, size - 1); applySize(); };
  applySize();

  if (localStorage.getItem("paper") === "dark") document.body.classList.add("paper-dark");
  $("#paperToggle").onclick = () => {
    document.body.classList.toggle("paper-dark");
    localStorage.setItem("paper", document.body.classList.contains("paper-dark") ? "dark" : "light");
  };
});
