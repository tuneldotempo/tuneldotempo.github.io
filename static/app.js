// Progressive enhancement only: every page is readable without this script.
// Theme: CSS follows the system; a manual choice is stored and written to data-tema.
(function aplicarTemaSalvo() {
  try {
    const salvo = localStorage.getItem("tunel-tema");
    if (salvo === "claro" || salvo === "escuro") document.documentElement.dataset.tema = salvo;
  } catch (e) { /* storage blocked: follow the system */ }
})();

const ICONE_LUA = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';
const ICONE_SOL = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';

function temaEfetivo() {
  const escolhido = document.documentElement.dataset.tema;
  if (escolhido) return escolhido;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "escuro" : "claro";
}

function atualizarBotaoDeTema(botao) {
  const escuro = temaEfetivo() === "escuro";
  botao.innerHTML = escuro ? `${ICONE_SOL}<span>Claro</span>` : `${ICONE_LUA}<span>Noturno</span>`;
  botao.setAttribute("aria-label", escuro ? "Trocar para o tema claro" : "Trocar para o tema noturno");
}

function prepararTema() {
  const cabecalho = document.querySelector(".topo .wrap");
  if (!cabecalho) return;
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "tema";
  botao.addEventListener("click", () => {
    const novo = temaEfetivo() === "escuro" ? "claro" : "escuro";
    document.documentElement.dataset.tema = novo;
    try { localStorage.setItem("tunel-tema", novo); } catch (e) { /* storage blocked */ }
    atualizarBotaoDeTema(botao);
  });
  cabecalho.appendChild(botao);
  atualizarBotaoDeTema(botao);
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => atualizarBotaoDeTema(botao));
}

// Concentric rings receding toward 2030; color comes from CSS currentColor.
function desenharTunel(svg) {
  const ns = "http://www.w3.org/2000/svg";
  const el = (tag, attrs, text) => {
    const n = document.createElementNS(ns, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    if (text) n.textContent = text;
    svg.appendChild(n);
    return n;
  };
  const cx = 372, cy = 226, total = 9;
  const defs = el("defs", {});
  const grad = document.createElementNS(ns, "radialGradient");
  grad.setAttribute("id", "brilho");
  grad.innerHTML = '<stop offset="0" stop-color="currentColor" stop-opacity=".5"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/>';
  defs.appendChild(grad);
  el("circle", { cx, cy, r: 130, fill: "url(#brilho)" });
  const aneis = [];
  for (let i = 0; i < total; i++) {
    const t = i / (total - 1);
    const w = 596 * Math.pow(1 - t, 1.3) + 40 * t;
    const h = w * 0.82;
    const x = 310 + (cx - 310) * t - w / 2;
    const y = 262 + (cy - 262) * t - h / 2;
    const rx = Math.max(8, w * 0.11);
    aneis.push({ x, y, h, rx });
    el("rect", { x, y, width: w, height: h, rx, fill: i === total - 1 ? "currentColor" : "none", stroke: "currentColor", "stroke-opacity": Math.min(1, 0.16 + 0.8 * t), "stroke-width": 1.5 });
  }
  const rotulo = (txt, x, y, forte) => el("text", { x, y, class: forte ? "ano forte" : "ano", style: "paint-order:stroke;stroke:var(--bg);stroke-width:8px" }, txt);
  [[0, "2026"], [2, "2027"], [4, "2028"], [6, "2029"]].forEach(([i, ano]) => rotulo(ano, aneis[i].x + aneis[i].rx + 4, aneis[i].y + 4, false));
  rotulo("2030", cx - 20, cy + 46, true);
  const aqui = svg.dataset.aqui;
  if (aqui) {
    const a = aneis[0];
    const gx = a.x + 36, gy = a.y + a.h - 15;
    el("rect", { x: gx, y: gy, width: 212, height: 30, rx: 15, fill: "var(--card)", stroke: "var(--line)" });
    el("circle", { cx: gx + 16, cy: gy + 15, r: 4, fill: "currentColor" });
    el("text", { x: gx + 28, y: gy + 19.5, class: "ano", style: "fill:var(--text)" }, aqui);
  }
}

// Hover tooltip for chart marks carrying data-dica; the chart also has <title> and a table.
function prepararDicas() {
  document.querySelectorAll(".grafico").forEach((g) => {
    const dica = g.querySelector(".dica");
    if (!dica) return;
    g.querySelectorAll("[data-dica]").forEach((m) => {
      m.addEventListener("mouseenter", () => {
        const gr = g.getBoundingClientRect();
        const mr = m.getBoundingClientRect();
        dica.textContent = m.dataset.dica;
        dica.style.left = `${mr.left - gr.left + mr.width / 2}px`;
        dica.style.top = `${mr.top - gr.top}px`;
        dica.style.opacity = "1";
      });
      m.addEventListener("mouseleave", () => { dica.style.opacity = "0"; });
    });
  });
}

// Filters: each form[data-filtros] narrows the [data-item] elements of the nearest [data-lista].
// Without JavaScript the form stays hidden and the whole list shows.
function prepararFiltros() {
  document.querySelectorAll("[data-filtros]").forEach((form) => {
    const lista = form.closest("[data-lista]");
    if (!lista) return;
    const aplicar = () => {
      const criterios = [...new FormData(form).entries()].filter(([, valor]) => valor);
      let visiveis = 0;
      lista.querySelectorAll("[data-item]").forEach((item) => {
        const passa = criterios.every(([campo, valor]) => item.dataset[campo] === valor);
        item.hidden = !passa;
        if (passa) visiveis += 1;
      });
      lista.querySelectorAll("[data-grupo]").forEach((grupo) => {
        grupo.hidden = !grupo.querySelector("[data-item]:not([hidden])");
      });
      const vazio = lista.querySelector("[data-vazio]");
      if (vazio) vazio.hidden = visiveis > 0;
    };
    form.addEventListener("change", aplicar);
    form.hidden = false;
  });
}

// Search runs over /busca/indice.json; results are built with DOM nodes and textContent only.
function normalizar(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

const PALAVRAS_VAZIAS = new Set(["a", "o", "as", "os", "e", "de", "da", "do", "das", "dos", "em", "no", "na", "nos", "nas"]);

function termosDe(consulta) {
  return normalizar(consulta).split(/[^\p{L}\p{N}]+/u).filter((t) => t && !PALAVRAS_VAZIAS.has(t));
}

// A term matches only at the start of a word, never in the middle of one.
function comecaPalavra(texto, i) {
  return i === 0 || !/[\p{L}\p{N}]/u.test(texto[i - 1]);
}

function grifar(elemento, texto, termos) {
  const comparavel = normalizar(texto);
  if (comparavel.length !== texto.length) { elemento.textContent = texto; return; }
  const marcado = new Array(texto.length).fill(false);
  for (const termo of termos) {
    for (let i = comparavel.indexOf(termo); i !== -1; i = comparavel.indexOf(termo, i + 1)) {
      if (!comecaPalavra(comparavel, i)) continue;
      for (let k = i; k < i + termo.length; k += 1) marcado[k] = true;
    }
  }
  for (let i = 0; i < texto.length;) {
    let j = i;
    while (j < texto.length && marcado[j] === marcado[i]) j += 1;
    const pedaco = texto.slice(i, j);
    if (marcado[i]) {
      const mark = document.createElement("mark");
      mark.textContent = pedaco;
      elemento.appendChild(mark);
    } else {
      elemento.appendChild(document.createTextNode(pedaco));
    }
    i = j;
  }
}

async function prepararBusca() {
  const area = document.getElementById("resultados");
  const campo = document.querySelector(".busca-campo");
  if (!area || !campo) return;
  const indice = await (await fetch("/busca/indice.json")).json();
  const mostrar = () => {
    const termos = termosDe(campo.value);
    area.replaceChildren();
    if (!termos.length) return;
    const achados = indice.filter((item) => termos.every((t) => ` ${item.busca}`.includes(` ${t}`)));
    const resumo = document.createElement("p");
    resumo.className = "nota-dados";
    resumo.textContent = achados.length
      ? `${achados.length} resultado${achados.length > 1 ? "s" : ""}`
      : "Nada encontrado. Tente o nome, o partido, o estado ou o tema.";
    area.appendChild(resumo);
    for (const [tipo, rotulo] of [["pessoa", "Pessoas"], ["registro", "Registros"]]) {
      const grupo = achados.filter((item) => item.tipo === tipo);
      if (!grupo.length) continue;
      const secao = document.createElement("section");
      secao.className = "grupo-resultados";
      const titulo = document.createElement("p");
      titulo.className = "label";
      titulo.textContent = rotulo;
      secao.appendChild(titulo);
      for (const item of grupo) {
        const link = document.createElement("a");
        link.className = "resultado";
        link.href = item.url;
        const nome = document.createElement("b");
        grifar(nome, item.titulo, termos);
        const detalhe = document.createElement("span");
        detalhe.className = "nota-dados";
        detalhe.textContent = item.subtitulo;
        link.append(nome, detalhe);
        secao.appendChild(link);
      }
      area.appendChild(secao);
    }
  };
  const pedido = new URLSearchParams(location.search).get("q");
  if (pedido) campo.value = pedido;
  campo.addEventListener("input", () => {
    mostrar();
    const url = new URL(location.href);
    if (campo.value) url.searchParams.set("q", campo.value); else url.searchParams.delete("q");
    history.replaceState(null, "", url);
  });
  mostrar();
}

document.addEventListener("DOMContentLoaded", () => {
  prepararBusca();
  prepararTema();
  prepararFiltros();
  document.querySelectorAll("svg.tunel").forEach(desenharTunel);
  prepararDicas();
});
