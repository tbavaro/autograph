import { findDuplicates, uniqueValues } from "./util";

type Sheet = GoogleAppsScript.Spreadsheet.Sheet;

type ValueTransform<T> = (value: any) => T;

const DEFAULT_HEADER_ROW = 1;

const stringOrUndefinedValueTransform: ValueTransform<string | undefined> = (v: any) => {
  if (v === null || v === undefined || v === "") {
    return undefined;
  } else if (typeof v === "string") {
    return v;
  } else {
    return `${v}`;
  }
};

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
const numberValueTransform: ValueTransform<number | undefined> = (v: any) => {
  if (typeof v === "number") {
    return v;
  } else if (v === null || v === undefined || v === "") {
    return undefined;
  } else {
    return parseFloat(`${v}`);
  }
};

export const SheetHelperTransforms = {
  asString: stringValueTransform,
  asStringOrUndefined: stringOrUndefinedValueTransform,
  asNumberOrUndefined: numberValueTransform
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

  public readColumnData<EO extends ExtractionOptions>(options: EO): {
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

  private findOrCreateColumns(
    headers: string[],
    headerRow: number
  ): number[] {
    const findResult = this.findColumns(headers, headerRow);

    const missingHeaders: string[] = [];
    findResult.forEach((columnIdx, i) => {
      if (columnIdx === null) {
        missingHeaders.push(headers[i]);
      }
    });

    // if we aren't missing anything, then we're done
    if (missingHeaders.length === 0) {
      return findResult as number[];
    }

    this.createColumns({
      headers: uniqueValues(missingHeaders),
      headerRow,
      hidden: true
    });

    // should succeed on second attempt
    return this.findOrCreateColumns(headers, headerRow);
  }

  private createColumns(attrs: {
    headers: string[];
    headerRow: number;
    hidden?: boolean;
  }) {
    const { headers, headerRow } = attrs;

    if (headers.length === 0) {
      return;
    }

    this.sheet.insertColumnsBefore(1, headers.length);
    const headerCells = this.sheet.getRange(headerRow, 1, 1, headers.length);

    if (attrs.hidden) {
      this.sheet.hideColumn(headerCells);
    }

    headerCells.setFontWeight("bold");
    headerCells.setValues([ headers ]);
  }

  private extractColumnsRaw(headers: string[]): Array<any[] | null> {
    const headerRow = DEFAULT_HEADER_ROW;
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

  public writeColumnData(data: Array<{
    header: string;
    values: any[];
  }>) {
    // no-op if empty `data`
    if (data.length === 0) {
      return;
    }

    const headerRow = DEFAULT_HEADER_ROW;
    const firstValueRow = headerRow + 1;

    const headers = data.map(d => d.header);
    const duplicateHeaders = findDuplicates(headers);
    if (duplicateHeaders.length !== 0) {
      throw new Error(`duplicate headers: ${JSON.stringify(duplicateHeaders)}`);
    }

    const columnIdxs = this.findOrCreateColumns(headers, headerRow);
    
    // ensure we have enough rows to hold everything
    const maxNumValues = Math.max.apply(Math, data.map(d => d.values.length));
    const numRowsToAdd = Math.max(0, (headerRow + maxNumValues) - this.sheet.getMaxRows());
    if (numRowsToAdd > 0) {
      this.sheet.insertRowsAfter(this.sheet.getMaxRows(), numRowsToAdd);
    }

    // set values and clear out existing values if the new data is shorter
    const maxRowsToClear = Math.max(0, this.sheet.getLastRow() - headerRow);
    columnIdxs.forEach((columnIdx, i) => {
      const values = data[i].values;
      if (values.length > 0) {
        const valuesRange = this.sheet.getRange(firstValueRow, columnIdx, values.length, 1);
        valuesRange.setValues(values.map(v => [v]));
      }

      // if there might have been data past the end, clear those cells
      const numRowsToClear = Math.max(0, maxRowsToClear - values.length);
      if (numRowsToClear > 0) {
        const clearRange = this.sheet.getRange(firstValueRow + values.length, columnIdx, numRowsToClear, 1);
        clearRange.clearContent();
      }
    });
  }
}

// const s = new SheetHelper(SpreadsheetApp.getActiveSheet());
// const resultv = s.extractColumns({
//   a: stringValueTransform,
//   b: numberValueTransform
// });
