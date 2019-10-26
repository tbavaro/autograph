import { PositionData } from "./generated/SharedTypes";

import AutographManagedSheet from "./AutographManagedSheet";
import AutographPopupWindow from "./AutographPopupWindow";
import { registerGlobalFunction } from "./GoogleAppsHelpers";

global.onOpen = () => {
  const ui = SpreadsheetApp.getUi();
  ui.createAddonMenu()
    .addItem("View in Autograph...", viewInAutographProd)
    .addItem("View in Autograph... (dev)", viewInAutographDev)
    .addToUi();
};

function viewInAutographImpl(isDev: boolean) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const managedSheet = new AutographManagedSheet(sheet);
  const data = managedSheet.loadData();

  const popup = new AutographPopupWindow();
  popup.display({
    ui: SpreadsheetApp.getUi(),
    data,
    isDev
  });
}

const viewInAutographDev = registerGlobalFunction(() => viewInAutographImpl(/*isDev=*/true));
const viewInAutographProd = registerGlobalFunction(() => viewInAutographImpl(/*isDev=*/false));

global.autographSavePositions = (data: PositionData) => {
  Logger.log("writing values");
  const sheet = SpreadsheetApp.getActiveSheet();
  const managedSheet = new AutographManagedSheet(sheet);
  managedSheet.saveData(data);
  Logger.log("finished writing values");
};
