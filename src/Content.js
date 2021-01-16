import React, { useEffect, useState } from 'react';
import { Heading, Main, Paragraph } from 'grommet';
import store from './store';
import Mortality from './Mortality';
import About from './About';
import Cases from './Cases';
import Summary from './Summary';

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

  let PageComponent = Mortality;

  switch (page) {
    case 'home':
      PageComponent = Mortality;
      break;

    case 'data':
      PageComponent = Summary;
      break;

    case 'cases':
      PageComponent = Cases;
      break;

    case 'about':
      PageComponent = About;
      break;

    default:
      PageComponent = Mortality;
  }

  if (!PageComponent) return '';

  return <PageComponent />;
};
