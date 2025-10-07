// ---------------- Variables ----------------
const canvas = document.getElementById("kmap");
const ctx = canvas.getContext("2d");

// ---------------- Helpers ----------------

// Génère le Gray code pour n bits
function grayCode(n) {
  if (n === 0) return [[]];
  const prev = grayCode(n - 1);
  return [
    ...prev.map(x => [0, ...x]),
    ...prev.map(x => [1, ...x.reverse()])
  ];
}

// Détecte les variables présentes dans l'expression (A,B,C,D)
function detectVariables(expr) {
  const vars = new Set(expr.toUpperCase().match(/[A-D]/g));
  return Array.from(vars).sort(); // ordre alphabétique
}

// Parse expression en JS
function parseExpression(expr, variables) {
  if (!expr) return "";
  let e = expr.replace(/\s+/g, "").toUpperCase();

  // Négation ' ou ! → !
  e = e.replace(/([A-D])('|!|[\u0304\u0305\u00AF])/g, "!$1");

  // Opérateurs
  e = e.replace(/U/g, "||").replace(/[Nn]/g, "&&").replace(/-/g, "&& !");

  // Encapsuler les variables isolées dans ()
  variables.forEach(v => {
    const regex = new RegExp(`(?<![!()])${v}(?![A-Z])`, "g");
    e = e.replace(regex, `(${v})`);
  });

  // Simplifier double négation
  e = e.replace(/!!/g, "");

  return e;
}

// Évalue l'expression pour une combinaison donnée
function evalExpr(expr, values, variables) {
  const jsExpr = parseExpression(expr, variables);
  try {
    return Function(...variables, `return (${jsExpr});`)(...values);
  } catch(err) {
    throw new Error(`Erreur expression: ${err.message}\nExpr JS: ${jsExpr}`);
  }
}

// Génère un masque 1/0 pour toutes les combinaisons
function computeMask(expr, variables) {
  const n = variables.length;
  const combinations = grayCode(n);
  return combinations.map(comb => evalExpr(expr, comb.map(Boolean), variables) ? 1 : 0);
}

// ---------------- Dessin ----------------

function drawKMap(expr) {
  const variables = detectVariables(expr);
  const n = variables.length;

  if (n < 3 || n > 4) {
    alert("Seulement 3 ou 4 variables sont supportées (A, B, C, D).");
    return;
  }

  const mask = computeMask(expr, variables);
  const size = 100; // taille de cellule
  const cols = 2 ** Math.ceil(n/2);
  const rows = 2 ** Math.floor(n/2);

  canvas.width = cols * size + 50;
  canvas.height = rows * size + 50;

  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.font = "14px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const positions = [];
  const gray = grayCode(n);
  gray.forEach((vals, i) => {
    // Map vers 2D : colonnes = moitié des bits, lignes = reste
    const colBits = vals.slice(0, Math.ceil(n/2));
    const rowBits = vals.slice(Math.ceil(n/2));
    const x = parseInt(colBits.join(''), 2);
    const y = parseInt(rowBits.join(''), 2);
    positions.push([x,y]);
  });

  for (let i=0; i<mask.length; i++) {
    const [x,y] = positions[i];
    const px = x*size;
    const py = y*size;
    ctx.fillStyle = mask[i] ? "#8df58d" : "#fff";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.fillRect(px, py, size, size);
    ctx.strokeRect(px, py, size, size);

    const text = variables.map((v,j) => `${v}=${gray[i][j]}`).join(' ');
    ctx.fillStyle = "#000";
    ctx.fillText(text, px + size/2, py + size/2);
  }

  ctx.fillStyle = "#222";
  ctx.font = "18px sans-serif";
  ctx.fillText(expr, canvas.width/2, canvas.height - 20);
}

// ---------------- Événement bouton ----------------
document.getElementById("generate").addEventListener("click", () => {
  const expr = document.getElementById("expression").value.trim();
  if (!expr) return;
  try { drawKMap(expr); } 
  catch(e) { alert(e.message); }
});

// Valeur par défaut
drawKMap("(AUB)n(CnB)");


