interface Versioned<VER extends number> {
  version: VER;
}

export interface LoadedDataV1 extends Versioned<1> {
  autographSettings: any;
  nodes: Array<{
    id?: string;
    label?: string;
    secondaryLabel?: string;
    url?: string;
    color?: string;
    rank?: number;
    isLocked?: boolean;
    x?: number;
    y?: number;
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
  autographSettings: any;
  nodes: Array<{
    id: string;
    isLocked: boolean;
    x?: number;
    y?: number;
  }>;
}

export type PositionData = PositionDataV1;
