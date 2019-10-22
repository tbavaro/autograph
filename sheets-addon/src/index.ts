import AutographManagedSheet from "./AutographManagedSheet";
import AutographPopupWindow from "./AutographPopupWindow";
import { registerGlobalFunction, showPreformattedDialog } from "./GoogleAppsHelpers";
import SheetHelper, { SheetHelperTransforms } from "./SheetHelper";

global.onOpen = () => {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("Autograph")
    .addItem("View in Autograph... (dev)", viewInAutographDev)
    .addItem("Do test", doTest)
    .addToUi();
};

const doTest = registerGlobalFunction(() => {
  const sheet = SpreadsheetApp.getActiveSheet();

  const managedSheet = new AutographManagedSheet(sheet);

  const sheetHelper = new SheetHelper(sheet);
  const values = sheetHelper.readColumnData({
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
  showPreformattedDialog(ui, JSON.stringify({
    autographConfig: managedSheet.loadAutographConfig(),
    values
  }, null, 2));

  managedSheet.updateAutographConfig(c => {
    c.lastModifiedDate = `${new Date()}`;
  });

  const numValues = Math.floor(Math.random() * 1000);
  const valuesToWrite = [];
  for (let i = 0; i < numValues; ++i) {
    valuesToWrite.push(`value#${i}`);
  }
  sheetHelper.writeColumnData([
    {
      header: "write1",
      values: [
        new Date(),
        `expect ${numValues} values`,
        ...valuesToWrite
      ]
    }
  ]);
});

function viewInAutographImpl(isDev: boolean) {
  const popup = new AutographPopupWindow();
  popup.display(SpreadsheetApp.getUi(), isDev);
}

const viewInAutographDev = registerGlobalFunction(() => viewInAutographImpl(/*isDev=*/true));
