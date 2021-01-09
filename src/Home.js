/* eslint-disable camelcase */
import React, { useEffect, useState } from 'react';
import { ValueMapStream, addActions } from '@wonderlandlabs/looking-glass-engine';
import {
  Box, Heading, Layer, Paragraph,
} from 'grommet';
import Loader from 'react-loader-spinner';
import sortBy from 'lodash/sortBy';
import store from './store';
import getRawData from './get-raw-data';
import DateRange from './DateRange';
import Mortality from './Mortality';

const DATE_RE = /(.*)\/(.*)\/(.*)/;

class RowDataItem {
  constructor(rowData, dates) {
    const {
      UID, Province_State, Country_Region, Population,
    } = rowData;
    this.UID = UID;
    this.population = Population;
    this.info = {
      state: Province_State,
      region: Country_Region,
    };
    this.series = [...dates.values()].map((dateData) => ((dateData.label in rowData) ? rowData[dateData.label] : 0));
  }
}

export default () => {
  const [homeStore, setHS] = useState(null);
  const [values, setValues] = useState(new Map());

  useEffect(() => {
    const newHomeStore = addActions(new ValueMapStream({
      rawDataLoadStatus: 'unloaded',
      rawData: [],
      dates: new Map(),
      loadError: null,
      regions: new Map(),
      drawn: false,
    }),
    {
      parseDates(theStore) {
        const dates = new Map();
        //  console.log('parsing dates from ', theStore.my.rawData);
        let noNewDates = 0;
        theStore.my.rawData.forEach((row) => {
          if (noNewDates > 4) return;
          let foundNew = false;
          Object.keys(row).forEach((key) => {
            if (dates.has(key)) return;
            //  console.log('key:', key);
            if (DATE_RE.test(key)) {
              foundNew = true;
              const [_, month, date, year] = DATE_RE.exec(key);
              const data = {
                label: key,
                key,
                month: Number.parseInt(month, 10),
                date: Number.parseInt(date, 10),
                year: Number.parseInt(year, 10) + 2000,
              };
              data.date = new Date(data.year, data.month, data.date);
              data.time = data.date.getTime();
              dates.set(key, data);
            }
          });
          if (!foundNew) ++noNewDates;
        });

        // console.log('found dates:', dates);
        const dateList = sortBy([...dates.values()], 'time');

        theStore.do.setDates(dates);

        theStore.my.rawData.forEach((row) => {
          theStore.do.addRegionData(row);
        });
      },
      addRegionData(theStore, row) {
        const data = new Map(theStore.my.regions);
        const item = new RowDataItem(row, theStore.my.dates);
        data.set(item.UID, item);

        theStore.do.setRegions();
      },
      async loadData(theStore) {
        theStore.do.setRawDataLoadStatus('laoding');
        try {
          const rawData = await getRawData();
          theStore.do.setRawData(rawData);
          theStore.do.parseDates();
          theStore.do.setRawDataLoadStatus('loaded');
        } catch (err) {
        //  console.log('---- error:', err);
          theStore.do.setRawDataLoadStatus('error');
          theStore.do.setLoadError(err);
        }
      },
    });

    setHS(newHomeStore);

    newHomeStore.do.loadData();
    const sub = newHomeStore.subscribe(
      (newValues) => {
        if (newValues !== values) setValues(newValues);
      },
    );

    return () => {
      sub.unsubscribe();
    };
  }, []);

  if (!homeStore) return '';

  let min = 0;
  let max = 0;
  if (homeStore.my.dates.size) {
    const range = [...homeStore.my.dates.values()].map(({ time }) => time);
    range.sort();
    min = range.shift();
    max = range.pop();
  }
  return (
    <>
      {(!homeStore.my.drawn) ? (
        <Layer plain>
          <Paragraph textAlign="center">
            <Loader type="Oval" color="#0066E1" height={200} width={200} />
            Drawing COVID-19 Graph -- please wait.
            <br />
            Data Loading from latest sources.
          </Paragraph>
        </Layer>
      ) : '' }
      {' '}

      {homeStore.my.rawDataLoadStatus === 'loaded' ? <DateRange min={min} max={max} /> : null}
      <Mortality homeStore={homeStore} />
    </>
  );
};

// <DateRange dates={values.get('dates')} />
