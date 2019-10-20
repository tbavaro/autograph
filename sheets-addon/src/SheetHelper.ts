type Sheet = GoogleAppsScript.Spreadsheet.Sheet;

// type ValueTransform<T> = (value: string) => T | undefined;

// const stringValueTransform: ValueTransform<string> = v => (v === "" ? undefined : v);

// type ExtractionOptions = {
//   [ header: string ]: ValueTransform<unknown>
// };

function trimValues(values: any[]): any[] {
  let i = values.length;
  while (i > 0) {
    const value = values[i - 1];
    if (value !== null && value !== "" && value !== undefined) {
      break;
    }
    --i;
  }
  return (i === values.length ? values : values.slice(0, i));
}

export default class SheetHelper {
  public readonly sheet: Sheet;

  constructor(sheet: Sheet) {
    this.sheet = sheet;
  }

  public extractColumns(headers: string[]): Array<any[] | null> {
    const headerRow = 1;
    const firstDataRow = headerRow + 1;
    const lastRow = this.sheet.getLastRow();
    const maxNumDataRows = Math.max(0, lastRow - firstDataRow + 1);

    const columnIdxs = this.findColumns(headers, headerRow);
    return columnIdxs.map(idx => {
      if (idx === null) {
        return null;
      }

      if (maxNumDataRows === 0) {
        return [];
      }

      const range = this.sheet.getRange(firstDataRow, idx, maxNumDataRows, 1);
      const values = range.getValues().map(row => (row.length === 0 ? null : row[0]));
      return trimValues(values);
    });
  }

  private findColumns(
    headers: string[],
    headerRow: number
  ): Array<number | null> {
    const startColumn = 1;
    const numColumns = this.sheet.getLastColumn() - startColumn + 1;

    let values: Array<string | null>;
    if (numColumns < 1) {
      values = [];
    } else {
      const range = this.sheet.getRange(headerRow, startColumn, 1, numColumns);
      values = range.getValues()[0];
    }

    return headers.map(header => {
      const idx = values.indexOf(header);
      return (idx === -1 ? null : startColumn + idx);
    });
  }

}
