declare namespace glFunctions {
  interface global {
    onOpen(): void;
    autographSavePositions(data: any): void;
  }
}

declare var global: glFunctions.global;
