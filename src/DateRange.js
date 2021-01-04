import { Box, Layer, RangeSelector } from 'grommet';
import React, { useState, useEffect } from 'react';
import sortBy from 'lodash/sortBy';

export default ({ min, max }) => {
  const [values, setValues] = useState([min, max]);

  useEffect(() => {
    console.log('values:', values);
  }, [values]);

  if (min < max) {
    return (
      <>
        <Box direction="row" justify="between">
          <span>{new Date(min).toUTCString(true)}</span>
          <span>{new Date(max).toUTCString(true)}</span>
        </Box>
        <RangeSelector
          direction="horizontal"
          invert={false}
          min={min}
          max={max}
          size="full"
          round="small"
          values={values}
          step={(max - min) / 1000}
          onChange={(newValues) => {
            setValues(newValues);
          }}
        />
      </>
    );
  }
  return '';
};
