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

type MyQueryParams = ReturnType<typeof parseQueryParams>;

const renderRoot: React.FunctionComponent<{}> = () => {
  const queryParams = parseQueryParams(location.search);
  if (queryParams.embedded) {
    return (<EmbeddedAppRoot/>);
  } else {
    return renderNormalApp(queryParams);
  }
};

function renderNormalApp(queryParams: MyQueryParams) {
  return (
    <App
      initialDocumentId={queryParams.doc || null}
    />
  );
}

interface State {
  appData?: string;
  showWaitingMessageIfWaiting: boolean;
}

class EmbeddedAppRoot extends React.Component<{}, State> {
  public state: State = {
    showWaitingMessageIfWaiting: false
  };

  public componentWillMount() {
    if (super.componentWillMount) {
      super.componentWillMount();
    }

    window.addEventListener("message", (event: MessageEvent) => {
      this.setState({ 
        appData: event.data
      });
    });

    setTimeout(() => {
      this.setState({
        showWaitingMessageIfWaiting: true
      });
    }, 1000);
  }

  public render() {
    if (this.state.appData === undefined) {
      return (this.state.showWaitingMessageIfWaiting ? "waiting for data..." : "");
    } else {
      return (
        <div>
          got data
          <pre>
            {this.state.appData}
          </pre>
        </div>
      );
    }
  }
}

export default renderRoot;
