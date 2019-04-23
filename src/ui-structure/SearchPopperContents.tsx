import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";

import * as React from "react";

import { GraphDocument } from "../data/GraphDocument";
import { MyNodeDatum } from "../data/MyNodeDatum";

import "./SearchPopperContents.css";

export interface Actions {
  jumpToNode: (node: MyNodeDatum) => void;
}

interface Props {
  actions: Actions;
  query: string;
  document: GraphDocument;
  setFirstSearchResult?: (firstResult: MyNodeDatum | null) => void;
}

interface State {
  maxHeightPx: number;
  latestAnsweredQuery: string | null;
  latestAnsweredResults: MyNodeDatum[];
}

const elementHelper = document.createElement("div");

// hack until i remove html labels
function cleanLabel(label: string) {
  let headersRemoved = label.replace(/\<[^\>]*\>/g, "\t").trim().replace(/\t+/g, " / ");

  // fix html entities
  if (/&/.exec(headersRemoved)) {
    elementHelper.innerHTML = headersRemoved;
    headersRemoved = elementHelper.innerText;
  }

  return headersRemoved;
}

class SearchPopperContents extends React.PureComponent<Props, State> {
  public state: State = {
    maxHeightPx: 100,
    latestAnsweredQuery: null,
    latestAnsweredResults: []
  };

  public componentWillMount() {
    if (super.componentWillMount) {
      super.componentWillMount();
    }

    window.addEventListener("resize", this.updateMaxHeight);
    this.updateMaxHeight();
  }

  public componentWillUnmount() {
    if (super.componentWillUnmount) {
      super.componentWillUnmount();
    }

    window.removeEventListener("resize", this.updateMaxHeight);
  }

  public render() {
    // TODO avoid having side-effects within render
    let isLoading = false;
    if (this.state.latestAnsweredQuery !== this.props.query) {
      this.rescheduleSearchWorker();
      isLoading = true;
    }

    const results = this.state.latestAnsweredResults;

    if (this.props.setFirstSearchResult) {
      this.props.setFirstSearchResult(results.length === 0 ? null : results[0]);
    }

    return (
      <List
        component="nav"
        className="SearchPopperContents"
        dense={true}
        style={{ maxHeight: `${this.state.maxHeightPx}px` }}
      >
        {
          results.length === 0
            ? this.renderEmptyState()
            : this.renderResults(results, isLoading)
        }
      </List>
    );
  }

  private renderEmptyState() {
    return "No results";
  }

  private renderResults(results: MyNodeDatum[], isLoading: boolean) {
    const limitedResults = results.slice(0, 50);

    return limitedResults.map(result => (
      <MyResultListItem key={result.id} node={result} jumpToNode={this.props.actions.jumpToNode} disabled={isLoading}/>
    ));
  }

  private updateMaxHeight = () => {
    this.setState({ maxHeightPx: Math.floor((window.innerHeight - 48) * 0.8) });
  }

  private pendingSearchTimeoutId: NodeJS.Timeout | null = null;
  private rescheduleSearchWorker = () => {
    if (this.pendingSearchTimeoutId !== null) {
      clearTimeout(this.pendingSearchTimeoutId);
      this.pendingSearchTimeoutId = null;
    }
    this.pendingSearchTimeoutId = setTimeout(this.doSearchWork, 10);
  }
  private doSearchWork = () => {
    const query = this.props.query;
    console.log("query", query);
    const document = this.props.document;
    const results = document.nodeSearchHelper.search(query);
    this.setState({
      latestAnsweredQuery: query,
      latestAnsweredResults: results
    });
  }
}

interface MyResultListItemProps {
  node: MyNodeDatum;
  jumpToNode: (node: MyNodeDatum) => void;
  disabled?: boolean;
};

class MyResultListItem extends React.PureComponent<MyResultListItemProps, {}> {
  private handleClick = () => {
    this.props.jumpToNode(this.props.node);
  }

  public render() {
    const { node } = this.props;
    return (
      <ListItem button={true} onClick={this.handleClick} disabled={this.props.disabled}>
        <ListItemText primary={cleanLabel(node.label)}/>
      </ListItem>
    );
  }
}

export default SearchPopperContents;
