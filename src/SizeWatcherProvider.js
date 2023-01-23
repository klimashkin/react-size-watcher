import PropTypes from 'prop-types';
import {Component, createContext, createElement} from 'react';

export const SizeWatcherContext = createContext(null);

export default class SizeWatcherProvider extends Component {
  static propTypes = {
    // Whether observer updates are synchronous or asynchronously debounced through requestAnimationFrame
    // Asynchronous by default
    sync: PropTypes.bool
  }

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
    const {sync} = this.props;
    // Create resizeObservable that handles all children containers size change
    // One for all: https://groups.google.com/a/chromium.org/forum/#!msg/blink-dev/z6ienONUb5A/F5-VcUZtBAAJ
    this.resizeObservable = new ResizeObserver(entries => {
      const handler = () => {
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
      };

      if (sync) {
        handler();
      } else {
        // Call the handler asynchronously to prevent "ResizeObserver loop limit exceeded" error
        if (this.raf) {
          window.cancelAnimationFrame(this.raf);
        }

        this.raf = window.requestAnimationFrame(handler);
      }
    });

    // Observe each checkedIn element in a loop.
    // Observer callback will be called once on the next requestAnimationFrame with all elements in `entries` array
    this.childrenContainers.forEach(({dom}) => {
      this.resizeObservable.observe(dom);
    });
  }

  componentWillUnmount() {
    if (this.raf) {
      window.cancelAnimationFrame(this.raf);
    }
    this.resizeObservable?.disconnect();
    this.childrenContainers.clear();
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
