const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 800;
const POPUP_TITLE = "Autograph";
const POPUP_TEMPLATE_FILENAME = "AutographPopup.template.html";

export default class AutographPopupWindow {
  public display(ui: GoogleAppsScript.Base.Ui) {
    const template = HtmlService.createTemplateFromFile(POPUP_TEMPLATE_FILENAME);
    const html = template.evaluate();
    html.setWidth(DEFAULT_WIDTH);
    html.setHeight(DEFAULT_HEIGHT);
    ui.showModalDialog(html, POPUP_TITLE);
  }
}
