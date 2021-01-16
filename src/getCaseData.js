import axios from 'axios';
import parse from 'csv-parse';

export default async function () {
  const { data: deaths } = await axios.get(
    // eslint-disable-next-line max-len
    'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_US.csv',
  );

  return new Promise((done, fail) => {
    const output = [];
    parse(deaths, { columns: true })
      .on('readable', function () {
        let record;
        // eslint-disable-next-line no-cond-assign
        while ((record = this.read())) {
          output.push(record);
        }
      })
      .on('end', () => {
        done(output);
      });
  });
}
