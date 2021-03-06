export type ListenerCallback<EventType> = (eventType: EventType) => void;

export interface Listenable<EventType> {
  addListener: (eventType: EventType, func: ListenerCallback<EventType>) => void;
  removeListener: (eventType: EventType, func: ListenerCallback<EventType>) => boolean;
  triggerListeners: (eventType: EventType) => void;
}

export class BasicListenable<EventType> implements Listenable<EventType> {
  private _listeners: Map<EventType, Set<ListenerCallback<EventType>>> = new Map();

  public addListener(eventType: EventType, func: ListenerCallback<EventType>) {
    let listenersForEventType = this._listeners.get(eventType);
    if (listenersForEventType === undefined) {
      listenersForEventType = new Set();
      this._listeners.set(eventType, listenersForEventType);
    }
    listenersForEventType.add(func);
  }

  public removeListener(eventType: EventType, func: ListenerCallback<EventType>) {
    const listenersForEventType = this._listeners.get(eventType);
    if (listenersForEventType !== undefined) {
      return listenersForEventType.delete(func);
    } else {
      return false;
    }
  }

  public triggerListeners(eventType: EventType) {
    const listenersForEventType = this._listeners.get(eventType);
    if (listenersForEventType !== undefined) {
      listenersForEventType.forEach((func) => func(eventType));
    }
  }
}

export class SimpleListenable extends BasicListenable<"changed"> {
  public triggerListeners() {
    super.triggerListeners("changed");
  }
}
