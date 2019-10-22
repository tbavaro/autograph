import { templateElement } from "@babel/types";

const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 800;
const POPUP_TITLE = "Autograph";
const POPUP_TEMPLATE_FILENAME = "AutographPopup.template.html";

export default class AutographPopupWindow {
  public display(ui: GoogleAppsScript.Base.Ui, isDev: boolean) {
    const template = HtmlService.createTemplateFromFile(POPUP_TEMPLATE_FILENAME);
    template.url = (isDev ? "https://localhost:3001/" : "https://tbavaro.github.io/autograph/") + "?embedded";
    template.targetOrigin = (isDev ? "*" : "tbavaro.github.io");
    template.appData = JSON.stringify({ appValue: 123 });
    const html = template.evaluate();
    html.setWidth(DEFAULT_WIDTH);
    html.setHeight(DEFAULT_HEIGHT);
    ui.showModalDialog(html, POPUP_TITLE);
  }
}
