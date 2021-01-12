import humNum from 'humanize-number';
import React, { useEffect, useState, Component } from 'react';
import {
  Box, DataTable, Heading as H, Paragraph as P,
} from 'grommet';
import store from './store';

export default class DexieReport extends Component {
  constructor(props) {
    super(props);
    this.state = {
      rawDataLoadStatus: store.my.rawDataLoadStatus,
      states: store.my.states,
    };
  }

  componentDidMount() {
    this.sub = store.subscribe((map) => {
      if (map.get('rawDataLoadStatus') !== this.state.rawDataLoadStatus) {
        this.setState({
          rawDataLoadStatus: map.get('rawDataLoadStatus'),
          states: map.get('states'),
        });

        if (store.my.rawDataLoadStatus === 'loaded') {
          store.do.summary()
            .then((summary) => this.setState({ summary }));
        }
      }
    });
  }

  componentWillUnmount() {
    if (this.sub) this.sub.unsubscribe();
  }

  render() {
    const { rawDataLoadStatus, summary, states } = this.state;
    return (
      <Box pad="medium" overflow="auto">
        <H level={1}>Dexie Report</H>
        <P>
          Load Status:
          <i>{rawDataLoadStatus}</i>
        </P>
        {summary && (
          <>
            <H level={2}>Death Totals</H>
            <DataTable
              data={summary}
              columns={[
                { property: 'monthYear', header: 'Month/Year' },
                {
                  property: 'deaths',
                  header: 'Deaths',
                  align: 'end',

                  render: ({ deaths }) => humNum(deaths),
                },
              ]}
            />
          </>
        )}
        {(states && states.length) ? (
          <>
            <H level={2}>By State</H>
            <DataTable
              height="400"
              columns={[
                { property: 'state', heading: 'State' },
                { property: 'region', heading: 'Country' },
                {
                  key: 'total',
                  heading: 'Total',
                  align: 'end',
                  render: (state) => humNum(state.total()),
                },
              ]}
              data={states}
            />
            <Box pad="medium" direction="row" justify="between">
              <b>Total</b>
              {humNum(states.reduce((t, s) => t + s.total(), 0))}
            </Box>
          </>
        ) : ''}
      </Box>
    );
  }
}
