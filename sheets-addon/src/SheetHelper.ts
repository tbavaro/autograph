type Sheet = GoogleAppsScript.Spreadsheet.Sheet;

type ValueTransform<T> = (value: any) => T;

const stringValueTransform: ValueTransform<string> = (v: any) => {
  if (typeof v === "string") {
    return v;
  } else if (v === null || v === undefined) {
    return "";
  } else {
    return `${v}`;
  }
};

// NB: will be NaN if non-empty string that's not parseable as a number
const numberValueTransform: ValueTransform<number | null> = (v: any) => {
  if (typeof v === "number") {
    return v;
  } else if (v === null || v === undefined || v === "") {
    return null;
  } else {
    return parseFloat(`${v}`);
  }
};

export const SheetHelperTransforms = {
  asString: stringValueTransform,
  asNumberOrNull: numberValueTransform
};

// tslint:disable-next-line: interface-over-type-literal
type ExtractionOptions = {
  [ key: string ]: {
    header: string;
    transform: ValueTransform<unknown>;
  }
};

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

  public extractColumns<EO extends ExtractionOptions>(options: EO): {
    [ header in keyof EO ]?: Array<(EO[header]["transform"] extends ValueTransform<infer T> ? T : unknown)>
  } {
    const keys = Object.keys(options);
    const headers = keys.map(key => options[key].header);
    const columnsValuesRaw = this.extractColumnsRaw(headers);

    const result: any = {};
    columnsValuesRaw.forEach((values, i) => {
      if (values !== null) {
        const key = keys[i];
        const header = headers[i];
        const transform = options[key].transform;
        result[key] = values.map(transform);
      }
    });
    return result;
  }

  public findColumns(
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

  private extractColumnsRaw(headers: string[]): Array<any[] | null> {
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
}

// const s = new SheetHelper(SpreadsheetApp.getActiveSheet());
// const resultv = s.extractColumns({
//   a: stringValueTransform,
//   b: numberValueTransform
// });
