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
  }>;
  links: Array<{
    source?: string;
    target?: string;
  }>;
}

export type LoadedData = LoadedDataV1;

export type LoadedDataAny = LoadedDataV1;
