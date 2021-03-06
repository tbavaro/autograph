import * as GraphData from "../data/GraphData";
import * as GoogleApi from "../google/GoogleApi";

// TODO this whole file is kind of a mess, was rushed this week. should probably
// rewrite if a lot more complexity is needed

const NODES_SHEET = "nodes";
const NODE_ID_KEY = "id";
const NODE_LABEL_KEY = "label";
const NODE_SECONDARY_LABEL_KEY = "secondaryLabel";
const NODE_URL_KEY = "url";
const NODE_COLOR_KEY = "color";
const NODE_RANK_KEY = "rank";

const LINKS_SHEET = "links";
const LINK_SOURCE_ID_KEY = "source";
const LINK_TARGET_ID_KEY = "target";
const LINK_STROKE_KEY = "stroke";

function removeUndefineds<T>(values: Array<T | undefined>): T[] {
  return values.filter((v) => v !== undefined) as T[];
}

function nthIfDefinedElseDefault<T, U>(values: T[], n: number, defaultValue: U): (T | U) {
  return (values.length > n ? values[n] : defaultValue);
}

function assertDefined<T>(value: (T | undefined), label: string): T {
  if (value === undefined) {
    throw new Error("value must not be undefined: " + label);
  }
  return value;
}

// exported for testing
export const internals = {
  createSGDFromDataColumns(attrs: {
    nodeIds: string[],
    nodeLabels: string[],
    nodeSecondaryLabels?: string[],
    nodeUrls?: string[],
    nodeColors?: string[],
    nodeRanks?: string[],
    linkSourceIds: string[],
    linkTargetIds: string[],
    linkStrokes?: string[]
  }): GraphData.SerializedDocument {
    const nodes = removeUndefineds(attrs.nodeIds.map((id, index) => {
      if (id === undefined) {
        return undefined;
      }

      const result: GraphData.SerializedNode = {
        id: id,
        label: nthIfDefinedElseDefault(attrs.nodeLabels, index, id)
      };

      if (attrs.nodeColors !== undefined) {
        result.color = nthIfDefinedElseDefault(attrs.nodeColors, index, "") || null;
      }

      if (attrs.nodeSecondaryLabels !== undefined) {
        result.secondaryLabel = nthIfDefinedElseDefault(attrs.nodeSecondaryLabels, index, "") || null;
      }

      if (attrs.nodeUrls !== undefined) {
        result.url = nthIfDefinedElseDefault(attrs.nodeUrls, index, "") || null;
      }

      if (attrs.nodeRanks !== undefined) {
        const rankStr = nthIfDefinedElseDefault(attrs.nodeRanks, index, "");
        result.rank = rankStr === "" ? null : parseFloat(rankStr);
      }

      return result;
    }));

    const links: GraphData.SerializedLink[] = removeUndefineds(attrs.linkSourceIds.map((sourceId, index) => {
      const targetId = attrs.linkTargetIds[index];
      if (sourceId === undefined || targetId === undefined) {
        return undefined;
      }

      const result: GraphData.SerializedLink = {
        source: sourceId,
        target: targetId,
        stroke: GraphData.DEFAULT_LINK_STROKE
      };

      if (attrs.linkStrokes !== undefined) {
        const linkStroke = nthIfDefinedElseDefault(attrs.linkStrokes, index, "") || undefined;
        if (linkStroke !== undefined) {
          result.stroke = linkStroke as GraphData.LinkStroke;
        }
      }

      return result;
    }));

    return {
      nodes: nodes,
      links: links
    };
  },

  // data should be loaded with COLUMNS as the major dimension
  createSGDFromSheetData(attrs: {
    nodesData: any[][],
    linksData: any[][]
  }) {
    const [nodeIds, nodeLabels, nodeSecondaryLabels, nodeColors, nodeUrls, nodeRanks] = this.extractNamedColumnsToStringArrays(
      attrs.nodesData, [
        NODE_ID_KEY, NODE_LABEL_KEY, NODE_SECONDARY_LABEL_KEY, NODE_COLOR_KEY, NODE_URL_KEY, NODE_RANK_KEY
      ]
    );
    const [linkSourceIds, linkTargetIds, linkStrokes] = this.extractNamedColumnsToStringArrays(
      attrs.linksData, [
        LINK_SOURCE_ID_KEY, LINK_TARGET_ID_KEY, LINK_STROKE_KEY
      ]
    );
    const result = this.createSGDFromDataColumns({
      nodeIds: assertDefined(nodeIds, "nodeIds"),
      nodeLabels: assertDefined(nodeLabels, "nodeLabels"),
      nodeSecondaryLabels: nodeSecondaryLabels,
      nodeUrls: nodeUrls,
      nodeColors: nodeColors,
      nodeRanks: nodeRanks,
      linkSourceIds: assertDefined(linkSourceIds, "linkSourceIds"),
      linkTargetIds: assertDefined(linkTargetIds, "linkTargetIds"),
      linkStrokes: linkStrokes
    });
    return result;
  },

  // data should be loaded with COLUMNS as the major dimension
  extractNamedColumnsToStringArrays(data: any[][], columnNames: string[]): Array<string[] | undefined> {
    const columnNamesToIndex = new Map<string, number>();
    columnNames.forEach((columnName, index) => {
      if (columnNamesToIndex.has(columnName)) {
        throw new Error("duplicate column name: " + columnName);
      }
      columnNamesToIndex.set(columnName, index);
    });
    const columnIndexes = columnNames.map(() => -1);
    data.forEach((columnData, sourceIndex) => {
      if (columnData.length > 0) {
        const columnName = extractValueAsString(columnData[0]);
        const index = columnNamesToIndex.get(columnName);
        if (index !== undefined) {
          columnIndexes[index] = sourceIndex;
        }
      }
    });
    return columnIndexes.map((index, nth) => {
      if (index === -1) {
        return undefined;
      } else {
        return extractValuesAsStringSkipFirst(data[index]);
      }
    });
  }
};

function extractValueAsString(value: any): string {
  if (value === undefined || value === null) {
    return "";
  } else {
    return "" + value;
  }
}

function extractValuesAsStringSkipFirst(values: any[]): string[] {
  if (values.length < 2) {
    return [];
  }
  let result = new Array(values.length - 1);
  for (let i = 1; i < values.length; ++i) {
    result[i - 1] = extractValueAsString(values[i]);
  }

  // trim any extra off the bottom
  let j = result.length;
  while (j > 0 && (result[j - 1] === undefined || result[j - 1] === "")) {
    --j;
  }
  if (j < result.length) {
    result = result.slice(0, j);
  }

  return result;
}

export function loadDocumentFromSheet(sheetId: string): PromiseLike<GraphData.SerializedDocument> {
  const myError = (msg?: string) => {
    return new Error("error loading spreadsheet (" + msg + "): " + sheetId);
  };

  return GoogleApi.sheetsSingleton().then((Sheets) => {
    return Sheets.values.batchGet({
      spreadsheetId: sheetId,
      majorDimension: "COLUMNS",
      ranges: [NODES_SHEET, LINKS_SHEET] as any
    }).then(
      (data) => {
        if (!data.result.valueRanges) {
          throw myError("no values");
        } else if (data.result.valueRanges.length !== 2) {
          throw myError("incorrect response size");
        }

        const sheetValues: any[][] = data.result.valueRanges.map((valueRange) => valueRange.values || []);

        const sgd = internals.createSGDFromSheetData({
          nodesData: sheetValues[0],
          linksData: sheetValues[1]
        });

        return sgd;
      },
      (error) => {
        console.log("error loading sheet", sheetId, error);
        throw myError();
      }
    );
  });
}

export function preInit() {
  /* */
}
