// ===========================================
// Template Manager Service
// ===========================================

export function exportTemplate(templateData, filename) {
  const blob = new Blob([JSON.stringify(templateData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importTemplate() {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return reject("No file selected");
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target.result);
          resolve(json);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject("Error reading file");
      reader.readAsText(file);
    };
    input.click();
  });
}
