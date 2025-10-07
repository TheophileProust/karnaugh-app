// ---- script.js version corrigée (gestion complète des barres et des compléments combinés) ----

const grayOrder = [
  [0,0,0],[0,0,1],[0,1,1],[0,1,0],
  [1,1,0],[1,1,1],[1,0,1],[1,0,0]
];

const canvas = document.getElementById("kmap");
const ctx = canvas.getContext("2d");

function parseExpression(expr) {
  if (!expr) return "";
  if (typeof expr.normalize === "function") expr = expr.normalize("NFD");

  let e = expr.replace(/\s+/g, "").toUpperCase();

  // (AUB)' ou (AUB)̄  → !(AUB)
  e = e.replace(/\(([^()]+)\)(?:'|[\u0304\u0305\u00AF])/g, "!($1)");

  // A', B', C', Ā, Ā, etc → !A
  e = e.replace(/([ABC])(?:'|[\u0304\u0305\u00AF])/g, "!$1");

  // !A → !A (déjà bon)
  e = e.replace(/!([ABC])/g, "!$1");

  // ---- opérateurs ----
  e = e.replace(/U/g, "||");   // union
  e = e.replace(/N/g, "&&");   // intersection (maj)
  e = e.replace(/n/g, "&&");   // intersection (min)
  e = e.replace(/-/g, "&& !"); // différence

  // ---- corriger les cas comme A&&!B ou !B sans parenthèses ----
  // On encapsule les variables isolées dans un booléen explicite
  e = e.replace(/A/g, "(A)").replace(/B/g, "(B)").replace(/C/g, "(C)");

  // ---- Ajouter des parenthèses manquantes pour ! ----
  // ! (A) ou ! (B) → déjà correct, sinon on force
  e = e.replace(/!\(/g, "!("); // éviter !!((A))
  e = e.replace(/!!/g, "!");   // simplifier double négation

  return e;
}

function evalExpr(expr, A, B, C) {
  const jsExpr = parseExpression(expr);
  try {
    return Function("A", "B", "C", `return (${jsExpr});`)(A, B, C);
  } catch (err) {
    throw new Error(`Erreur dans l'expression. Utilisez par ex. (AUB)n(CnB)\n\nDétail: ${err.message}\nExpression JS générée: ${jsExpr}`);
  }
}

function computeMask(expr) {
  const mask = [];
  for (let [A,B,C] of grayOrder) {
    const val = evalExpr(expr, Boolean(A), Boolean(B), Boolean(C));
    mask.push(val ? 1 : 0);
  }
  return mask;
}

function drawKMap(expr) {
  const mask = computeMask(expr);
  const cellW = 150, cellH = 150;
  const positions = [
    [0,0],[1,0],[2,0],[3,0],
    [0,1],[1,1],[2,1],[3,1]
  ];

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "14px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let i=0; i<8; i++) {
    const [x,y] = positions[i];
    const px = x*cellW, py = y*cellH;
    const color = mask[i] ? "#8df58d" : "#fff";
    ctx.fillStyle = color;
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.fillRect(px, py, cellW, cellH);
    ctx.strokeRect(px, py, cellW, cellH);
    ctx.fillStyle = "#000";
    ctx.fillText(`A=${grayOrder[i][0]} B=${grayOrder[i][1]} C=${grayOrder[i][2]}`, px+cellW/2, py+cellH/2);
  }

  ctx.fillStyle = "#222";
  ctx.font = "18px sans-serif";
  ctx.fillText(expr, canvas.width/2, canvas.height - 20);
}

document.getElementById("generate").addEventListener("click", () => {
  const expr = document.getElementById("expression").value.trim();
  if (!expr) return;
  try {
    drawKMap(expr);
  } catch (e) {
    alert(e.message);
  }
});

// Valeur par défaut
drawKMap("(AUB)n(CnB)");
