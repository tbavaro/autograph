import SheetHelper, { SheetHelperTransforms } from "./SheetHelper";
import { findInArray } from "./util";

type Sheet = GoogleAppsScript.Spreadsheet.Sheet;

const MANAGED_COLUMN_BACKGROUND_COLOR = "#aaaaaa";

const HEADER_AUTOGRAPH_CONFIG = "autograph.config";

type AutographConfig = string;

interface LoadedData {
  autographConfig?: AutographConfig;
}

export default class AutographManagedSheet {
  public readonly sheet: Sheet;
  private readonly helper: SheetHelper;
  private loadedData: LoadedData | undefined;

  constructor(sheet: Sheet) {
    this.sheet = sheet;
    this.helper = new SheetHelper(sheet);
  }

  public reloadData() {
    const values = this.helper.extractColumns({
      autographConfig: {
        header: HEADER_AUTOGRAPH_CONFIG,
        transform: SheetHelperTransforms.asString
      }
    });

    Logger.log("values: " + JSON.stringify(values));

    let autographConfig: string | undefined;
    if (values.autographConfig) {
      autographConfig = findInArray(values.autographConfig, v => !!v) || "";
    }

    this.loadedData = {
      autographConfig
    };

    Logger.log("loaded data: " + JSON.stringify(this.loadedData));
  }

  private invalidateLoadedData() {
    this.loadedData = undefined;
  }

  private loadDataIfNeeded(): LoadedData {
    if (this.loadedData === undefined) {
      this.reloadData();
      if (this.loadedData === undefined) {
        throw new Error();
      }
    }
    return this.loadedData;
  }

  public hasAutographConfigColumn(): boolean {
    return this.loadDataIfNeeded().autographConfig !== undefined;
  }

  public createAutographConfigColumnIfNeeded() {
    if (!this.hasAutographConfigColumn()) {
      this.sheet.insertColumnBefore(1);
      const column = this.sheet.getRange(1, 1, this.sheet.getMaxRows(), 1);
      this.sheet.hideColumn(column);
      column.setBackground(MANAGED_COLUMN_BACKGROUND_COLOR);
      column.setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
      const headerCell = column.offset(0, 0, 1, 1);
      headerCell.setValue(HEADER_AUTOGRAPH_CONFIG);
      headerCell.setFontWeight("bold");
      headerCell.setNote("Automatically managed by the Autograph application. DO NOT EDIT.");
      this.invalidateLoadedData();
    }
  }
}
