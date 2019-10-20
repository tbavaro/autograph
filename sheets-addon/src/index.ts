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
  const ui = SpreadsheetApp.getUi();
  ui.alert("ok!");
});
