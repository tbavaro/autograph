import * as D3 from "d3";
import * as D3Force from "d3-force";
import * as React from "react";

import "./SimulationViewport.css";

import { GraphDocument } from "../data/GraphDocument";
import { SimpleListenable } from "../data/Listenable";
import { MyLinkDatum, MyNodeDatum } from "../data/MyNodeDatum";
import { ListenableSimulationWrapper } from "../ListenableSimulation";

import * as GraphViewport from "./GraphViewport";
import { ListenerBinding, ListenerPureComponent } from "./ListenerPureComponent";

const INITIAL_LOAD_ALPHA = 0;

export interface Props {
  document: GraphDocument;
  simulationConfigListener: SimpleListenable;
  onChange?: () => void;
}

// TODO separate this out
class FPSView {
  private element?: HTMLDivElement;
  private ticksSinceUpdate: number;
  private lastUpdateTime: number;
  private intervalId?: number;

  constructor() {
    this.element = document.createElement("div");
    this.element.className = "SimulationViewport-FPSView";
    document.body.appendChild(this.element);
    this.ticksSinceUpdate = 0;
    this.lastUpdateTime = Date.now();
    this.intervalId = window.setInterval(this.update, 1000);
  }

  public destroy() {
    if (this.element) {
      if (this.element.parentElement) {
        this.element.parentElement.removeChild(this.element);
      }
      this.element = undefined;
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  public onTick() {
    this.ticksSinceUpdate += 1;
  }

  private update = () => {
    const now = Date.now();
    const diff = now - this.lastUpdateTime;
    const fps = this.ticksSinceUpdate / (diff / 1000);
    if (this.element) {
      this.element.innerText = Math.floor(fps) + "fps";
    }
    this.ticksSinceUpdate = 0;
    this.lastUpdateTime = now;
  }
}

function updateForces(simulation: D3.Simulation<any, any>, props: Props) {
  const forceSimulationConfig = props.document.layoutState.forceSimulationConfig;

  simulation
    .force(
      "x",
      D3Force.forceX().strength(forceSimulationConfig.originPullStrength)
    )
    .force(
      "y",
      D3Force.forceY().strength(forceSimulationConfig.originPullStrength)
    )
    .force(
      "charge",
      D3Force.forceManyBody()
        .strength(-1 * forceSimulationConfig.particleCharge)
        .distanceMax(forceSimulationConfig.chargeDistanceMax)
    )
    .force(
      "links",
      D3Force.forceLink(props.document.links)
        .distance(forceSimulationConfig.linkDistance)
    );

  const RADIAL_FORCE_NAME = "radial";
  if (forceSimulationConfig.radialRankStrength > 0.0001) {
    const radiusFunc = (n: MyNodeDatum) => n.rank === null ? 0 : n.rank * forceSimulationConfig.radialRankSeparation;
    const radialStrengthFunc = (n: MyNodeDatum) => n.rank === null ? 0 : forceSimulationConfig.radialRankStrength;
    simulation.force(RADIAL_FORCE_NAME, D3Force.forceRadial(radiusFunc).strength(radialStrengthFunc));
  } else {
    simulation.force(RADIAL_FORCE_NAME, null);
  }
}

type MySimulation = D3.Simulation<MyNodeDatum, MyLinkDatum>;

interface State {
  isPaused: boolean;
}

export class Component extends ListenerPureComponent<Props, State> {
  public state: State = {
    isPaused: false
  };

  public bindings: Array<ListenerBinding<Props>> = [
    {
      propertyName: "simulationConfigListener",
      eventType: "changed",
      callback: () => {
        updateForces(this.simulation, this.props);
        this.restartSimulation();
      }
    }
  ];

  public fpsView?: FPSView;

  public simulation: MySimulation = D3.forceSimulation<MyNodeDatum, MyLinkDatum>();
  public simulationWrapper = new ListenableSimulationWrapper(this.simulation);

  private graphViewportRef: GraphViewport.Component | null = null;

  public componentDidMount() {
    if (super.componentDidMount) {
      super.componentDidMount();
    }
    this.fpsView = new FPSView();
  }

  public componentWillMount() {
    super.componentWillMount();
    this.initializeSimulation(this.props.document);
    this.simulationWrapper.addListener("tick", this.onSimulationTick);
    updateForces(this.simulation, this.props);
    this.restartSimulation(INITIAL_LOAD_ALPHA);
  }

  public componentWillUnmount() {
    super.componentWillUnmount();
    this.simulation.stop();
    if (this.fpsView) {
      this.fpsView.destroy();
      this.fpsView = undefined;
    }
  }

  public componentWillReceiveProps(newProps: Props) {
    super.componentWillReceiveProps(newProps);
    if (this.props.document !== newProps.document) {
      this.initializeSimulation(newProps.document);
      updateForces(this.simulation, newProps);
      this.setState({ isPaused: false });
      this.restartSimulation(/*alpha=*/INITIAL_LOAD_ALPHA);
    }
  }

  public render() {
    return (
      <GraphViewport.Component
        ref={this.setGraphViewportRef}
        nodes={this.props.document.nodes}
        links={this.props.document.links}
        zoomState={this.props.document.zoomState}
        onChange={this.onChange}
      />
    );
  }

  private initializeSimulation = (document: GraphDocument) => {
    this.simulation.nodes(document.nodes);
  }

  private onChange = () => {
    this.restartSimulation();
    if (this.props.onChange) {
      this.props.onChange();
    }
  }

  private restartSimulation = (alpha?: number) => {
    this.simulation.alpha(alpha === undefined ? 1 : alpha);
    if (!this.state.isPaused) {
      this.simulation.restart();
    }
  }

  public repositionNodes() {
    this.restartSimulation(/*alpha=1*/);
  }

  private onSimulationTick = () => {
    if (this.fpsView) {
      this.fpsView.onTick();
    }
    if (this.graphViewportRef) {
      this.graphViewportRef.updatePositions();
    }
  }

  private setGraphViewportRef = (newRef: GraphViewport.Component | null) => {
    this.graphViewportRef = newRef;
  }

  public jumpToNode(node: MyNodeDatum) {
    if (this.graphViewportRef) {
      this.graphViewportRef.jumpToNode(node);
    }
  }

  public setIsPaused(newValue: boolean) {
    if (this.state.isPaused !== newValue) {
      if (newValue) {
        this.simulation.stop();
      } else {
        this.simulation.restart();
      }
      this.setState({ isPaused: newValue });
    }
  }
}
