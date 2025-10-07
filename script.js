// Fonction pour détecter les variables dans l'expression
function detectVariables(expr) {
  const vars = [...new Set(expr.match(/[A-Z]/g))];
  return vars.sort();
}

// Fonction pour générer le code de Gray
function grayCode(n) {
  if (n === 0) return [[]];
  const prev = grayCode(n - 1);
  const result = [];
  for (let p of prev) result.push([0, ...p]);
  for (let p of prev.slice().reverse()) result.push([1, ...p]);
  return result;
}

// Fonction pour parser l'expression
function parseExpression(expr, variables) {
  expr = expr.replace(/\s+/g, "").toUpperCase();
  expr = expr.replace(/\(([^()]+)\)(?:'|[\u0304\u0305\u00AF])/g, "!($1)");
  expr = expr.replace(/([A-Z])(?:'|[\u0304\u0305\u00AF])/g, "!$1");
  expr = expr.replace(/U/g, "||").replace(/N/g, "&&").replace(/n/g, "&&").replace(/-/g, "&& !");
  for (let v of variables) expr = expr.replace(new RegExp(v, "g"), `(${v})`);
  expr = expr.replace(/!!/g, "!");
  return expr;
}

// Fonction pour évaluer l'expression
function evalExpr(expr, combo, variables) {
  const fn = new Function(...variables, `return (${parseExpression(expr, variables)});`);
  return fn(...combo.map(v => Boolean(v)));
}

// Fonction pour dessiner la carte de Karnaugh
function drawKMap(expr) {
  const variables = detectVariables(expr);
  const n = variables.length;
  if (n === 0) return alert("Aucune variable détectée");

  const mask = [];
  const combinations = grayCode(n);
  combinations.forEach(c => mask.push(evalExpr(expr, c, variables) ? 1 : 0));

  let rows, cols;
  if (n === 1) { cols = 2; rows = 1; }
  else if (n === 2) { cols = 2; rows = 2; }
  else if (n === 3) { cols = 4; rows = 2; }  // 2x4 rectangle
  else if (n === 4) { cols = 4; rows = 4; }  // 4x4 carré
  else { cols = Math.pow(2, Math.ceil(n / 2)); rows = Math.pow(2, Math.floor(n / 2)); }

  const cellSize = 100;
  canvas.width = cols * cellSize + 20;
  canvas.height = rows * cellSize + 60;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "14px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Placement Gray code correct pour 3 et 4 variables
  let indices = [];
  if (n <= 2) indices = combinations.map((_, i) => i);
  else if (n === 3) {
    // 3 variables: A,B,C -> rows=A, columns=BC Gray code
    const rowGray = grayCode(1);   // 2 rows
    const colGray = grayCode(2);   // 4 columns
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 4; c++) {
        const combo = [rowGray[r][0], ...colGray[c]];
        const idx = combinations.findIndex(x => x.join("") === combo.join(""));
        indices.push(idx);
      }
    }
  } else if (n === 4) {
    // 4 variables: AB rows, CD cols
    const rowGray = grayCode(2);
    const colGray = grayCode(2);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const combo = [...rowGray[r], ...colGray[c]];
        const idx = combinations.findIndex(x => x.join("") === combo.join(""));
        indices.push(idx);
      }
    }
  }

  // Dessiner les cellules
  for (let i = 0; i < indices.length; i++) {
    const x = (i % cols) * cellSize;
    const y = Math.floor(i / cols) * cellSize;
    const val = mask[indices[i]];
    ctx.fillStyle = val ? "#8df58d" : "#fff";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.fillRect(x, y, cellSize, cellSize);
    ctx.strokeRect(x, y, cellSize, cellSize);

    const text = variables.map((v, idx) => `${v}=${combinations[indices[i]][idx]}`).join(" ");
    ctx.fillStyle = "#000";
    ctx.fillText(text, x + cellSize / 2, y + cellSize / 2);
  }

  ctx.fillStyle = "#222";
  ctx.font = "18px sans-serif";
  ctx.fillText(expr, canvas.width / 2, canvas.height - 20);
}

// Gestion du bouton
document.getElementById("generate").addEventListener("click", () => {
  const expr = document.getElementById("expression").value.trim();
  if (!expr) return;
  try { drawKMap(expr); } catch (e) { alert(e.message); }
});

// Exemple par défaut
drawKMap("(AUB)n(CnB)");
