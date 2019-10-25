import { LoadedData, PositionData } from "./generated/SharedTypes";
import SheetHelper, { SheetHelperTransforms, ValueTransform } from "./SheetHelper";
import { valueIfUndefined } from "./util";

type Sheet = GoogleAppsScript.Spreadsheet.Sheet;

const HEADER_MANAGED_AUTOGRAPH_SETTINGS = "managed:autograph:settings";

const HEADER_NODE_ID = "node:id";
const HEADER_NODE_LABEL = "node:label";
const HEADER_NODE_SECONDARY_LABEL = "node:secondaryLabel";
const HEADER_NODE_URL = "node:url";
const HEADER_NODE_COLOR = "node:color";
const HEADER_NODE_RANK = "node:rank";
const HEADER_LINK_SOURCE = "link:source";
const HEADER_LINK_TARGET = "link:target";
const HEADER_LINK_STROKE = "link:stroke";

function zipObjects<
  ZI extends { [ key: string ]: any[] }
>(
  input: ZI
): Array<
  { [ key in keyof ZI ]: (ZI[key] extends Array<infer T> ? (T | undefined) : undefined) }
> {
  const keys = Object.keys(input);
  const lengths = keys.map(k => {
    const v = input[k];
    return (v === undefined ? 0 : v.length);
  });
  const maxLength = Math.max.apply(Math, lengths);

  const results: any[] = [];
  for (let i = 0; i < maxLength; ++i) {
    results.push({});
  }
  keys.forEach(key => input[key].forEach((v, i) => results[i][key] = v));
  
  return results;
}

export default class AutographManagedSheet {
  public readonly sheet: Sheet;
  private readonly helper: SheetHelper;

  constructor(sheet: Sheet) {
    this.sheet = sheet;
    this.helper = new SheetHelper(sheet);
  }

  public loadData(): LoadedData {
    const values = this.helper.readColumnData({
      autographSettings: {
        header: HEADER_MANAGED_AUTOGRAPH_SETTINGS,
        transform: SheetHelperTransforms.asString
      },
      nodeIds: {
        header: HEADER_NODE_ID,
        transform: SheetHelperTransforms.asStringOrUndefined
      },
      nodeLabels: {
        header: HEADER_NODE_LABEL,
        transform: SheetHelperTransforms.asStringOrUndefined
      },
      nodeSecondaryLabels: {
        header: HEADER_NODE_SECONDARY_LABEL,
        transform: SheetHelperTransforms.asStringOrUndefined
      },
      nodeUrls: {
        header: HEADER_NODE_URL,
        transform: SheetHelperTransforms.asStringOrUndefined
      },
      nodeColors: {
        header: HEADER_NODE_COLOR,
        transform: SheetHelperTransforms.asStringOrUndefined
      },
      nodeRanks: {
        header: HEADER_NODE_RANK,
        transform: SheetHelperTransforms.asNumberOrUndefined
      },
      linkSources: {
        header: HEADER_LINK_SOURCE,
        transform: SheetHelperTransforms.asStringOrUndefined
      },
      linkTargets: {
        header: HEADER_LINK_TARGET,
        transform: SheetHelperTransforms.asStringOrUndefined
      },
      linkStrokes: {
        header: HEADER_LINK_STROKE,
        transform: SheetHelperTransforms.asStringOrUndefined
      }
    });

    return {
      version: 1,
      autographSettings: this.helper.unpackKeysAndValues(values.autographSettings || []),
      nodes: zipObjects({
        id: values.nodeIds || [],
        label: values.nodeLabels || [],
        secondaryLabel: values.nodeSecondaryLabels || [],
        url: values.nodeUrls || [],
        color: values.nodeColors || [],
        rank: values.nodeRanks || [],
      }),
      links: zipObjects({
        source: values.linkSources || [],
        target: values.linkTargets || [],
        stroke: values.linkStrokes || []
      })
    };
  }

  public saveData(data: PositionData) {
    this.helper.writeColumnData([
      {
        header: HEADER_MANAGED_AUTOGRAPH_SETTINGS,
        values: this.helper.packKeysAndValues(data.autographSettings)
      },
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
  }
}
