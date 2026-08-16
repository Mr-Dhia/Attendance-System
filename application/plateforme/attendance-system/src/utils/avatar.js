// Genere une couleur stable a partir d'une chaine (nom), pour un avatar a initiale coherent
export function stringToColor(str = "") {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 45%)`;
}

export function getInitial(name = "") {
  return name.trim().charAt(0).toUpperCase() || "?";
}
