import {Component} from 'react';
import {contextTypes} from './SizeWatcherTypes';

export default class SizeWatcherProvider extends Component {
  static childContextTypes = contextTypes;

  constructor(props, context) {
    super(props, context);

    this.checkInChildContainer = this.checkInChildContainer.bind(this);
    this.checkOutChildContainer = this.checkOutChildContainer.bind(this);

    this.childContext = {
      sizeWatcher: {
        checkIn: this.checkInChildContainer,
        checkOut: this.checkOutChildContainer,
      },
    };

    // Map: {[<DomElement>]: {instance, dom: <DomElement>}}
    this.childrenContainers = new Map();
  }

  getChildContext() {
    return this.childContext;
  }

  componentDidMount() {
    // Create resizeObservable that handles all children containers size change
    // One for all: https://groups.google.com/a/chromium.org/forum/#!msg/blink-dev/z6ienONUb5A/F5-VcUZtBAAJ
    this.resizeObservable = new ResizeObserver(entries => {
      for (const {target, contentRect} of entries) {
        const container = this.childrenContainers.get(target);

        if (container) {
          container.instance.updateSize({width: contentRect.width, height: contentRect.height});
        }
      }
    });

    // Observe each checkedIn element in a loop.
    // Observer callback will be called once on the next requestAnimationFrame with all elements in `entries` array
    this.childrenContainers.forEach(({dom}) => {
      this.resizeObservable.observe(dom);
    });
  }

  checkInChildContainer(instance, dom) {
    this.childrenContainers.set(dom, {instance, dom});

    if (this.resizeObservable) {
      this.resizeObservable.observe(dom);
    }
  }

  checkOutChildContainer(dom) {
    this.childrenContainers.delete(dom);
  }

  render() {
    return this.props.children;
  }
}
