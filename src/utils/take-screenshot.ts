import html2canvas from "html2canvas";

const takeScreenshot = async () => {
  const target = document.getElementById("game-grid");
  if (target) {
    const canvas = await html2canvas(target);
    return canvas;
  } else {
    throw new Error("Could not find game grid to take screenshot");
  }
};

export default takeScreenshot;
