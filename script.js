// ---- Ordre de Gray pour A,B,C ----
const grayOrder = [
  [0,0,0],[0,0,1],[0,1,1],[0,1,0],
  [1,1,0],[1,1,1],[1,0,1],[1,0,0]
];

const canvas = document.getElementById("kmap");
const ctx = canvas.getContext("2d");

// ---- Convertit une expression ensembliste vers une expression JS logique ----
function parseExpression(expr) {
  // Nettoyage de base
  let e = expr.replace(/\s+/g, "");
  
  // Gestion du complément : on remplace par 'notX' si besoin
  // Ex: CnB => (C and not B)
  e = e.replace(/([ABC])n\(([ABC])\)/g, "($1 and $2)");
  
  // Remplacer les opérateurs
  e = e
    .replace(/U/g, "||")    // union → OR
    .replace(/n/g, "&&")    // intersection → AND
    .replace(/-/g, "&& !"); // différence → A - B = A && !B

  // Remplacer les variables par leur booléen JS
  e = e.replace(/A/g, "A").replace(/B/g, "B").replace(/C/g, "C");
  
  return e;
}

// ---- Évalue une expression pour une combinaison (A,B,C) ----
function evalExpr(expr, A, B, C) {
  const jsExpr = parseExpression(expr);
  return Function("A", "B", "C", `return (${jsExpr});`)(A, B, C);
}

// ---- Génère un masque booléen pour toutes les combinaisons ----
function computeMask(expr) {
  const mask = [];
  for (let [A,B,C] of grayOrder) {
    const val = evalExpr(expr, Boolean(A), Boolean(B), Boolean(C));
    mask.push(val ? 1 : 0);
  }
  return mask;
}

// ---- Dessine la carte de Karnaugh ----
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
    alert("Erreur dans l'expression : " + e.message);
  }
});

// Valeur par défaut
drawKMap("(AUB)n(CnB)");
