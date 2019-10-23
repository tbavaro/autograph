import * as QueryString from "query-string";
import * as React from "react";

import App from "./App";
import * as SharedDataHelpers from "./data/SharedDataHelpers";
import { LoadedData } from "./data/SharedTypes";

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
  return <App
    initialDocumentId={queryParams.doc}
    isEmbedded={false}
  />;
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

    const onMessageEvent = (event: MessageEvent) => {
      window.removeEventListener("message", onMessageEvent);
      this.setState({ 
        appData: event.data
      });
    };

    window.addEventListener("message", onMessageEvent);

    setTimeout(() => {
      if (this.state.appData === undefined) {
        this.setState({
          showWaitingMessageIfWaiting: true
        });
      }
    }, 1000);
  }

  public render() {
    if (this.state.appData === undefined) {
      return this.renderWaitingState();
    } else {
      let data: LoadedData;
      try {
        data = SharedDataHelpers.parseLoadedData(this.state.appData);
      } catch (e) {
        console.error("error loading data", e);
        return this.renderErrorState();
      }
      return this.renderLoadedState(data);
    }
  }

  private renderWaitingState() {
    return (this.state.showWaitingMessageIfWaiting ? "waiting for data..." : "");
  }

  private renderErrorState() {
    return "error loading data (see console)";
  }

  private renderLoadedState(data: LoadedData) {
    const setAppRef = (appRef: App | null) => {
      if (appRef !== null) {
        appRef.setEmbeddedDocument(SharedDataHelpers.documentFromLoadedData(data));
      }
    };

    return (
      <App 
        isEmbedded={true}
        ref={setAppRef}
      />
    );

    //   <div style={{ position: "absolute", overflow: "scroll", maxHeight: "100%", width: "100%" }}>
    //     got data
    //     <pre>
    //       data loaded
    //       {JSON.stringify(data, null, 2)}
    //     </pre>
    //   </div>
    // );
  }
}

export default renderRoot;
