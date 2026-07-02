const Seneca = require('seneca')
const Shared = require('seneca-search-test')
const SearchAws = require('../search-aws-cloudsearch')

// NOTE: For some reason some operations take a while to get through
// to the Nozama server (the mock of the AWS CloudSearch API). As a
// quick (hopefully temporary) workaround, we bump the timeout.
//
jasmine.DEFAULT_TIMEOUT_INTERVAL = 60e3


describe('Compliance tests', () => {
  const seneca = make_seneca()

  beforeAll(done => {
    seneca.ready(done)
  })

  Shared.supports_add({ seneca })

  Shared.supports_search({ seneca })

  Shared.supports_remove({ seneca })

  Shared.remove({ seneca })

  Shared.add({ seneca })

  Shared.search({ seneca })
})


function make_seneca() {
  const si = Seneca({ log: 'test' })

  si.use(SearchAws, {
    csd: {
      endpoint: 'http://localhost:15808',
      region: 'us-west-1'
    }
  })

  return si
}

