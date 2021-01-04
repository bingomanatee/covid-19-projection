import { ValueMapStream, addActions } from '@wonderlandlabs/looking-glass-engine';

let path = window.location.path;

const currentPage = 'home';
const store = addActions(new ValueMapStream({
  page: currentPage,
}),

{

});

export default store;
