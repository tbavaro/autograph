import AutographManagedSheet from "./AutographManagedSheet";
import AutographPopupWindow from "./AutographPopupWindow";
import { registerGlobalFunction } from "./GoogleAppsHelpers";
import SheetHelper from "./SheetHelper";
import { PositionData } from "./generated/SharedTypes";
import { valueIfUndefined } from "./util";

global.onOpen = () => {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("Autograph")
    .addItem("View in Autograph... (dev)", viewInAutographDev)
    // .addItem("Do test", doTest)
    .addToUi();
};

// const doTest = registerGlobalFunction(() => {
//   const sheet = SpreadsheetApp.getActiveSheet();

//   const managedSheet = new AutographManagedSheet(sheet);

//   const sheetHelper = new SheetHelper(sheet);
//   const values = sheetHelper.readColumnData({
//     aValues: {
//       header: "a",
//       transform: SheetHelperTransforms.asString
//     },
//     bValues: {
//       header: "b",
//       transform: SheetHelperTransforms.asNumberOrUndefined
//     }
//   });
  
//   const ui = SpreadsheetApp.getUi();
//   showPreformattedDialog(ui, JSON.stringify({
//     autographConfig: managedSheet.loadAutographConfig(),
//     values
//   }, null, 2));

//   managedSheet.updateAutographConfig(c => {
//     c.lastModifiedDate = `${new Date()}`;
//   });

//   const numValues = Math.floor(Math.random() * 1000);
//   const valuesToWrite = [];
//   for (let i = 0; i < numValues; ++i) {
//     valuesToWrite.push(`value#${i}`);
//   }
//   sheetHelper.writeColumnData([
//     {
//       header: "write1",
//       values: [
//         new Date(),
//         `expect ${numValues} values`,
//         ...valuesToWrite
//       ]
//     }
//   ]);
// });

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

global.autographSavePositions = (data: PositionData) => {
  Logger.log("writing values");
  const sheet = SpreadsheetApp.getActiveSheet();
  const helper = new SheetHelper(sheet);
  helper.writeColumnData([
    {
      header: "managed:node:id",
      values: data.nodes.map(n => n.id)
    },
    {
      header: "managed:node:isLocked",
      values: data.nodes.map(n => n.isLocked)
    },
    {
      header: "managed:node:x",
      values: data.nodes.map(n => valueIfUndefined<number | string>(n.x, ""))
    },
    {
      header: "managed:node:y",
      values: data.nodes.map(n => valueIfUndefined<number | string>(n.y, ""))
    }
  ]);
  Logger.log("finished writing values");
};
