import * as QueryString from "query-string";
import * as React from "react";

import App from "./App";

class QueryParamHelper {
  private readonly values: QueryString.ParsedQuery;

  constructor(queryString: string) {
    this.values = QueryString.parse(queryString);
  }

  public extractString(key: string): string | undefined {
    const value = this.values[key];
    if (value instanceof Array && value.length >= 1) {
      return value[0];
    } else if (typeof value === "string") {
      return value;
    } else {
      return undefined;
    }
  }

  // "" => false
  // "&foo" => true
  // "&foo=1" => true
  // "&foo=0" => false
  public extractBoolean(key: string): boolean {
    const value = this.values[key];
    return (value !== undefined && value !== "0");
  }
}

function parseQueryParams(queryString: string) {
  const q = new QueryParamHelper(queryString);
  return {
    doc: q.extractString("doc"),
    embedded: q.extractBoolean("embedded")
  };
}

interface State {
  queryParams: ReturnType<typeof parseQueryParams>;
}

export default class Root extends React.Component<{}, {}> {
  public state: State = {
    queryParams: parseQueryParams(location.search)
  };

  public render() {
    const { queryParams } = this.state;

    if (queryParams.embedded) {
      return (
        "embedded mode is not yet supported"
      );
    }

    return (
      <App
        initialDocumentId={queryParams.doc || null}
      />
    );
  }
}
