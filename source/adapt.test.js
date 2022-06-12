import configureAdapt from './adapt.js'

// ---------------------------------------------

const fake = {
  options: {
    configuration: {},

    environment: {
      mode: 'string'
    }
  }
}

// ---------------------------------------------

describe('configureAdapt()', () => {
  context('without configuration data', () => {
    it('throws an error', () => {
      expect(() => configureAdapt({ ...fake.options, configuration: null }))
        .to.throw('configuration')
    })
  })

  context('without environment data', () => {
    it('throws an error', () => {
      expect(() => configureAdapt({ ...fake.options, environment: null }))
        .to.throw('environment')
    })
  })

  context('without a mode key in the environment', () => {
    it('throws an error', () => {
      expect(() => configureAdapt({ ...fake.options, environment: {} }))
        .to.throw('mode')
    })
  })

  context('with all required options', () => {
    it('returns an adapt() function', () => {
      const adapt = configureAdapt(fake.options)
      expect(adapt).to.be.a('function')
    })
  })
})

// ---------------------------------------------

describe('adapt()', () => {
  context('without a selector', () => {
    it('throws an error', () => {
      const adapt = configureAdapt(fake.options)
      expect(() => adapt()).to.throw('selector')
    })
  })

  context('with a selector that matches a configuration key', () => {
    it('returns the value of the configuration key', () => {
      const configuration = { key: 'root', api: { key: 'nested' } }
      const adapt = configureAdapt({ ...fake.options, configuration })

      const root = adapt('key')
      expect(root).to.eq('root')

      const nested = adapt('api.key')
      expect(nested).to.eq('nested')
    })

    it('can return array values', () => {
      const configuration = { array: [ 1, 2, 3 ], nested: { array: [ 4, 5, 6 ] } }
      const adapt = configureAdapt({ ...fake.options, configuration })

      const root = adapt('array')
      expect(root).to.deep.eq([ 1, 2, 3 ])

      const nested = adapt('nested.array')
      expect(nested).to.deep.eq([ 4, 5, 6 ])
    })

    it('can return number values', () => {
      const configuration = { number: 3, nested: { number: 4 } }
      const adapt = configureAdapt({ ...fake.options, configuration })

      const root = adapt('number')
      expect(root).to.eq(3)

      const nested = adapt('nested.number')
      expect(nested).to.eq(4)
    })

    it('can return boolean values', () => {
      const configuration = { boolean: false, nested: { boolean: true } }
      const adapt = configureAdapt({ ...fake.options, configuration })

      const root = adapt('boolean')
      expect(root).to.eq(false)

      const nested = adapt('nested.boolean')
      expect(nested).to.eq(true)
    })

    it('does not consider words ending in "ss" to be plural', () => {
      const configuration = { assess: 'value', nested: { assess: 'value' } }
      const adapt = configureAdapt({ ...fake.options, configuration })

      const root = adapt('assess')
      expect(root).to.eq('value')

      const nested = adapt('nested.assess')
      expect(nested).to.eq('value')
    })
  })

  context('with a selector that does not match a configuration key', () => {
    it('throws an error', () => {
      const environment = { mode: 'staging' }

      expect(() => {
        const configuration = {}
        const adapt = configureAdapt({ ...fake.options, configuration, environment })
        adapt('key')
      }).to.throw(/'key'.*could not be found.*'staging'.*/)

      expect(() => {
        const configuration = { api: {}, environment }
        const adapt = configureAdapt({ ...fake.options, configuration, environment })
        adapt('api.key') 
      }).to.throw(/'key'.*'api.key'.*could not be found.*'staging'.*/)
    })
  })

  context('with a selector that matches a plural key', () => {
    context('with a matching mode key', () => {
      it('returns the value for the matching mode key', () => {
        const configuration = {
          keys: {
            staging: 'root_staging'
          },

          api: {
            keys: {
              staging: 'nested_staging'
            }
          }
        }

        const environment = { mode: 'staging' }
        const adapt = configureAdapt({ ...fake.options, configuration, environment })

        const root = adapt('key')
        expect(root).to.eq('root_staging')

        const nested = adapt('api.key')
        expect(nested).to.eq('nested_staging')
      })
    })

    context('with a default key', () => {
      context('and a matching mode key', () => {
        it('returns the value for the matching mode key', () => {
          const configuration = {
            keys: {
              _default: 'root_default',
              staging: 'root_staging'
            },

            api: {
              keys: {
                _default: 'nested_default',
                staging: 'nested_staging'
              }
            }
          }

          const environment = { mode: 'staging' }
          const adapt = configureAdapt({ ...fake.options, configuration, environment })

          const root = adapt('key')
          expect(root).to.eq('root_staging')

          const nested = adapt('api.key')
          expect(nested).to.eq('nested_staging')
        })
      })

      context('and no matching mode key', () => {
        it('returns the value for the default key', () => {
          const configuration = {
            keys: {
              _default: 'root_default',
              staging: 'root_staging'
            },

            api: {
              keys: {
                _default: 'nested_default',
                staging: 'nested_staging'
              }
            }
          }

          const environment = { mode: 'development' }
          const adapt = configureAdapt({ ...fake.options, configuration, environment })

          const root = adapt('key')
          expect(root).to.eq('root_default')

          const nested = adapt('api.key')
          expect(nested).to.eq('nested_default')
        })
      })
    })
  })

  context('with a selector containing []', () => {
    context('and a matching key in the environment', () => {
      it('retrieves the value from the environment', () => {
        const configuration = { 
          key: 'begin-[root_key]-end',
          api: { key: '[nested_key]' }
        }

        const environment = {
          ...fake.options.environment,
          root_key: 'root',
          nested_key: 'nested'
        }

        const adapt = configureAdapt({ ...fake.options, configuration, environment })

        const root = adapt('key')
        expect(root).to.eq('begin-root-end')

        const nested = adapt('api.key')
        expect(nested).to.eq('nested')
      })
    })

    context('and no matching key in the environment', () => {
      it('throws an error', () => {
        const configuration = { key: '[nonexistent]' }
        const adapt = configureAdapt({ ...fake.options, configuration })

        expect(() => adapt('key'))
          .to.throw('could not be found in the environment')
      })
    })
  })

  context('with multiple selectors containing []', () => {
    context('and all matching keys in the environment', () => {
      it('retrieves the values from the environment', () => {
        const configuration = { 
          key: 'begin-[key_1]-[key_2]-end'
        }

        const environment = {
          ...fake.options.environment,
          key_1: 'one',
          key_2: 'two'
        }

        const adapt = configureAdapt({ ...fake.options, configuration, environment })

        const value = adapt('key')
        expect(value).to.eq('begin-one-two-end')
      })
    })

    context('and partial matching keys in the environment', () => {
      it('throws an error', () => {
        const configuration = { 
          key: 'begin-[key_1]-[key_2]-end'
        }

        const environment = {
          ...fake.options.environment,
          key_1: 'one'
        }

        const adapt = configureAdapt({ ...fake.options, configuration, environment })

        expect(() => adapt('key'))
          .to.throw('could not be found in the environment')
      })
    })

    context('and no matching keys in the environment', () => {
      it('throws an error', () => {
        const configuration = { 
          key: 'begin-[key_1]-[key_2]-end'
        }

        const environment = {
          ...fake.options.environment
        }

        const adapt = configureAdapt({ ...fake.options, configuration, environment })

        expect(() => adapt('key'))
          .to.throw("'key_1' could not be found in the environment")
      })
    })
  })
})
