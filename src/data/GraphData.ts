import * as DeepReadonly from "./DeepReadonly";
import * as Defaults from "./Defaults";

export type Id = string;

export const DEFAULT_LAYOUT_TYPE = "force_simulation";
export const DEFAULT_ORIGIN_PULL_STRENGTH = 0.001;
export const DEFAULT_PARTICLE_CHARGE = 500;
export const DEFAULT_CHARGE_DISTANCE_MAX = 300;
export const DEFAULT_LINK_DISTANCE = 100;

/**
 * V1
 */

/**
 * @autogents validator
 */
export type SerializedNodeV1 = {
  id: Id;
  label: string;
  secondaryLabel?: string | null;
  url?: string | null;
  color?: string | null;
  isLocked?: boolean;
  x?: number | null;
  y?: number | null;
  rank?: number | null;
};

/**
 * @autogents validator
 */
export type LinkStroke = (
  "solid" |
  "dashed"
);

export const DEFAULT_LINK_STROKE: LinkStroke = "solid";

/**
 * @autogents validator
 */
export type SerializedLinkV1 = {
  source: Id;
  target: Id;
  stroke?: LinkStroke;
};

/**
 * @autogents validator
 */
export type SerializedZoomStateV1 = {
  centerX: number;
  centerY: number;
  scale: number;
};

/**
 * @autogents validator
 */
export type SerializedLayoutStateV1 = {
  layoutType?: "force_simulation";
  forceSimulationConfig?: {
    originPullStrength?: number;
    particleCharge?: number;
    chargeDistanceMax?: number;
    linkDistance?: number;
    radialRankSeparation?: number;
    radialRankStrength?: number;
  };
};

/**
 * @autogents validator
 */
export type SerializedNodeRenderModeV1 = (
  "basic" |
  "raw_html"  // deprecated
);

/**
 * @autogents validator
 */
export type SerializedDisplayConfigV1 = {
  nodeRenderMode?: SerializedNodeRenderModeV1;
};

/**
 * @autogents validator
 */
export type SerializedDataSourceV1 = {
  connectedSpreadsheetId?: string | null;
  lastMergeTime?: string | null; // UTC timestamp
};

/**
 * @autogents validator
 */
export type SerializedDocumentV1 = {
  version?: 1;
  nodes?: SerializedNodeV1[];
  links?: SerializedLinkV1[];
  zoomState?: SerializedZoomStateV1;
  layoutState?: SerializedLayoutStateV1;
  displayConfig?: SerializedDisplayConfigV1;
  dataSource?: SerializedDataSourceV1;
};

/**
 * Latest version
 */

export type SerializedDocument = SerializedDocumentV1;
export type SerializedNode = SerializedNodeV1;
export type SerializedLink = SerializedLinkV1;

const REQUIRED_VALUE = Object.freeze(["<required value>"]) as any;

export type Document = Defaults.DeepRequired<SerializedDocument>;
export type Node = Defaults.DeepRequired<SerializedNode>;
export type ZoomState = Document["zoomState"];
export type DisplayConfig = Document["displayConfig"];
export type NodeRenderMode = DisplayConfig["nodeRenderMode"];

const linkDefaults: Defaults.Defaults<SerializedLink> = {
  source: REQUIRED_VALUE,
  target: REQUIRED_VALUE,
  stroke: DEFAULT_LINK_STROKE
};

const nodeDefaults = DeepReadonly.deepFreeze<Defaults.Defaults<SerializedNode>>({
  id: REQUIRED_VALUE,
  label: REQUIRED_VALUE,
  secondaryLabel: null,
  url: null,
  color: null,
  isLocked: false,
  x: null,
  y: null,
  rank: null
});

export const documentDefaults = DeepReadonly.deepFreeze<Defaults.Defaults<SerializedDocument>>({
  version: 1,
  nodes: [nodeDefaults],
  links: [
    linkDefaults
  ],
  zoomState: {
    centerX: 0,
    centerY: 0,
    scale: 1
  },
  layoutState: {
    layoutType: DEFAULT_LAYOUT_TYPE,
    forceSimulationConfig: {
      originPullStrength: DEFAULT_ORIGIN_PULL_STRENGTH,
      particleCharge: DEFAULT_PARTICLE_CHARGE,
      chargeDistanceMax: DEFAULT_CHARGE_DISTANCE_MAX,
      linkDistance: DEFAULT_LINK_DISTANCE,
      radialRankSeparation: 100,
      radialRankStrength: 0
    }
  },
  displayConfig: {
    nodeRenderMode: "basic"
  },
  dataSource: {
    connectedSpreadsheetId: null,
    lastMergeTime: null
  }
});

export const LATEST_VERSION: number = documentDefaults.version;

export function createDefaultDocument(): Document {
  return Defaults.createFromDefaults(documentDefaults);
}

export function applyDefaults(sd: SerializedDocument): Document {
  return Defaults.applyDefaults<SerializedDocument>(sd, documentDefaults);
}

export function applyNodeDefaults(n: SerializedNode): Node {
  return Defaults.applyDefaults<SerializedNode>(n, nodeDefaults);
}

export function load<T extends { version?: number, [key: string]: any }>(
  input: T
): Document {
  let inputDocument: SerializedDocument;

  switch (input.version) {
    case undefined:
    case 1: {
      const inputDocumentV1 = input as SerializedDocumentV1;
      inputDocument = upgradeV1(inputDocumentV1);
      break;
    }

    default:
      throw new Error(`unsupported document version: ${input.version}`);
  }

  // NB: could try re-validating here if upgrade logic gets janky

  return applyDefaults(inputDocument);
}

function upgradeV1(input: SerializedDocumentV1): SerializedDocument {
  return input;
}
