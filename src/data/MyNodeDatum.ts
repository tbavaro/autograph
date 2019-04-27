import * as d3 from "d3-force";
import * as GraphData from "./GraphData";

// "x" any "y" are handled differently between GraphData and d3
type FilteredRequiredNode = {
  [k in Exclude<keyof GraphData.Node, "x" | "y">] : GraphData.Node[k]
};

export interface MyNodeDatum extends d3.SimulationNodeDatum, FilteredRequiredNode {}

export function nodeDatumFromGraphNode(sn: GraphData.Node): MyNodeDatum {
  const datum: MyNodeDatum = {
    ...sn,
    x: sn.x === null ? undefined : sn.x,
    y: sn.y === null ? undefined : sn.y
  };
  if (sn.isLocked) {
    datum.fx = datum.x;
    datum.fy = datum.y;
  }
  return datum;
}

export type MyLinkDatum = d3.SimulationLinkDatum<MyNodeDatum> & {
  // force these to always be with the MyNodeDatum and not the optional string/number
  source: MyNodeDatum;
  target: MyNodeDatum;
  stroke: GraphData.LinkStroke;
};
