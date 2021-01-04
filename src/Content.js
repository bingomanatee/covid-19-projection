import React, { useEffect, useState } from 'react';
import { Heading, Main, Paragraph } from 'grommet';
import store from './store';
import Home from './Home';

export default () => {
  const [page, setPage] = useState('');

  useEffect(() => {
    const sub = store.subscribe(
      (map) => {
        if (page !== map.get('page')) {
          setPage(map.get('page'));
        }
      },
    );

    return () => {
      sub.unsubscribe();
    };
  }, []);

  let PageComponent = null;

  switch (page) {
    case 'home':
      PageComponent = Home;
      break;
  }

  console.log('rendering content');

  if (!PageComponent) return '';

  return <PageComponent />;
};
