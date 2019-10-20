import AutographManagedSheet from "./AutographManagedSheet";
import { registerGlobalFunction, showPreformattedDialog } from "./GoogleAppsHelpers";
import SheetHelper, { SheetHelperTransforms } from "./SheetHelper";

global.onOpen = () => {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("Scripts")
    .addItem("View in Autograph", viewInAutograph)
    .addToUi();
};

const viewInAutograph = registerGlobalFunction(() => {
  const sheet = SpreadsheetApp.getActiveSheet();

  const managedSheet = new AutographManagedSheet(sheet);
  managedSheet.createAutographConfigColumnIfNeeded();

  const sheetHelper = new SheetHelper(sheet);
  const values = sheetHelper.extractColumns({
    aValues: {
      header: "a",
      transform: SheetHelperTransforms.asString
    },
    bValues: {
      header: "b",
      transform: SheetHelperTransforms.asNumberOrNull
    }
  });
  
  const ui = SpreadsheetApp.getUi();
  showPreformattedDialog(ui, JSON.stringify(values, null, 2));
});
