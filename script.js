const grayOrder = [
  [0,0,0],[0,0,1],[0,1,1],[0,1,0],
  [1,1,0],[1,1,1],[1,0,1],[1,0,0]
];

const canvas = document.getElementById("kmap");
const ctx = canvas.getContext("2d");

// Transforme l'expression entrée par l'utilisateur en expression JS
function parseExpression(expr) {
  if (!expr) return "";
  let e = expr.replace(/\s+/g, "").toUpperCase();

  // Remplacer les négations ' ou ! par !
  e = e.replace(/([ABC])('|!|[\u0304\u0305\u00AF])/g, "!$1");

  // Remplacer les opérateurs : U → ||, n ou N → &&, - → && !
  e = e.replace(/U/g, "||").replace(/[Nn]/g, "&&").replace(/-/g, "&& !");

  // Encapsuler A, B, C isolés dans ()
  e = e.replace(/(?<![!()])A(?![A-Z])/g, "(A)")
       .replace(/(?<![!()])B(?![A-Z])/g, "(B)")
       .replace(/(?<![!()])C(?![A-Z])/g, "(C)");

  // Simplifier les doubles négations
  e = e.replace(/!!/g, "");

  return e;
}

// Évalue l'expression pour une combinaison donnée
function evalExpr(expr, A, B, C) {
  const jsExpr = parseExpression(expr);
  try {
    return Function("A","B","C",`return (${jsExpr});`)(A,B,C);
  } catch(err) {
    throw new Error(`Erreur expression: ${err.message}\nExpr JS: ${jsExpr}`);
  }
}

// Génère un masque 1/0 pour les 8 cases
function computeMask(expr) {
  return grayOrder.map(([A,B,C]) => evalExpr(expr, Boolean(A), Boolean(B), Boolean(C)) ? 1 : 0);
}

// Dessine le K-map
function drawKMap(expr) {
  const mask = computeMask(expr);
  const cellW = 150, cellH = 150;

  // Gray code pour 3 variables (ordre visuel)
  const positions = [
    [0,0],[1,0],[3,0],[2,0],
    [0,1],[1,1],[3,1],[2,1]
  ];

  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.font = "14px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let i=0; i<8; i++) {
    const [x,y] = positions[i];
    const px = x*cellW;
    const py = y*cellH;
    ctx.fillStyle = mask[i] ? "#8df58d" : "#fff";
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

// Gestion du bouton
document.getElementById("generate").addEventListener("click", () => {
  const expr = document.getElementById("expression").value.trim();
  if (!expr) return;
  try { drawKMap(expr); } 
  catch(e) { alert(e.message); }
});

// Valeur par défaut
drawKMap("(AUB)n(CnB)");

