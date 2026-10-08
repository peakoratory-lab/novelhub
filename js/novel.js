const novelParams=new URLSearchParams(location.search);
if(novelParams.get("id")==="seirei-gensouki")history.replaceState(null,"",`novel.html?id=seirei-gensouki-volume-1`);
Promise.all([load(),readStats()]).then(([ns,stats])=>{
  const n=ns.find(x=>x.id===novelParams.get("id"))||ns[0];
  if(!n)return;
  const reads=readMap(stats)[n.id]||0;
  const chapterStats=(stats.chapters||[]).filter(item=>item.novelId===n.id);
  const volumeStats=(stats.volumes||[]).filter(item=>item.novelId===n.id);
  const chapterReads=c=>{const found=chapterStats.find(item=>String(item.chapter)===String(c.number));return found?.reads||0};
  const volumeReads=v=>volumeStats.find(item=>Number(item.volume)===Number(v))?.reads||0;
  document.title=`${n.title} — NovelHub`;
  const grouped=n.chapters.reduce((g,c)=>{(g[c.volume||1]||[]).push(c);return g},{});
  const volumes=n.chapters.length?Object.entries(grouped).map(([v,items],i)=>`<details class="volume" ${i===0?"open":""}><summary><span>Volume ${v}</span><small>${items.length} capítulo${items.length===1?"":"s"} · ${readLabel(volumeReads(v))}</small></summary><div class="volume-chapters">${items.map(c=>`<a class="chapter" href="reader.html?id=${n.id}&chapter=${c.slug||c.number}"><span><b>${c.label||`Capítulo ${c.number}`}</b> — ${c.title}</span><span class="chapter-read-count">◉ ${readLabel(chapterReads(c))}</span><span>→</span></a>`).join("")}</div></details>`).join(""):`<p class="empty-chapters">Nenhum capítulo publicado ainda. Este volume chega em breve.</p>`;
  const button=n.chapters.length?`<a class="primary" href="reader.html?id=${n.id}&chapter=${n.chapters[0].slug||n.chapters[0].number}">Começar a ler →</a>`:`<span class="primary is-disabled">Leitura em breve</span>`;
  $("#novelPage").innerHTML=`<div class="breadcrumbs"><a href="explorar.html">Explorar</a><span> / </span>${n.title}</div><section class="novel"><div class="novel-cover"><img src="images/${n.cover}" alt="Capa de ${n.title}"><span class="novel-cover-label">${n.status}</span></div><div><label>${n.status.toUpperCase()}</label><h1>${n.title}</h1><div class="author">por ${n.author}</div>${n.translator?`<div class="translator">Tradução: ${n.translator}</div>`:""}<div class="tags">${n.genres.map(g=>`<span class="tag">${g}</span>`).join("")}</div><div class="novel-reading"><span class="reading-orbit">◉</span><div><strong>${reads}</strong><span>${reads===1?"leitura registrada":"leituras registradas"}</span></div><small>contagem da comunidade</small>${favoriteButton(n.id)}</div><p class="desc">${n.description}</p>${button}</div></section><section class="info-channel"><div class="channel-label">INFO DO VOLUME</div><div class="info-copy"><p>${n.info}</p></div></section><section class="chapter-section"><div class="section-heading"><div><label>LEITURA</label><h2>Capítulos deste volume</h2></div><span>${n.chapters.length} disponível${n.chapters.length===1?"":"eis"}</span></div><div class="chapters">${volumes}</div></section>`;
  bindFavoriteButtons(document);
});