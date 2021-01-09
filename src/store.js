import { ValueMapStream, addActions } from '@wonderlandlabs/looking-glass-engine';

const { path } = window.location;

const currentPage = 'home';
const store = addActions(new ValueMapStream({
  page: currentPage,
}),
{
  foo(ss) {

  },
});

export default store;
