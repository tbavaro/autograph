import * as classNames from "classnames";
import * as D3 from "d3";
import * as React from "react";

import "./NodeView.css";

export interface NodeActionManager {
  onNodeMoved: (id: number, x: number, y: number, stopped: boolean) => void;
  toggleIsLocked: (id: number) => void;
}

type SharedProps = {
  label: string;
  secondaryLabel: string | null;
  url: string | null;
  color?: string;
  isLocked: boolean;
  isSelected: boolean;
};

export type InnerProps = SharedProps & {
  onDoubleClick?: () => void;
  extraStyle?: React.CSSProperties;
};

type Props = SharedProps & {
  actionManager?: NodeActionManager;
  id: number;
  initialX: number;
  initialY: number;
  dragBehavior?: D3.DragBehavior<any, number, any>;
  onClick: (index: number, metaKey: boolean) => void;
};

function stopPropagation(e: any) {
  e.stopPropagation();
}

export class InnerComponent extends React.Component<InnerProps, {}> {
  public render() {
    const primaryLabelElement = (
      this.props.url === null
        ? this.props.label
        : (
            <a href={this.props.url} target="#" onClick={stopPropagation}>
              {this.props.label}
            </a>
          )
    );
    const contentStyle = {
      backgroundColor: this.props.isSelected ? undefined : this.props.color,
      ...this.props.extraStyle
    };
    return (
      <div
        style={contentStyle}
        className={classNames(
          "NodeView-content",
          {
            "locked": this.props.isLocked,
            "selected": this.props.isSelected
          }
        )}
        onDoubleClick={this.props.onDoubleClick}
      >
        {
          this.props.secondaryLabel === null
            ? primaryLabelElement
            : (
              <React.Fragment>
                {primaryLabelElement}
                <h6>{this.props.secondaryLabel}</h6>
              </React.Fragment>
            )
        }
      </div>
    );
  }
}

export class Component extends React.PureComponent<Props, {}> {
  public ref?: HTMLDivElement;

  // not using State because we explicitly don't want to re-render
  private x: number = this.props.initialX;
  private y: number = this.props.initialY;

  public componentDidMount() {
    if (super.componentDidMount) {
      super.componentDidMount();
    }

    if (!this.ref) {
      throw new Error("ref not set");
    }

    const sel = D3.select(this.ref);
    sel.datum(this.props.id);

    if (this.props.dragBehavior) {
      sel.call(this.props.dragBehavior);
    }
  }

  public componentWillReceiveProps(newProps: Readonly<Props>, nextContext: any) {
    // clear old drag behavior if it's changing
    if (this.ref && this.props.dragBehavior !== newProps.dragBehavior) {
      D3.select(this.ref).on(".drag", null);
    }

    if (newProps.initialX !== this.props.initialX || newProps.initialY !== this.props.initialY) {
      this.setPosition(newProps.initialX, newProps.initialY);
    }

    if (super.componentWillReceiveProps) {
      super.componentWillReceiveProps(newProps, nextContext);
    }
  }

  public render() {
    const style = { transform: "" };
    this.updateStyleForPosition(style);
    const innerComponent = React.createElement(InnerComponent, {
      ...this.props as InnerProps,
      onDoubleClick: this.onDoubleClick
    });
    return (
      <div
        ref={this.setRef}
        className={"NodeView"}
        onClick={this.onClick}
        style={style}
      >
        {innerComponent}
      </div>
    );
  }

  private setRef = (newRef: HTMLDivElement) => {
    this.ref = newRef;
  }

  private onClick = (event: React.MouseEvent<any>) => {
    this.props.onClick(this.props.id, event.metaKey);
  }

  private onDoubleClick = () => {
    if (this.props.actionManager) {
      this.props.actionManager.toggleIsLocked(this.props.id);
    }
  }

  private updateStyleForPosition(style: React.CSSProperties | CSSStyleDeclaration) {
    // style.left = `${this.x}px`;
    // style.top = `${this.y}px`;
    style.transform = `translate(${this.x}px, ${this.y}px)`;
  }

  public setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
    if (this.ref) {
      this.updateStyleForPosition(this.ref.style);
    }
  }
}
