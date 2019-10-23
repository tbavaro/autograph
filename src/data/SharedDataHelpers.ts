import { valueIfUndefined } from "../util/Utils";
import * as GraphData from "./GraphData";
import { GraphDocument } from "./GraphDocument";
import { LoadedData, LoadedDataAny } from "./SharedTypes";

// parses the JSON received from sheets addon and upgrades it to the latest format
export function parseLoadedData(json: string): LoadedData {
  const data: LoadedDataAny = JSON.parse(json);
  const version = (typeof data === "object" ? data.version : undefined);
  switch (version) {
    case 1:
      return data;

    default:
        console.error("received data json", json);
        throw new Error("invalid data json");
  }
}

function mapNodes(ds: LoadedData["nodes"], nodeIdsAccum: Set<string>, errors: string[]) {
  const results: GraphData.SerializedNodeV1[] = [];
  ds.forEach(d => {
    if (d.id !== undefined && d.id !== "") {
      if (nodeIdsAccum.has(d.id)) {
        errors.push(`duplicate node id: "${d.id}"`);
      } else {
        nodeIdsAccum.add(d.id);
        results.push({
          id: d.id,
          label: valueIfUndefined(d.label, d.id),
          secondaryLabel: d.secondaryLabel,
          url: d.url,
          color: d.color,
          rank: d.rank
        });
      }
    }
  });
  return results;
}

function constrainValues<T>(value: any, allowedValues: T[]): T | undefined {
  if (allowedValues.includes(value)) {
    return value;
  } else {
    return undefined;
  }
}

function mapLinks(ds: LoadedData["links"], validNodeIds: Set<string>, errors: string[]) {
  const results: GraphData.SerializedLinkV1[] = [];
  ds.forEach(d => {
    if (d.source === undefined || d.target === undefined) {
      return;
    }

    if (!validNodeIds.has(d.source)) {
      errors.push(`link references unknown node id: "${d.source}"`);
      return;
    }

    if (!validNodeIds.has(d.target)) {
      errors.push(`link references unknown node id: "${d.target}"`);
      return;
    }

    results.push({
      source: d.source,
      target: d.target,
      stroke: constrainValues(d.stroke, ["solid", "dashed"])
    });
  });
  return results;
}

export function documentFromLoadedData(data: LoadedData): GraphDocument {
  const errors: string[] = [];

  const nodeIds = new Set<string>();
  const nodes = mapNodes(data.nodes, nodeIds, errors);

  const serializedGraphData: GraphData.SerializedDocument = {
    version: 1,
    nodes,
    links: mapLinks(data.links, nodeIds, errors)
  };

  if (errors.length > 0) {
    alert(`there were ${errors.length} errors:\n${errors.join("\n")}`);
  }

  return new GraphDocument({
    name: "embedded data",
    data: GraphData.load(serializedGraphData)
  });
}
