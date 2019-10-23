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

export function documentFromLoadedData(data: LoadedData): GraphDocument {
  return new GraphDocument({
    name: "embedded data",
    data: GraphData.load({
      version: 1,
      nodes: [],
      links: []
    })
  })
}