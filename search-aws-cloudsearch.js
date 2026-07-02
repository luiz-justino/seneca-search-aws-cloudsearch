const AWS = require('aws-sdk')


function search_aws_cloudsearch(options) {
  const seneca = this


  if (null == options.csd) {
    return seneca.fail('The "csd" option is required')
  }

  const { csd: csd_config } = options
  const csd = new AWS.CloudSearchDomain(csd_config)


  seneca.add('sys:search,cmd:add', async function (msg, reply) {
    if (null == msg.doc) {
      return reply(null, {
        ok: false,
        why: 'invalid-field',
        details: {
          path: ['doc'],
          why_exactly: 'required'
        }
      })
    }

    const { doc } = msg


    if (null == typeof doc.id) {
      return reply(null, {
        ok: false,
        why: 'invalid-field',
        details: {
          path: ['doc', 'id'],
          why_exactly: 'required'
        }
      })
    }

    const { id: doc_id } = doc


    const fields = { ...doc }; delete fields.id

    const added = await csd.uploadDocuments({
      contentType: 'application/json',
      documents: Buffer.from(JSON.stringify([
        {
          lang: 'en',
          version: 1,
          type: 'add',
          id: doc_id,
          fields
        }
      ]))
    }).promise()


    if ('ok' !== added.status) {
      return reply(null, { ok: false, why: 'add-failed' })
    }


    return reply(null, { ok: true })
  })


  seneca.add('sys:search,cmd:search', function (msg, reply) {
    if (null == msg.query) {
      return reply(null, {
        ok: false,
        why: 'invalid-field',
        details: {
          path: ['query'],
          why_exactly: 'required'
        }
      })
    }

    const { query } = msg


    /* NOTE: For more information, please see documentation at:
     *
     * https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CloudSearchDomain.html#search-property
     *
     */
    const search_params = { query }
    
    return csd.search(search_params, function (err, out) {
      if (err) {
        return reply(err)
      }


      const hits = out.hits.hit.map(hit => {
        const { id, fields } = hit


        const doc = Object.keys(fields).reduce((acc, k) => {
          /* NOTE: AWS.CloudSearchDomain#search wraps values in arrays,
           * like this:
           *
              ```
              {
                hits: {
                  found: 3,
                  start: 0,
                  hit: [
                    { id: '1002', fields: { name: [ 'foo' ], extra: [ 'bob' ] } }
                  ]
                }
              }
              ```

           * - hence, we unwrap the values.
           *
           */

          acc[k] = fields[k][0]

          return acc
        }, {})


        return { id, doc }
      })


      return reply(null, { ok: true, data: { hits } })
    })
  })


  seneca.add('sys:search,cmd:remove', async function (msg, reply) {
    if (null == msg.id) {
      return reply(null, {
        ok: false,
        why: 'invalid-field',
        details: {
          path: ['id'],
          why_exactly: 'required'
        }
      })
    }

    const { id: doc_id } = msg


    const removed = await csd.uploadDocuments({
      contentType: 'application/json',
      documents: Buffer.from(JSON.stringify([
        {
          type: 'delete',
          id: doc_id
        }
      ]))
    }).promise()


    if ('ok' !== removed.status) {
      return reply(null, { ok: false, why: 'remove-failed' })
    }


    return reply(null, { ok: true })
  })


  return
}


module.exports = search_aws_cloudsearch
