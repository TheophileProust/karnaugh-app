// script.js - support amélioré pour les "barres" (overline) et autres notations de complément
// Ordre Gray pour A,B,C (K-map 3 variables)
const grayOrder = [
  [0,0,0],[0,0,1],[0,1,1],[0,1,0],
  [1,1,0],[1,1,1],[1,0,1],[1,0,0]
];

const canvas = document.getElementById("kmap");
const ctx = canvas.getContext("2d");

// Remplace plusieurs formes de complément et opères la transformation vers JS
function parseExpression(expr) {
  if (!expr) return "";

  // 1) Normaliser Unicode pour que les caractères précomposés deviennent lettre + diacritique
  //    (ex: "Ā" -> "A" + "\u0304"), ainsi on peut détecter le combining macron/overline.
  if (typeof expr.normalize === "function") {
    expr = expr.normalize("NFD");
  }

  // 2) enlever espaces et forcer majuscules pour variables A,B,C
  let e = expr.replace(/\s+/g, "");
  e = e.toUpperCase();

  // 3) Gérer complément sur parenthèse : (AUB)' ou (AUB)̄  --> (! (AUB))
  //    On prend en charge apostrophe '  et les diacritiques overline/macron \u0304 \u0305 et le symbole ¯ (U+00AF)
  e = e.replace(/\(([^()]+)\)(?:'|[\u0304\u0305\u00AF])/g, "(!($1))");

  // 4) Gérer complément sur variable simple : A'  ou Ā  ou A̅  ou A¯  --> (!A)
  e = e.replace(/([ABC])(?:'|[\u0304\u0305\u00AF])/g, "(!$1)");

  // 5) Gérer notation préfixe !A  --> (!A)
  e = e.replace(/!([ABC])/g, "(!$1)");

  // 6) Remplacer opérateurs en opérateurs JS
  //    U ou u => ||    (union -> OR)
  //    n or N  => &&   (intersection -> AND)
  //    -       => && ! (différence A - B => A && !B)
  e = e.replace(/U/g, "||").replace(/u/g, "||");
  e = e.replace(/n/g, "&&").replace(/N/g, "&&");
  // Remplacer '-' par '&& !' — on suppose que l'utilisateur écrit A-B (pas de unary -)
  e = e.replace(/-/g, "&& !");

  // 7) (optionnel) nettoyer doublons de parenthèses produits par les remplacements
  e = e.replace(/\(!\(([^()]+)\)\)/g, "(!$1)"); // éviter (!((...)))
  e = e.replace(/\(\(!([ABC])\)\)/g, "(!$1)");   // éviter ((!A))

  return e;
}

// Évaluer l'expression pour une combinaison donnée
function evalExpr(expr, A, B, C) {
  const jsExpr = parseExpression(expr);
  // construire une fonction sûre (relativement) qui prend A,B,C
  try {
    return Function("A", "B", "C", `return (${jsExpr});`)(A, B, C);
  } catch (err) {
    // propager l'erreur vers l'appelant pour affichage
    throw new Error("Syntaxe invalide après parsing: " + err.message + "\nExpression JS: " + jsExpr);
  }
}

// Générer masque booléen (8 cases)
function computeMask(expr) {
  const mask = [];
  for (let [A,B,C] of grayOrder) {
    let val;
    try {
      val = evalExpr(expr, Boolean(A), Boolean(B), Boolean(C));
    } catch (e) {
      throw e;
    }
    mask.push(val ? 1 : 0);
  }
  return mask;
}

// Dessiner K-map (2x4)
function drawKMap(expr) {
  let mask;
  try {
    mask = computeMask(expr);
  } catch (e) {
    // réémettre une erreur claire pour l'UI
    throw new Error("Impossible d'évaluer l'expression: " + e.message);
  }

  const cellW = 150, cellH = 150;
  const positions = [
    [0,0],[1,0],[2,0],[3,0],
    [0,1],[1,1],[2,1],[3,1]
  ];

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "14px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let i = 0; i < 8; i++) {
    const [x,y] = positions[i];
    const px = x * cellW, py = y * cellH;
    const color = mask[i] ? "#8df58d" : "#ffffff";
    ctx.fillStyle = color;
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.fillRect(px, py, cellW, cellH);
    ctx.strokeRect(px, py, cellW, cellH);
    ctx.fillStyle = "#000";
    ctx.fillText(`A=${grayOrder[i][0]} B=${grayOrder[i][1]} C=${grayOrder[i][2]}`, px + cellW/2, py + cellH/2);
  }

  ctx.fillStyle = "#222";
  ctx.font = "18px sans-serif";
  ctx.fillText(expr, canvas.width/2, canvas.height - 20);
}

// Interaction UI
document.getElementById("generate").addEventListener("click", () => {
  const expr = document.getElementById("expression").value.trim();
  if (!expr) return;
  try {
    drawKMap(expr);
  } catch (e) {
    alert("Erreur : " + e.message + "\n\nConseil : utilises plutôt A' ou !A si la barre ne s'affiche pas correctement.");
  }
});

// Valeur par défaut
drawKMap("(AUB)n(CnB)");


