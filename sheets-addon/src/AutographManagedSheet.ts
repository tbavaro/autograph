import { LoadedData } from "./generated/SharedTypes";
import SheetHelper, { SheetHelperTransforms } from "./SheetHelper";
import { findInArray } from "./util";

type Sheet = GoogleAppsScript.Spreadsheet.Sheet;

const METADATA_KEY_AUTOGRAPH_CONFIG = "autograph.config";

const HEADER_NODE_ID = "node:id";
const HEADER_NODE_LABEL = "node:label";
const HEADER_LINK_SOURCE = "link:source";
const HEADER_LINK_TARGET = "link:target";

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
    // const autographConfig = this.loadAutographConfig();

    const values = this.helper.readColumnData({
      nodeIds: {
        header: HEADER_NODE_ID,
        transform: SheetHelperTransforms.asString
      },
      nodeLabels: {
        header: HEADER_NODE_LABEL,
        transform: SheetHelperTransforms.asString
      },
      linkSources: {
        header: HEADER_LINK_SOURCE,
        transform: SheetHelperTransforms.asString
      },
      linkTargets: {
        header: HEADER_LINK_TARGET,
        transform: SheetHelperTransforms.asString
      }
    });

    return {
      version: 1,
      // autographConfig,
      nodes: zipObjects({
        id: values.nodeIds || [],
        label: values.nodeLabels || []
      }),
      links: zipObjects({
        source: values.linkSources || [],
        target: values.linkTargets || []
      })
    };
  }

  private getOrCreateAutographConfigMetadata(): GoogleAppsScript.Spreadsheet.DeveloperMetadata {
    const metadata = this.sheet.getDeveloperMetadata();
    // metadata.forEach(m => {
    //   Logger.log(JSON.stringify({
    //     key: m.getKey(),
    //     value: m.getValue()
    //   }));
    // });

    const configMetadata = findInArray(metadata, m => m.getKey() === METADATA_KEY_AUTOGRAPH_CONFIG);
    if (configMetadata !== undefined) {
      return configMetadata;
    }
    this.sheet.addDeveloperMetadata(METADATA_KEY_AUTOGRAPH_CONFIG, "{}");
    return this.getOrCreateAutographConfigMetadata();
  }

  // public loadAutographConfig(): AutographConfig {
  //   return JSON.parse(this.getOrCreateAutographConfigMetadata().getValue());
  // }

  // private saveAutographConfig(config: AutographConfig) {
  //   this.getOrCreateAutographConfigMetadata().setValue(JSON.stringify(config));
  // }

  // public updateAutographConfig(transform: (prevConfig: AutographConfig) => AutographConfig | void) {
  //   const prevConfig = this.loadAutographConfig();
  //   const newConfig = transform(prevConfig) || prevConfig;
  //   this.saveAutographConfig(newConfig);
  // }
}
