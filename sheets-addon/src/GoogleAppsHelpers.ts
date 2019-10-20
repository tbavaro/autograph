const ESCAPE_HTML_HELPER: { [k: string]: string } = {
  '"': "&quot;",
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;"
};

function escapeHtml(text: string) {
  return text.replace(/[\"&<>]/g, (a: string) => {
    return ESCAPE_HTML_HELPER[a];
  });
}

export function showPreformattedDialog(ui: GoogleAppsScript.Base.Ui, content: string, title?: string) {
  const html = HtmlService.createHtmlOutput("<pre>" + escapeHtml(content) + "</pre>");
  html.setWidth(1280);
  html.setHeight(800);
  ui.showModalDialog(html, title || "Dialog");
}

let menuFuncCounter = 0;
export function registerGlobalFunction(func: () => void): string {
  const funcName = `myGlobalFunc${menuFuncCounter++}`;
  (global as any)[funcName] = func;
  return funcName;
}
