import {Component, createContext, createElement} from 'react';

export const SizeWatcherContext = createContext(null);

export default class SizeWatcherProvider extends Component {
  constructor(props, context) {
    super(props, context);

    this.contextObj = {
      checkIn: this.checkInChildContainer.bind(this),
      checkOut: this.checkOutChildContainer.bind(this),
    };

    // Map: {[<DomElement>]: {instance, dom: <DomElement>}}
    this.childrenContainers = new Map();
  }

  componentDidMount() {
    // Create resizeObservable that handles all children containers size change
    // One for all: https://groups.google.com/a/chromium.org/forum/#!msg/blink-dev/z6ienONUb5A/F5-VcUZtBAAJ
    this.resizeObservable = new ResizeObserver(entries => {
      for (const {target} of entries) {
        if (this.childrenContainers.has(target)) {
          // Take offsetWidth/Height instead of entry.contentRect,
          // to match width/height (if not changed) taken on SizeWatcher mount, to avoid calling findBreakpoint method there,
          // since offsetWidth/Height return rounded values whereas contentRect returns fractions
          const width = target.offsetWidth;
          const height = target.offsetHeight;

          this.childrenContainers.get(target).handleSize({width, height});
        }
      }
    });

    // Observe each checkedIn element in a loop.
    // Observer callback will be called once on the next requestAnimationFrame with all elements in `entries` array
    this.childrenContainers.forEach(({dom}) => {
      this.resizeObservable.observe(dom);
    });
  }

  checkInChildContainer(dom, handleSize) {
    this.childrenContainers.set(dom, {handleSize, dom});
    this.resizeObservable?.observe(dom);
  }

  checkOutChildContainer(dom) {
    this.childrenContainers.delete(dom);
    this.resizeObservable?.unobserve(dom);
  }

  render() {
    return createElement(
      SizeWatcherContext.Provider,
      {value: this.contextObj},
      this.props.children,
    );
  }
}
