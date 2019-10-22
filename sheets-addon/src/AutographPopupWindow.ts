import { templateElement } from "@babel/types";

const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 800;
const POPUP_TITLE = "Autograph";
const POPUP_TEMPLATE_FILENAME = "AutographPopup.template.html";

export default class AutographPopupWindow {
  public display(attrs: {
    ui: GoogleAppsScript.Base.Ui,
    data: any,
    isDev?: boolean
  }) {
    const template = HtmlService.createTemplateFromFile(POPUP_TEMPLATE_FILENAME);
    template.url = (attrs.isDev ? "https://localhost:3001/" : "https://tbavaro.github.io/autograph/") + "?embedded";
    template.targetOrigin = (attrs.isDev ? "*" : "tbavaro.github.io");
    template.appData = JSON.stringify(attrs.data);
    const html = template.evaluate();
    html.setWidth(DEFAULT_WIDTH);
    html.setHeight(DEFAULT_HEIGHT);
    attrs.ui.showModalDialog(html, POPUP_TITLE);
  }
}
