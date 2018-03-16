import PropTypes from 'prop-types';

export const contextTypes = {
  sizeWatcher: PropTypes.shape({
    checkIn: PropTypes.func,
    checkOut: PropTypes.func,
  }),
};
