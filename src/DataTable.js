import React, { Component } from 'react';
import { DataTable } from 'grommet';
import sizeMe from 'react-sizeme';
import dayjs from 'dayjs';
import store from './store';

class MortalityDataTable extends Component {
  constructor(props) {
    super(props);
    this.state = store.do.dataTable();
  }

  componentDidMount() {
    this._sub = store.subscribe(() => {
      this.setState(store.do.datatable());
    });
  }

  columns() {
    return this.state.dates.reduce((columns, date) => [...columns, {
      property: date.key,
      aggregate: 'sum',
      header: dayjs(date.date).format('M/YY'),
    }], [
      {
        property: 'uid',
        primary: true,
      },
      {
        property: 'info.city',
        key: 'city',
        header: 'City',
      },
      {
        property: 'state',
        header: 'State',
      },
    ]);
  }

  render() {
    return <DataTable className="data-table" columns={this.columns()} step={100000} data={this.state.rows} />;
  }
}

export default sizeMe({ monitorHeight: true })(MortalityDataTable);
