import { showPreformattedDialog } from "./GoogleAppsHelpers";
import SheetHelper, { SheetHelperTransforms } from "./SheetHelper";

global.onOpen = () => {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("Scripts")
    .addItem("View in Autograph", viewInAutograph)
    .addToUi();
};

let menuFuncCounter = 0;
export function registerGlobalFunction(func: () => void): string {
  const funcName = `myGlobalFunc${menuFuncCounter++}`;
  (global as any)[funcName] = func;
  return funcName;
}

const viewInAutograph = registerGlobalFunction(() => {
  const sheet = new SheetHelper(SpreadsheetApp.getActiveSheet());

  const ui = SpreadsheetApp.getUi();
  const values = sheet.extractColumns({
    a: SheetHelperTransforms.asString,
    b: SheetHelperTransforms.asNumberOrNull
  });

  showPreformattedDialog(ui, JSON.stringify(values, null, 2));
});
