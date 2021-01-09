import React, { useEffect, useState } from 'react';
import { Heading, Main, Paragraph } from 'grommet';
import store from './store';
import Home from './Home';
import About from './About';

export default () => {
  const [page, setPage] = useState('');

  useEffect(() => {
    const sub = store.subscribe(
      (map) => {
        console.log('--- store --- map = ', map);
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

    case 'about':
      PageComponent = About;
      break;
  }

  console.log('rendering ---- page = ', page);

  if (!PageComponent) return '';

  return <PageComponent />;
};
