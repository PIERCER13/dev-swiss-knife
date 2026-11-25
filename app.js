// @author piercer
const STORAGE_KEY = "piercer_dev_knife_v1";
const $ = (id) => document.getElementById(id);

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      jsonInput: $("jsonInput").value,
      encInput: $("encInput").value,
      jwtInput: $("jwtInput").value,
      rxPattern: $("rxPattern").value,
      rxFlags: $("rxFlags").value,
      rxText: $("rxText").value,
      cronInput: $("cronInput").value,
    }));
  } catch {}
}

try {
  const s = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  if (s) {
    ["jsonInput", "encInput", "jwtInput", "rxPattern", "rxFlags", "rxText", "cronInput"].forEach((id) => {
      if (s[id] !== undefined) $(id).value = s[id];
    });
  }
} catch {}

document.querySelectorAll(".pill").forEach((p) => {
  p.addEventListener("click", () => {
    document.querySelectorAll(".pill").forEach((x) => x.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((x) => x.classList.remove("active"));
    p.classList.add("active");
    $(`tab-${p.dataset.tab}`).classList.add("active");
  });
});

// JSON
$("jsonFormatBtn").addEventListener("click", () => {
  try {
    $("jsonInput").value = JSON.stringify(JSON.parse($("jsonInput").value), null, 2);
    $("jsonStatus").textContent = "JSON válido e formatado.";
    $("jsonStatus").style.color = "var(--green)";
    saveState();
  } catch (e) {
    $("jsonStatus").textContent = `Erro: ${e.message}`;
    $("jsonStatus").style.color = "var(--red)";
  }
});

$("jsonMinBtn").addEventListener("click", () => {
  try {
    $("jsonInput").value = JSON.stringify(JSON.parse($("jsonInput").value));
    $("jsonStatus").textContent = "JSON minificado.";
    $("jsonStatus").style.color = "var(--green)";
    saveState();
  } catch (e) {
    $("jsonStatus").textContent = `Erro: ${e.message}`;
    $("jsonStatus").style.color = "var(--red)";
  }
});

// Encode & Hash
$("b64EncBtn").addEventListener("click", () => {
  $("encOutput").value = btoa(unescape(encodeURIComponent($("encInput").value)));
  saveState();
});
$("b64DecBtn").addEventListener("click", () => {
  try { $("encOutput").value = decodeURIComponent(escape(atob($("encInput").value.trim()))); }
  catch { $("encOutput").value = "Base64 inválido."; }
});
$("urlEncBtn").addEventListener("click", () => { $("encOutput").value = encodeURIComponent($("encInput").value); });
$("urlDecBtn").addEventListener("click", () => {
  try { $("encOutput").value = decodeURIComponent($("encInput").value); }
  catch { $("encOutput").value = "URL inválida."; }
});
$("hashBtn").addEventListener("click", async () => {
  const bytes = new TextEncoder().encode($("encInput").value);
  const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  const h256 = hex(await crypto.subtle.digest("SHA-256", bytes));
  const h512 = hex(await crypto.subtle.digest("SHA-512", bytes));
  $("encOutput").value = `SHA-256: ${h256}\n\nSHA-512: ${h512}`;
});

// JWT
function parseJwt() {
  const parts = $("jwtInput").value.trim().split(".");
  if (parts.length < 2) {
    $("jwtHeader").textContent = "Token inválido";
    $("jwtPayload").textContent = "";
    return;
  }
  const dec = (str) => JSON.stringify(JSON.parse(decodeURIComponent(escape(atob(str.replace(/-/g, "+").replace(/_/g, "/"))))), null, 2);
  try { $("jwtHeader").textContent = dec(parts[0]); } catch { $("jwtHeader").textContent = "Erro no Header"; }
  try {
    const pJson = dec(parts[1]);
    const pObj = JSON.parse(pJson);
    let expNote = "";
    if (pObj.exp) {
      const expDate = new Date(pObj.exp * 1000);
      const expired = Date.now() > expDate.getTime();
      expNote = `\n\n// Expira em: ${expDate.toLocaleString("pt-BR")} (${expired ? "EXPIRADO" : "Válido"})`;
    }
    $("jwtPayload").textContent = pJson + expNote;
  } catch { $("jwtPayload").textContent = "Erro no Payload"; }
  saveState();
}

// Regex
function evalRegex() {
  try {
    const rx = new RegExp($("rxPattern").value, $("rxFlags").value);
    const matches = $("rxText").value.match(rx) || [];
    $("rxMatches").textContent = `${matches.length} match(es): ${matches.join(" | ")}`;
    $("rxMatches").style.color = "var(--green)";
  } catch (e) {
    $("rxMatches").textContent = `Regex inválida: ${e.message}`;
    $("rxMatches").style.color = "var(--red)";
  }
  saveState();
}

// Cron
function evalCron() {
  const parts = $("cronInput").value.trim().split(/\s+/);
  if (parts.length !== 5) {
    $("cronDesc").textContent = "Use 5 campos: minuto hora dia mês dia-da-semana";
    return;
  }
  const [m, h, dom, mon, dow] = parts;
  $("cronDesc").textContent = `Minuto: ${m} | Hora: ${h} | Dia: ${dom} | Mês: ${mon} | Dia da semana: ${dow}`;
  saveState();
}

$("jwtInput").addEventListener("input", parseJwt);
["rxPattern", "rxFlags", "rxText"].forEach((id) => $(id).addEventListener("input", evalRegex));
$("cronInput").addEventListener("input", evalCron);
document.querySelectorAll(".cron-preset").forEach((b) => b.addEventListener("click", () => { $("cronInput").value = b.dataset.cron; evalCron(); }));

parseJwt();
evalRegex();
evalCron();
