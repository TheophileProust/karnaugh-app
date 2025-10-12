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

  const positions = [];
  const gray = grayCode(n);
  gray.forEach((vals, i) => {
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

  // (suppression des rectangles rouges)

  ctx.fillStyle = "#222";
  ctx.font = "18px sans-serif";
  ctx.fillText(expr, canvas.width/2, canvas.height - 20);
}




