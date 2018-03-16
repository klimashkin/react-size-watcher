import PropTypes from 'prop-types';
import {Component, createElement} from 'react';
import {contextTypes} from './SizeWatcherTypes';

const defaultBreakpoint = {props: {}, minWidth: 0, maxWidth: Infinity, minHeight: 0, maxHeight: Infinity};

export default class SizeWatcher extends Component {
  static contextTypes = contextTypes;

  static propTypes = {
    // Array of breakpoints
    breakpoints: PropTypes.arrayOf(PropTypes.shape({
      // Dimensions if breakpoint
      minWidth: PropTypes.number,
      maxWidth: PropTypes.number,
      minHeight: PropTypes.number,
      maxHeight: PropTypes.number,
      // Props that are mixed into container props
      props: PropTypes.object,
      // Property that contains any custom data useful in child render function
      data: PropTypes.any,
    })).isRequired,

    // Breakpoint match strategy
    // 'order' (default)  - match by breakpoints order, like in css @media-queries, when the last match wins
    // 'breakpointArea'   - match by breakpoints area, when the smallest area is considered to be more specific
    // 'intersectionArea' - match by area of breakpoint/size intersection,
    //                      when the biggest intersection area is considered to be more specific
    matchBy: PropTypes.oneOf(['order', 'breakpointArea', 'intersectionArea']),

    // By default only container will be rendered on first render() call (because usually it's a block element)
    // to compute its width and decide what breakpoint pass down to render function.
    // But if container is a part of flex, or grow according to its content, or breakpoint depend on height,
    // content should be rendered with visibility:hidden before breakpoint computation.
    renderContentOnInit: PropTypes.bool, // By default - false
    // If renderContentOnInit is true, pass this flag to show content on first render before computation
    showOnInit: PropTypes.bool, // By default - false

    // Container can mimic any html element ('div', 'h2' etc) or custom component (constructors like Link, Button etc)
    type: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),

    // Render function, that is called on breakpoint change
    children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,

    // Optional callback on each size change
    onSizeChange: PropTypes.func,
  };

  static defaultProps = {
    renderContentOnInit: false,
    showOnInit: false,
    matchBy: 'order',
    type: 'div',
  };

  constructor(props, context) {
    super(props, context);

    this.processBreakpoints(props.breakpoints);
    this.state = {
      breakpoint: props.renderContentOnInit ? this.findBreakpoint() : null,
    };

    this.saveRef = this.saveRef.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const {props} = this;

    if (nextProps.breakpoints !== props.breakpoints || nextProps.matchBy !== props.matchBy) {
      this.processBreakpoints(nextProps.breakpoints);

      const breakpoint = this.findBreakpoint(this.size);

      if (breakpoint !== this.state.breakpoint) {
        this.setState({breakpoint});
      }
    }
  }

  componentWillUnmount() {
    this.checkOut();
  }

  saveRef(dom) {
    if (dom) {
      // If type props contains custom react components, ref returns instance of that component
      // Try taking dom by calling method getWrappedInstance on it
      while (typeof dom.getWrappedInstance === 'function') {
        dom = dom.getWrappedInstance();
      }

      this.checkIn(dom);
    } else {
      this.checkOut();
    }
  }

  checkIn(dom) {
    this.dom = dom;
    this.context.sizeWatcher.checkIn(this, dom);
  }

  checkOut() {
    if (this.dom) {
      this.context.sizeWatcher.checkOut(this.dom);
      this.dom = null;
    }
  }

  updateSize(size) {
    if (this.size === undefined || size.width !== this.size.width || size.height !== this.size.height) {
      const breakpointNeedCheck =
        this.size === undefined ||
        this.sensitiveToWidth && size.width !== this.size.width ||
        this.sensitiveToHeight && size.height !== this.size.height;

      const currentBreakpoint = this.state.breakpoint;
      const newBreakpoint = breakpointNeedCheck ? this.findBreakpoint(size) : currentBreakpoint;

      this.size = size;

      if (typeof this.props.onSizeChange === 'function') {
        this.props.onSizeChange(size, currentBreakpoint, newBreakpoint);
      }

      if (newBreakpoint !== currentBreakpoint) {
        this.setState({breakpoint: newBreakpoint});
      }
    }
  }

  processBreakpoints(breakpoints) {
    this.sensitiveToWidth = false;
    this.sensitiveToHeight = false;
    this.breakpoints = breakpoints;

    for (const {minWidth, maxWidth, minHeight, maxHeight} of breakpoints) {
      // Validate maxWidth/minWidth in development
      const maxWidthType = typeof maxWidth;
      const minWidthType = typeof minWidth;
      const maxHeightType = typeof maxHeight;
      const minHeightType = typeof minHeight;

      if (maxWidthType !== 'undefined' && (maxWidthType !== 'number' || maxWidth < 0) ||
          minWidthType !== 'undefined' && (minWidthType !== 'number' || minWidth < 0 || maxWidth && minWidth > maxWidth)) {
        throw Error(`Wrong min ${JSON.stringify(minWidth)} or max ${JSON.stringify(maxWidth)} width in breakpoint`);
      }

      if (maxHeightType !== 'undefined' && (maxHeightType !== 'number' || maxHeight < 0) ||
          minHeightType !== 'undefined' && (minHeightType !== 'number' || minHeight < 0 || maxHeight && minHeight > maxHeight)) {
        throw Error(`Wrong min ${JSON.stringify(minHeight)} or max ${JSON.stringify(maxHeight)} height in breakpoint`);
      }

      if (!this.sensitiveToWidth && (minWidth || maxWidth)) {
        this.sensitiveToWidth = true;
      }

      if (!this.sensitiveToHeight && (minHeight || maxHeight)) {
        this.sensitiveToHeight = true;
      }
    }

    if (this.props.matchBy === 'order') {
      this.findBreakpoint = this.findBreakpointByOrder;
    } else if (this.props.matchBy === 'breakpointArea') {
      this.findBreakpoint = this.findBreakpointByArea;
    } else if (this.props.matchBy === 'intersectionArea') {
      this.findBreakpoint = this.findBreakpointByIntersection;
    }
  }

  // Find the last breakpoint that matches given size
  findBreakpointByOrder({width = Infinity, height = Infinity} = {}) {
    for (let i = this.breakpoints.length; i--;) {
      const breakpoint = this.breakpoints[i];
      const {minWidth = 0, maxWidth = Infinity, minHeight = 0, maxHeight = Infinity} = breakpoint;

      if (width >= minWidth && width <= maxWidth && height >= minHeight && height <= maxHeight) {
        return breakpoint;
      }
    }

    return defaultBreakpoint;
  }

  // Find breakpoint with the smallest area
  findBreakpointByArea({width = 1e6, height = 1e6} = {}) {
    return this.breakpoints.reduce((result, breakpoint) => {
      const {minWidth = 0, maxWidth = 1e6, minHeight = 0, maxHeight = 1e6} = breakpoint;

      if (width >= minWidth && width <= maxWidth && height >= minHeight && height <= maxHeight) {
        const area = (maxWidth - minWidth) * (maxHeight - minHeight);

        if (area <= result.area) {
          result.area = area;
          result.breakpoint = breakpoint;
        }
      }

      return result;
    }, {area: Infinity, breakpoint: defaultBreakpoint}).breakpoint;
  }

  // Find breakpoint with the biggest breakpoint/size intersection area
  findBreakpointByIntersection({width = 1e6, height = 1e6} = {}) {
    return this.breakpoints.reduce((result, breakpoint) => {
      const {minWidth = 0, maxWidth = 1e6, minHeight = 0, maxHeight = 1e6} = breakpoint;
      const area = Math.max(0, Math.min(maxWidth, width) - minWidth) * Math.max(0, Math.min(maxHeight, height) - minHeight);

      if (area >= result.area) {
        result.area = area;
        result.breakpoint = breakpoint;
      }

      return result;
    }, {area: 0, breakpoint: defaultBreakpoint}).breakpoint;
  }

  render() {
    const {
      props: {
        type, breakpoints, matchBy, renderContentOnInit, showOnInit, children, onSizeChange,
        ...elementProps
      },
      state: {breakpoint},
    } = this;

    let renderedChildren;

    if (breakpoint !== null) {
      renderedChildren = typeof children === 'function' ? children(breakpoint, this.size) : children;

      Object.assign(elementProps, breakpoint.props);

      if (this.size === undefined && !showOnInit) {
        elementProps.style = {...elementProps.style, visibility: 'hidden'};
      }
    }

    elementProps.ref = this.saveRef;

    return createElement(type, elementProps, renderedChildren);
  }
}
