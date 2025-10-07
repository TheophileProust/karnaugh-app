const canvas = document.getElementById("kmap");
const ctx = canvas.getContext("2d");

// Détecter les variables dans l'expression
function detectVariables(expr) {
  const vars = [...new Set(expr.toUpperCase().match(/[A-Z]/g))];
  return vars.sort();
}

// Générer Gray code pour n bits
function grayCode(n) {
  if (n === 0) return [[]];
  const prev = grayCode(n-1);
  const result = [];
  for (let p of prev) result.push([0,...p]);
  for (let p of prev.slice().reverse()) result.push([1,...p]);
  return result;
}

// Parser l'expression
function parseExpression(expr, variables) {
  expr = expr.replace(/\s+/g, "").toUpperCase();
  expr = expr.replace(/\(([^()]+)\)(?:'|[\u0304\u0305\u00AF])/g, "!($1)");
  expr = expr.replace(/([A-Z])(?:'|[\u0304\u0305\u00AF])/g, "!$1");
  expr = expr.replace(/U/g, "||").replace(/N/g, "&&").replace(/n/g, "&&").replace(/-/g, "&& !");
  for (let v of variables) expr = expr.replace(new RegExp(v,"g"), `(${v})`);
  expr = expr.replace(/!!/g, "!");
  return expr;
}

// Évaluer l'expression
function evalExpr(expr, combo, variables) {
  const jsExpr = parseExpression(expr, variables);
  const fn = new Function(...variables, `return (${jsExpr});`);
  return fn(...combo.map(v=>Boolean(v)));
}

// Dessiner la K-map
function drawKMap(expr) {
  const variables = detectVariables(expr);
  const n = variables.length;
  if (n===0) return alert("Aucune variable détectée");

  const mask = [];
  const gray = grayCode(n);
  gray.forEach(combo => mask.push(evalExpr(expr, combo, variables)?1:0));

  let rows, cols;
  if (n === 1) { cols=2; rows=1; }
  else if (n===2) { cols=2; rows=2; }
  else if (n===3) { cols=4; rows=2; } // 8 cases
  else if (n===4) { cols=4; rows=4; } // 16 cases
  else { cols=Math.pow(2, Math.ceil(n/2)); rows=Math.pow(2, Math.floor(n/2)); }

  const cellSize=100;
  canvas.width=cols*cellSize+20;
  canvas.height=rows*cellSize+60;

  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.font="14px sans-serif";
  ctx.textAlign="center";
  ctx.textBaseline="middle";

  // Dessiner chaque cellule
  for (let i=0;i<mask.length;i++){
    const x=(i%cols)*cellSize;
    const y=Math.floor(i/cols)*cellSize;
    ctx.fillStyle=mask[i]?"#8df58d":"#fff";
    ctx.strokeStyle="#000";
    ctx.lineWidth=2;
    ctx.fillRect(x,y,cellSize,cellSize);
    ctx.strokeRect(x,y,cellSize,cellSize);
    const text = variables.map((v,idx)=>`${v}=${gray[i][idx]}`).join(" ");
    ctx.fillStyle="#000";
    ctx.fillText(text,x+cellSize/2,y+cellSize/2);
  }

  ctx.fillStyle="#222";
  ctx.font="18px sans-serif";
  ctx.fillText(expr,canvas.width/2,canvas.height-20);
}

// Gestion du bouton
document.getElementById("generate").addEventListener("click",()=>{
  const expr=document.getElementById("expression").value.trim();
  if(!expr) return;
  try{ drawKMap(expr); } catch(e){ alert(e.message); }
});

// Exemple par défaut
drawKMap("(AUB)n(CnB)");

