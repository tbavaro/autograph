const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 800;
const POPUP_TITLE = "Autograph";
const POPUP_TEMPLATE_FILENAME = "AutographPopup.template.html";

interface MyEnvConfig {
  url: string;
  targetOrigin: string;
  popupTitle: string;
}

const ENV_CONFIG_PROD: MyEnvConfig = {
  url: "https://tbavaro.github.io/autograph",
  targetOrigin: "*",
  popupTitle: POPUP_TITLE
};

const ENV_CONFIG_DEV: MyEnvConfig = {
  url: "https://localhost:3001",
  targetOrigin: "*",
  popupTitle: `${POPUP_TITLE} (dev)`
};

export default class AutographPopupWindow {
  public display(attrs: {
    ui: GoogleAppsScript.Base.Ui,
    data: any,
    isDev?: boolean
  }) {
    const env = (attrs.isDev ? ENV_CONFIG_DEV : ENV_CONFIG_PROD);

    const template = HtmlService.createTemplateFromFile(POPUP_TEMPLATE_FILENAME);
    template.url = `${env.url}?embedded`;
    template.targetOrigin = env.targetOrigin;
    template.appData = JSON.stringify(attrs.data);
    const html = template.evaluate();
    html.setWidth(DEFAULT_WIDTH);
    html.setHeight(DEFAULT_HEIGHT);
    attrs.ui.showModalDialog(html, env.popupTitle);
  }
}
