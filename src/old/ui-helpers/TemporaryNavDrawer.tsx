import * as React from "react";
import mdc from "./mdchack";
import "./TemporaryNavDrawer.css";

export interface Props {
  isOpen: boolean;
  headerChildren?: any;
  onClosed?: () => void;
}

export class TemporaryNavDrawer extends React.Component<Props, object> {
  private ref?: HTMLDivElement;
  private mdcRef?: any;

  public componentDidMount() {
    if (!this.ref) {
      throw new Error("ref not set");
    }

    this.mdcRef = mdc.drawer.MDCTemporaryDrawer.attachTo(this.ref);
    this.mdcRef.open = this.props.isOpen;
    this.mdcRef.listen("MDCTemporaryDrawer:close", () => {
      if (this.props.onClosed) {
        this.props.onClosed();
      }
    });
  }

  public componentWillReceiveProps(newProps: Props) {
    if (this.mdcRef) {
      this.mdcRef.open = newProps.isOpen;
    }
  }

  public render() {
    return (
      <aside className="mdc-drawer mdc-drawer--temporary mdc-typography" ref={this.setRef}>
        <nav className="mdc-drawer__drawer">
          <header className="TemporaryNavDrawer-header mdc-drawer__toolbar-spacer">
            {this.props.headerChildren}
          </header>
          <nav id="icon-with-text-demo" className="mdc-drawer__content mdc-list">
            {this.props.children}
          </nav>
        </nav>
      </aside>
    );
  }

  private setRef = (newRef: HTMLDivElement) => {
    this.ref = newRef;
  }
}

export default TemporaryNavDrawer;