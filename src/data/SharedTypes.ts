// export interface AutographConfigV1 {
//   lastModifiedDate?: string;
// }

interface Versioned<VER extends number> {
  version: VER;
}

export interface LoadedDataV1 extends Versioned<1> {
  // autographConfig: AutographConfigV1;
  nodes: Array<{
    id?: string;
    label?: string;
    secondaryLabel?: string;
    url?: string;
    color?: string;
    rank?: number;
  }>;
  links: Array<{
    source?: string;
    target?: string;
    stroke?: string;
  }>;
}

export type LoadedData = LoadedDataV1;

export type LoadedDataAny = LoadedDataV1;

export interface PositionDataV1 extends Versioned<1> {
  nodes: Array<{
    id: string;
    isLocked: boolean;
    x?: number;
    y?: number;
  }>
}

export type PositionData = PositionDataV1;
