// ---- Ordre de Gray pour A,B,C ----
const grayOrder = [
  [0,0,0],[0,0,1],[0,1,1],[0,1,0],
  [1,1,0],[1,1,1],[1,0,1],[1,0,0]
];

const canvas = document.getElementById("kmap");
const ctx = canvas.getContext("2d");

// ---- Convertit une expression ensembliste vers JS ----
function parseExpression(expr) {
  let e = expr.replace(/\s+/g, ""); // enlever espaces

  // Gestion des notations de complément (A', Ā, !A, (AUB)')
  // 1️⃣ Compléments sur variables simples
  e = e.replace(/A'|Ā|!A/g, "(!A)");
  e = e.replace(/B'|B̄|!B/g, "(!B)");
  e = e.replace(/C'|C̄|!C/g, "(!C)");

  // 2️⃣ Complément sur parenthèses ex: (AUB)'
  e = e.replace(/\(([^()]+)\)'/g, "(!($1))");

  // 3️⃣ Remplacement des opérateurs
  e = e
    .replace(/U/g, "||")    // Union → OR
    .replace(/n/g, "&&")    // Intersection → AND
    .replace(/-/g, "&& !"); // Différence → A && !B

  return e;
}

// ---- Évalue l’expression pour une combinaison A,B,C ----
function evalExpr(expr, A, B, C) {
  const jsExpr = parseExpression(expr);
  return Function("A", "B", "C", `return (${jsExpr});`)(A, B, C);
}

// ---- Génère un masque booléen ----
function computeMask(expr) {
  const mask = [];
  for (let [A,B,C] of grayOrder) {
    const val = evalExpr(expr, Boolean(A), Boolean(B), Boolean(C));
    mask.push(val ? 1 : 0);
  }
  return mask;
}

// ---- Dessin de la carte ----
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
    const color = mask[i] ? "#8df58d" : "#ffffff";
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

// ---- Interaction ----
document.getElementById("generate").addEventListener("click", () => {
  const expr = document.getElementById("expression").value.trim();
  if (!expr) return;
  try {
    drawKMap(expr);
  } catch (e) {
    alert("Erreur dans l'expression : " + e.message);
  }
});

// Valeur par défaut
drawKMap("(AUB)n(CnB)");

