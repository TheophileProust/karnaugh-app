const canvas = document.getElementById("kmap");
const ctx = canvas.getContext("2d");

// Détecter toutes les variables dans l'expression
function detectVariables(expr) {
  const vars = [...new Set(expr.toUpperCase().match(/[A-Z]/g))];
  return vars.sort(); // tri alphabétique
}

// Générer Gray code pour n bits
function generateGray(n) {
  if (n === 0) return [[]];
  const prev = generateGray(n-1);
  const result = [];
  for (let p of prev) result.push([0, ...p]);
  for (let p of prev.slice().reverse()) result.push([1, ...p]);
  return result;
}

// Parser expression pour JS
function parseExpression(expr, variables) {
  expr = expr.replace(/\s+/g, "").toUpperCase();
  expr = expr.replace(/\(([^()]+)\)(?:'|[\u0304\u0305\u00AF])/g, "!($1)");
  expr = expr.replace(/([A-Z])(?:'|[\u0304\u0305\u00AF])/g, "!$1");
  expr = expr.replace(/U/g, "||").replace(/N/g, "&&").replace(/n/g, "&&").replace(/-/g, "&& !");
  for (let v of variables) expr = expr.replace(new RegExp(v, "g"), `(${v})`);
  expr = expr.replace(/!!/g, "!");
  return expr;
}

// Évaluer l'expression pour une combinaison
function evalExpr(expr, values, variables) {
  const jsExpr = parseExpression(expr, variables);
  const fn = new Function(...variables, `return (${jsExpr});`);
  return fn(...values.map(v => Boolean(v)));
}

// Calculer le masque de vérité
function computeMask(expr, variables) {
  const n = variables.length;
  const grayOrder = generateGray(n);
  const mask = grayOrder.map(combo => evalExpr(expr, combo, variables) ? 1 : 0);
  return { mask, grayOrder };
}

// Dessiner la K-map
function drawKMap(expr) {
  const variables = detectVariables(expr);
  const n = variables.length;
  const { mask, grayOrder } = computeMask(expr, variables);

  const cellSize = 100;
  const cols = 2 ** Math.ceil(n / 2);
  const rows = Math.ceil(mask.length / cols);

  canvas.width = cols * cellSize + 20;
  canvas.height = rows * cellSize + 60;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "14px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let i = 0; i < mask.length; i++) {
    const x = (i % cols) * cellSize;
    const y = Math.floor(i / cols) * cellSize;
    ctx.fillStyle = mask[i] ? "#8df58d" : "#fff";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, cellSize, cellSize);
    ctx.strokeRect(x, y, cellSize, cellSize);

    const text = variables.map((v, idx) => `${v}=${grayOrder[i][idx]}`).join(" ");
    ctx.fillStyle = "#000";
    ctx.fillText(text, x + cellSize / 2, y + cellSize / 2);
  }

  ctx.fillStyle = "#222";
  ctx.font = "18px sans-serif";
  ctx.fillText(expr, canvas.width / 2, canvas.height - 20);
}

// Gestion de l'input utilisateur
document.getElementById("generate").addEventListener("click", () => {
  const expr = document.getElementById("expression").value.trim();
  if (!expr) return;
  try { drawKMap(expr); } catch (e) { alert(e.message); }
});

// Valeur par défaut
drawKMap("(AUB)n(CnB)");
