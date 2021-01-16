import {
  Box, Button, Header, ResponsiveContext,
} from 'grommet';
import React, { useContext } from 'react';
import store from './store';

export default () => {
  const pageSize = useContext(ResponsiveContext);
  console.log('pageSize:', pageSize);
  const textSize = (pageSize === 'small' || pageSize === 'xsmall') ? 'small' : 'medium';
  return (
    <Header background="neutral-3">
      <Box
        direction="row"
        justify="between"
        fill="horizontal"
      >
        <Button
          label="COVID-19 Mortality"
          size={textSize}
          onClick={() => store.do.setPage('mortality')}
        />
        <Button
          label="COVID-19 Cases"
          size={textSize}
          onClick={() => store.do.setPage('cases')}
        />
        <Box flex="1" />
        <Button
          label="Summary Table"
          size={textSize}
          onClick={() => {
            store.do.setPage('data');
          }}
        />
        <Button
          label="About This Page"
          size={textSize}
          onClick={() => {
            store.do.setPage('about');
          }}
        />
      </Box>

    </Header>
  );
};
