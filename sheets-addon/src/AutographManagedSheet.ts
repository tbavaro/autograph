import SheetHelper, { SheetHelperTransforms } from "./SheetHelper";
import { findInArray } from "./util";

type Sheet = GoogleAppsScript.Spreadsheet.Sheet;

const METADATA_KEY_AUTOGRAPH_CONFIG = "autograph.config";

const HEADER_NODE_ID = "node.id";

interface AutographConfig {
  lastModifiedDate?: string;
  appData?: string;
}

interface LoadedData {
  autographConfig: AutographConfig;
  nodeIds?: string[];
}

export default class AutographManagedSheet {
  public readonly sheet: Sheet;
  private readonly helper: SheetHelper;

  constructor(sheet: Sheet) {
    this.sheet = sheet;
    this.helper = new SheetHelper(sheet);
  }

  public loadData(): LoadedData {
    const autographConfig = this.loadAutographConfig();

    const values = this.helper.readColumnData({
      nodeIds: {
        header: HEADER_NODE_ID,
        transform: SheetHelperTransforms.asString
      }
    });

    return {
      autographConfig,
      nodeIds: values.nodeIds
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

  public loadAutographConfig(): AutographConfig {
    return JSON.parse(this.getOrCreateAutographConfigMetadata().getValue());
  }

  private saveAutographConfig(config: AutographConfig) {
    this.getOrCreateAutographConfigMetadata().setValue(JSON.stringify(config));
  }

  public updateAutographConfig(transform: (prevConfig: AutographConfig) => AutographConfig | void) {
    const prevConfig = this.loadAutographConfig();
    const newConfig = transform(prevConfig) || prevConfig;
    this.saveAutographConfig(newConfig);
  }
}
