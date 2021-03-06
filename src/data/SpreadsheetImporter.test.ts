import * as GraphData from "../data/GraphData";

import { internals } from "./SpreadsheetImporter";

it("test empty spreadsheet", () => {
  const result = internals.createSGDFromDataColumns({
    nodeIds: [],
    nodeLabels: [],
    linkSourceIds: [],
    linkTargetIds: []
  });
  expect(result).toMatchObject({
    nodes: [],
    links: []
  });
});

it("test simple spreadsheet", () => {
  const result = internals.createSGDFromDataColumns({
    nodeIds: [ "a", "b", "c" ],
    nodeLabels: [ "node a", "node b", "node c" ],
    linkSourceIds: [ "a", "b" ],
    linkTargetIds: [ "b", "c" ]
  });
  expect(result).toMatchObject({
    nodes: [
      {
        id: "a",
        label: "node a"
      },
      {
        id: "b",
        label: "node b"
      },
      {
        id: "c",
        label: "node c"
      }
    ],
    links: [
      {
        source: "a",
        target: "b"
      },
      {
        source: "b",
        target: "c"
      }
    ]
  });
});

it("test simple spreadsheet with colors", () => {
  const result = internals.createSGDFromDataColumns({
    nodeIds: [ "a", "b", "c" ],
    nodeLabels: [ "node a", "node b", "node c" ],
    nodeColors: [ "red", "", "blue" ],
    linkSourceIds: [ "a", "b" ],
    linkTargetIds: [ "b", "c" ]
  });
  expect(result).toMatchObject({
    nodes: [
      {
        id: "a",
        label: "node a",
        color: "red"
      },
      {
        id: "b",
        label: "node b",
        color: null
      },
      {
        id: "c",
        label: "node c",
        color: "blue"
      }
    ],
    links: [
      {
        source: "a",
        target: "b"
      },
      {
        source: "b",
        target: "c"
      }
    ]
  });
});

it("test simple spreadsheet with secondary labels and urls", () => {
  const result = internals.createSGDFromDataColumns({
    nodeIds: [ "a", "b", "c" ],
    nodeLabels: [ "node a", "node b", "node c" ],
    nodeSecondaryLabels: [ "a2", "", "c2" ],
    nodeUrls: [ "", "://b", "://c" ],
    linkSourceIds: [ "a", "b" ],
    linkTargetIds: [ "b", "c" ]
  });
  expect(result).toMatchObject({
    nodes: [
      {
        id: "a",
        label: "node a",
        secondaryLabel: "a2",
        url: null
      },
      {
        id: "b",
        label: "node b",
        secondaryLabel: null,
        url: "://b"
      },
      {
        id: "c",
        label: "node c",
        secondaryLabel: "c2",
        url: "://c"
      }
    ],
    links: [
      {
        source: "a",
        target: "b"
      },
      {
        source: "b",
        target: "c"
      }
    ]
  });
});

function testLinkStroke(
  spreadsheetLinkStroke: string | undefined,
  expectedLinkStroke: GraphData.LinkStroke | undefined
) {
  it(`test simple spreadsheet with link stroke: ${spreadsheetLinkStroke}`, () => {
    const result = internals.createSGDFromDataColumns({
      nodeIds: [ "a", "b" ],
      nodeLabels: [ "node a", "node b" ],
      linkSourceIds: [ "a" ],
      linkTargetIds: [ "b" ],
      linkStrokes: spreadsheetLinkStroke ? [ spreadsheetLinkStroke ] : []
    });
    expect(result).toMatchObject({
      nodes: [
        {
          id: "a",
          label: "node a"
        },
        {
          id: "b",
          label: "node b"
        }
      ],
      links: [
        {
          source: "a",
          target: "b",
          stroke: expectedLinkStroke
        }
      ]
    });
  });
}

testLinkStroke(undefined, "solid");
testLinkStroke("solid", "solid");
testLinkStroke("dashed", "dashed");

function transpose(input: any[][]): any[][] {
  if (input.length === 0) {
    return [];
  }
  const output = input[0].map((_, column) => input.map((__, row) => {
    if (input.length <= row || input[row].length <= column) {
      return undefined;
    } else {
      return input[row][column];
    }
  }));
  // trim extra undefineds in each output column
  return output.map((column) => {
    while (column.length > 0 && column[column.length - 1] === undefined) {
      column = column.slice(0, column.length - 1);
    }
    return column;
  });
}

it("test transpose helper", () => {
  expect(transpose([])).toMatchObject([]);
  expect(transpose([
    [ "x" ]
  ])).toMatchObject([
    [ "x" ]
  ]);
  expect(transpose([
    [ undefined ]
  ])).toMatchObject([
    [ ]
  ]);
  expect(transpose([
    [ "x", undefined ]
  ])).toMatchObject([
    [ "x" ],
    [ ]
  ]);
  expect(transpose([
    [ "A",  "B",  "C"  ],
    [ "a1", "b1", "c1" ]
  ])).toMatchObject([
    [ "A", "a1" ],
    [ "B", "b1" ],
    [ "C", "c1" ]
  ]);
  expect(transpose([
    [ "A",  "B",  "C"  ],
    [ "a1", "b1" ]
  ])).toMatchObject([
    [ "A", "a1" ],
    [ "B", "b1" ],
    [ "C" ]
  ]);
  expect(transpose([
    [ "A",  "B",  "C"  ],
    [ "a1", undefined, "c1" ]
  ])).toMatchObject([
    [ "A", "a1" ],
    [ "B" ],
    [ "C", "c1" ]
  ]);
});

it("test extractNamedColumnsToStringArrays", () => {
  const wrapped = (data: any[], columnNames: string[]) => {
    return internals.extractNamedColumnsToStringArrays(transpose(data), columnNames);
  };

  // empty
  expect(wrapped([], [])).toMatchObject([]);

  // others
  expect(wrapped(
    [
      [ "A",  "B"  ],
      [ "a1", "b1" ],
      [ "a2", "b2" ]
    ],
    [
      "A"
    ]
  )).toMatchObject([
    [ "a1", "a2" ]
  ]);
  expect(wrapped(
    [
      [ "A",  "B"  ],
      [ "a1", "b1" ],
      [ "a2", "b2" ]
    ],
    [
      "A", "B"
    ]
  )).toMatchObject([
    [ "a1", "a2" ],
    [ "b1", "b2" ]
  ]);
  expect(wrapped(
    [
      [ "A",  "B"  ],
      [ "a1", "b1" ],
      [ "a2", "b2" ]
    ],
    [
      "B", "A"
    ]
  )).toMatchObject([
    [ "b1", "b2" ],
    [ "a1", "a2" ]
  ]);

  // stringifying
  expect(wrapped(
    [
      [ "A"  ],
      [ "a1" ],
      [ 2    ]
    ],
    [
      "A"
    ]
  )).toMatchObject([
    [ "a1", "2" ]
  ]);
});
