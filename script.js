// ---- Définition des combinaisons A,B,C (Gray code pour Karnaugh 3 variables) ----
const grayOrder = [
  [0,0,0],[0,0,1],[0,1,1],[0,1,0],
  [1,1,0],[1,1,1],[1,0,1],[1,0,0]
];

const canvas = document.getElementById("kmap");
const ctx = canvas.getContext("2d");

function evalExpr(expr, A, B, C) {
  // Convertir opérateurs de la forme (AUB)n(CnB)
  let jsExpr = expr.replace(/U/g, "||").replace(/n/g, "&&");
  jsExpr = jsExpr
    .replace(/CnB/g, "(C && !B)")
    .replace(/AUB/g, "(A || B)");
  return eval(jsExpr);
}

function computeMask(expr) {
  const mask = [];
  for (let [A,B,C] of grayOrder) {
    mask.push(evalExpr(expr, Boolean(A), Boolean(B), Boolean(C)));
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
  if (expr === "") return;
  try {
    drawKMap(expr);
  } catch (e) {
    alert("Erreur dans l'expression. Utilisez par ex. (AUB)n(CnB)");
  }
});

// Valeur par défaut
drawKMap("(AUB)n(CnB)");
