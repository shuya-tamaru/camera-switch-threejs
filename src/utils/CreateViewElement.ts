export function createViewElement() {
  const mainViewDiv = document.createElement("div");
  mainViewDiv.style.position = "absolute";
  mainViewDiv.style.top = "0";
  mainViewDiv.style.left = "0";
  mainViewDiv.style.width = "50%";
  mainViewDiv.style.height = "100%";
  mainViewDiv.style.zIndex = "10";
  mainViewDiv.style.pointerEvents = "auto";
  mainViewDiv.style.borderRight = "1px solid #666";

  // User hint: Left side controls
  const mainHint = document.createElement("div");
  mainHint.textContent = "Rotate, Pan, Zoom (1 axis locked)";
  mainHint.style.position = "absolute";
  mainHint.style.top = "10px";
  mainHint.style.left = "10px";
  mainHint.style.fontSize = "14px";
  mainHint.style.color = "#666";
  mainHint.style.pointerEvents = "none";
  mainHint.style.zIndex = "11";
  mainViewDiv.appendChild(mainHint);

  const observerViewDiv = document.createElement("div");
  observerViewDiv.style.position = "absolute";
  observerViewDiv.style.top = "0";
  observerViewDiv.style.left = "50%";
  observerViewDiv.style.width = "50%";
  observerViewDiv.style.height = "100%";
  observerViewDiv.style.zIndex = "10";
  observerViewDiv.style.pointerEvents = "auto";

  // User hint: Right side controls
  const observerHint = document.createElement("div");
  observerHint.textContent = "Zoom only";
  observerHint.style.position = "absolute";
  observerHint.style.top = "10px";
  observerHint.style.left = "10px";
  observerHint.style.fontSize = "14px";
  observerHint.style.color = "#666";
  observerHint.style.pointerEvents = "none";
  observerHint.style.zIndex = "11";
  observerViewDiv.appendChild(observerHint);

  document.body.appendChild(mainViewDiv);
  document.body.appendChild(observerViewDiv);

  return { mainViewDiv, observerViewDiv };
}
