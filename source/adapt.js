const { plural } = require('pluralize')

// ---------------------------------------------

function search({ data, selector, mode, origin }) {
  const properties = selector.split('.')
  const selected = select({ data, selector: properties[0], mode, origin })

  if ([ 'boolean', 'string', 'number' ].includes(typeof(selected)) || Array.isArray(selected)) {
    return selected
  }

  selector = properties.slice(1).join('.')
  return search({ data: selected, selector, mode, origin })
}

// ---------------------------------------------

function select({ data, selector, mode, origin }) {
  let value = data[selector]

  if (typeof value === 'undefined') {
    const expanded = data[plural(selector)]

    try {
      value = expanded && search({ data: expanded, selector: mode, mode })
    }

    catch {
      value = expanded._default
    }
  }

  if (typeof value === 'undefined' && origin) {
    throw new Error(`[adapt] The selector '${ selector }' of '${ origin }' could not be found in the configuration.`)
  }

  if (typeof value === 'undefined') {
    throw new Error(`[adapt] The selector '${ selector }' could not be found in the configuration.`)
  }

  return value
}

// ---------------------------------------------

module.exports = ({ configuration, environment }) => {
  if (!configuration || !environment) {
    throw new Error('Adapt must be configured with the configuration and environment objects.')
  }

  const { mode } = environment

  if (!mode) {
    throw new Error('The environment object must include the application mode.')
  }

  return (selector) => {
    let value

    if (!selector) {
      throw new Error('No selector was present.')
    }

    if (!selector.includes('.')) {
      value = select({ data: configuration, selector, mode })
    }

    if (selector.includes('.')) {
      value = search({ data: configuration, selector, mode, origin: selector })
    }

    if (typeof(value) === 'string' && value.includes('[')) {
      const matcher = /\[[^\[]*\]/g
      const matches = value.match(matcher)

      matches.forEach(match => {
        const key = match.replace(/(\[|\])/g, '')
        const replacement = environment[key]

        if (!replacement) {
          throw new Error(`[adapt] A value for '${ key }' could not be found in the environment.`)
        }

        value = value.replace(match, replacement)
      })
    }

    return value
  }
}
