import PropTypes from 'prop-types';
import {createElement, forwardRef, useCallback, useContext, useEffect, useReducer, useRef} from 'react';
import SizeWatcherProvider, {SizeWatcherContext} from './SizeWatcherProvider';

export default forwardRef(SizeWatcher);
export {SizeWatcherProvider};

SizeWatcher.propTypes /* remove-proptypes */ = {
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

  // By default only container will be rendered on the first render() (because usually it's a block element)
  // to compute its width and find a breakpoint to pass it pass down to the following render call.
  // But if container is a part of flex, or grows according to its content, or breakpoint depends on height,
  // content should be rendered immediately before the first breakpoint computation.
  renderContentOnInit: PropTypes.bool, // By default - false

  // Container can mimic any html element ('div', 'h2' etc) or custom component (constructors like Link, Button etc)
  type: PropTypes.oneOfType([PropTypes.string, PropTypes.object, PropTypes.func]),

  // Children nodes or a render function which is called on breakpoint change
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,

  // By default children are rerendered only on breakpoint change.
  // This is an optional callback that is called on each size change
  onSizeChange: PropTypes.func,
};

function SizeWatcher(props, ref) {
  const {
    type = 'div', matchBy = 'order', renderContentOnInit = false,
    breakpoints, onSizeChange, children,
    ...elementProps
  } = props;

  const [, forceUpdate] = useReducer(x => x + 1, 0);
  const context = useContext(SizeWatcherContext);
  const sizeRef = useRef(null);
  const propsRef = useRef(null);
  const stateRef = useRef(null);

  if (propsRef.current === null || breakpoints !== propsRef.current.breakpoints || matchBy !== propsRef.current.matchBy) {
    let sensitiveToWidth = false;
    let sensitiveToHeight = false;
    let findBreakpoint;

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

      if (!sensitiveToWidth && (minWidth || maxWidth)) {
        sensitiveToWidth = true;
      }

      if (!sensitiveToHeight && (minHeight || maxHeight)) {
        sensitiveToHeight = true;
      }
    }

    if (matchBy === 'order') {
      findBreakpoint = findBreakpointByOrder;
    } else if (matchBy === 'breakpointArea') {
      findBreakpoint = findBreakpointByArea;
    } else if (matchBy === 'intersectionArea') {
      findBreakpoint = findBreakpointByIntersection;
    }

    propsRef.current = {breakpoints, matchBy};
    stateRef.current = {
      findBreakpoint,
      sensitiveToWidth, sensitiveToHeight,
      breakpoint: !stateRef.current && !renderContentOnInit ? null : findBreakpoint(breakpoints, sizeRef.current),
    };
  }

  const domRef = useRef(null);
  const saveRef = useCallback(node => {
    domRef.current = node;

    if (typeof ref === 'function') {
      ref(node);
    } else if (typeof ref === 'object' && ref !== null) {
      ref.current = node;
    }
  }, [ref]);

  useEffect(() => {
    const $dom = domRef.current;

    // Find the size of the container right after the first render (componentDidMount), find the right breakpoint and rerender
    if (sizeRef.current === null) {
      const {width, height} = $dom.getBoundingClientRect();
      const {breakpoint, findBreakpoint} = stateRef.current;
      const newSize = {width, height};
      const newBreakpoint = findBreakpoint(breakpoints, newSize);

      sizeRef.current = newSize;

      if (typeof onSizeChange === 'function') {
        onSizeChange(newSize, breakpoint, newBreakpoint);
      }

      // If breakpoint was null or the found one is different
      // from the one that was found during the first render (if renderContentOnInit was true),
      // then rerender with the new breakpoint and exit, expecting context.checkIn after rerender
      if (newBreakpoint !== breakpoint) {
        stateRef.current = {...stateRef.current, breakpoint: newBreakpoint};

        return forceUpdate();
      }
    }

    context.checkIn($dom, newSize => {
      if (newSize.width !== sizeRef.current.width || newSize.height !== sizeRef.current.height) {
        const {breakpoint, findBreakpoint, sensitiveToWidth, sensitiveToHeight} = stateRef.current;
        const breakpointNeedCheck =
          sizeRef.current === null ||
          sensitiveToWidth && newSize.width !== sizeRef.current.width ||
          sensitiveToHeight && newSize.height !== sizeRef.current.height;
        const newBreakpoint = breakpointNeedCheck ? findBreakpoint(breakpoints, newSize) : breakpoint;

        sizeRef.current = newSize;

        if (typeof onSizeChange === 'function') {
          onSizeChange(newSize, breakpoint, newBreakpoint);
        }

        if (newBreakpoint !== breakpoint) {
          stateRef.current = {...stateRef.current, breakpoint: newBreakpoint};
          forceUpdate();
        }
      }
    });

    return () => {
      context.checkOut($dom);
    };
  }, [context, domRef.current, stateRef.current, type, breakpoints, matchBy, onSizeChange]); // It's safe to depend on stateRef.current, because we never mutate it

  let renderedChildren;

  if (stateRef.current.breakpoint !== null) {
    renderedChildren = typeof children === 'function' ? children(stateRef.current.breakpoint, sizeRef.current) : children;

    Object.assign(elementProps, stateRef.current.breakpoint.props);
  }

  elementProps.ref = saveRef;

  return createElement(type, elementProps, renderedChildren);
}

const defaultBreakpoint = {props: {}, minWidth: 0, maxWidth: Infinity, minHeight: 0, maxHeight: Infinity};

// Find the last breakpoint that matches given size
function findBreakpointByOrder(breakpoints, size) {
  const {width = Infinity, height = Infinity} = size || {};

  for (let i = breakpoints.length; i--;) {
    const breakpoint = breakpoints[i];
    const {minWidth = 0, maxWidth = Infinity, minHeight = 0, maxHeight = Infinity} = breakpoint;

    if (width >= minWidth && width <= maxWidth && height >= minHeight && height <= maxHeight) {
      return breakpoint;
    }
  }

  return defaultBreakpoint;
}

// Find breakpoint with the smallest area
function findBreakpointByArea(breakpoints, size) {
  const {width = 1e6, height = 1e6} = size || {};

  return breakpoints.reduce((result, breakpoint) => {
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
function findBreakpointByIntersection(breakpoints, size) {
  const {width = 1e6, height = 1e6} = size || {};

  return breakpoints.reduce((result, breakpoint) => {
    const {minWidth = 0, maxWidth = 1e6, minHeight = 0, maxHeight = 1e6} = breakpoint;
    const area = Math.max(0, Math.min(maxWidth, width) - minWidth) * Math.max(0, Math.min(maxHeight, height) - minHeight);

    if (area >= result.area) {
      result.area = area;
      result.breakpoint = breakpoint;
    }

    return result;
  }, {area: 0, breakpoint: defaultBreakpoint}).breakpoint;
}
