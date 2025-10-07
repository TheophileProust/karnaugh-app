const canvas = document.getElementById("kmap");
const ctx = canvas.getContext("2d");

// ---------------- Gray code ----------------
function grayCode(n) {
  if (n === 0) return [[]];
  const prev = grayCode(n - 1);
  return [
    ...prev.map(x => [0, ...x]),
    ...prev.map(x => [1, ...x.reverse()])
  ];
}

// ---------------- Détection variables ----------------
function detectVariables(expr) {
  const vars = new Set(expr.toUpperCase().match(/[A-D]/g));
  return Array.from(vars).sort();
}

// ---------------- Parse expression ----------------
function parseExpression(expr, variables) {
  if (!expr) return "";
  let e = expr.replace(/\s+/g, "").toUpperCase();

  e = e.replace(/([A-D])('|!|[\u0304\u0305\u00AF])/g, "!$1");
  e = e.replace(/U/g, "||").replace(/[Nn]/g, "&&").replace(/-/g, "&& !");

  variables.forEach(v => {
    const regex = new RegExp(`(?<![!()])${v}(?![A-Z])`, "g");
    e = e.replace(regex, `(${v})`);
  });

  e = e.replace(/!!/g, "");
  return e;
}

// ---------------- Évaluation ----------------
function evalExpr(expr, values, variables) {
  const jsExpr = parseExpression(expr, variables);
  try {
    return Function(...variables, `return (${jsExpr});`)(...values);
  } catch(err) {
    throw new Error(`Erreur expression: ${err.message}\nExpr JS: ${jsExpr}`);
  }
}

// ---------------- Masque ----------------
function computeMask(expr, variables) {
  const n = variables.length;
  const combinations = grayCode(n);
  return combinations.map(comb => evalExpr(expr, comb.map(Boolean), variables) ? 1 : 0);
}

// ---------------- Détection des groupes minimaux ----------------
function findGroups(mask, rows, cols) {
  // Retourne une liste de rectangles [x, y, w, h]
  const grid = [];
  let idx = 0;
  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      grid[r][c] = mask[idx++] || 0;
    }
  }

  const groups = [];
  const visited = Array.from({length: rows}, ()=>Array(cols).fill(false));

  // On cherche d’abord les grands rectangles (4,2,1)
  const sizes = [4,2,1];

  sizes.forEach(size => {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] === 1 && !visited[r][c]) {
          // vérifier si on peut créer un rectangle de cette taille
          let w = Math.min(size, cols-c);
          let h = Math.min(size, rows-r);
          let valid = true;
          for (let i = 0; i < h && valid; i++) {
            for (let j = 0; j < w && valid; j++) {
              if (grid[(r+i)%rows][(c+j)%cols] !== 1) valid = false;
            }
          }
          if (valid) {
            groups.push([c,r,w,h]);
            for (let i=0;i<h;i++) for (let j=0;j<w;j++) visited[(r+i)%rows][(c+j)%cols]=true;
          }
        }
      }
    }
  });

  return groups;
}

// ---------------- Dessin K-map ----------------
function drawKMap(expr) {
  const variables = detectVariables(expr);
  const n = variables.length;

  if (n < 3 || n > 4) {
    alert("Seulement 3 ou 4 variables sont supportées (A, B, C, D).");
    return;
  }

  const mask = computeMask(expr, variables);
  const size = 100;
  const cols = 2 ** Math.ceil(n/2);
  const rows = 2 ** Math.floor(n/2);

  canvas.width = cols * size + 50;
  canvas.height = rows * size + 50;

  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.font = "14px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Positions Gray code
  const positions = [];
  const gray = grayCode(n);
  gray.forEach((vals, i) => {
    const colBits = vals.slice(0, Math.ceil(n/2));
    const rowBits = vals.slice(Math.ceil(n/2));
    const x = parseInt(colBits.join(''), 2);
    const y = parseInt(rowBits.join(''), 2);
    positions.push([x,y]);
  });

  // Dessin cellules
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

  // Détection et dessin des groupes
  const groups = findGroups(mask, rows, cols);
  ctx.strokeStyle = "#FF0000";
  ctx.lineWidth = 4;
  groups.forEach(([c,r,w,h]) => {
    ctx.strokeRect(c*size, r*size, w*size, h*size);
  });

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



