# @jrh/adapt

Flexible configuration and environment variable management for Node.js applications.

For a quickstart, see the [usage example](#usage-example).

## Installation

`npm install @jrh/adapt`

## The Configuration Function

### Usage

`const configureAdapt = require('@jrh/adapt')`

### Syntax

```
configureAdapt(options)
```

### Arguments

| Name | Type | Description |
| :-- | :-- | :-- |
| options | [Object: Options](#the-options-object) | Options for configuring [the selecting function](#the-selecting-function). |

### Returns

| Type | Description |
| :-- | :-- |
| Function | A [selecting function](#the-selecting-function) which can be used to access [the configuration object](#the-configuration-object). |

### Exceptions

Throws a standard `Error` if:

- The configuration object is not present.
- The environment object is not present.
- The environment object does not contain the [mode key](#the-mode-key).

---

#### The Options Object

| Attribute | Type | Description |
| :-- | :-- | :-- |
| configuration | [Object: Configuration](#the-configuration-object) | Configuration data which will be accessed by the selecting function. |
| environment | [Object: Environment](#the-environment-object) | Environment data used to change the which configuration data will be accessed. |

---

## The Configuration Object

The configuration object contains the configuration data for your application. It can contain [special keys](#special-keys) and [values](#special-values).

### Example Structure

```
{
  api: {
    keys: {
      _default: 'bcd-234',
      staging: 'abc-123'
      production: '[production_key]'
    }
  },

  general: {
    arbitrary_list: [ 1, 2, 3 ],
    number: 5,
    release_date: '2020-01-01'
  }
}
```

#### Normal Keys

**Normal keys** can be accessed by name with [the selecting function](#the-selecting-function):

```javascript
adapt('general.arbitrary_list') // => [ 1, 2, 3 ]
adapt('general.number') // => 5
adapt('general.release_date') // => '2020-01-01'
```

Supported types of values for normal keys are strings, booleans, numbers, and arrays.

### Special Keys

##### Plural Keys

**Plural keys**, such as `api.keys` above, will be accessed when the singular form of the selector (`api.key`) can't be found.

The value returned will be based on the mode defined in the [environment object](#the-environment-object). If the mode matches a key within the plural key (such as `api.keys.production`), that mode-specific value will be returned.

```javascript
// Environment: { mode: 'staging' }
adapt('api.key') // => 'abc-123'
```

##### The `_default` Key

**The `_default` key** may be defined as a child of a plural key (`api.keys._default`). This key will be accessed if no key matching the mode can be found within the plural key.

```javascript
// Environment: { mode: 'development' }
adapt('api.key') // => 'bcd-234'
```

### Special Values

##### Environment Values

**Environment values** are surrounded in brackets (`[value_from_environment]`). This tells [the selecting function](#the-selecting-function) to search the [environment object](#the-environment-object) for a matching value.

This is useful for private values that you don't want committed to source control.

```javascript
// Environment: { mode: 'production', production_key: 'xyz-345' }
adapt('api.token') // => 'xyz-345'
```

If the configuration value contains text in addition to the environment value, that text will be preserved.

Multiple environment values can be included in a single configuration value.

```javascript
// Configuration: { phrase: 'begin-[word_1]-[word_2]-end' }
// Environment: { word_1: 'hello', word_2: 'world' }

adapt('phrase') // => 'begin-hello-world-end'
```

### The Environment Object

The environment object contains the application's environment data and [mode](#the-mode-key).

The simplest form of this could be to use `process.env`:

```javascript
const adapt = require('@jrh/adapt')({
  configuration: {},
  environment: process.env
})
```

You can also mix together sources. This is useful when you want to keep an environment file (or files) on your local machine, while relying on private values in remote environments.

```javascript
let local = {}
try { local = require('./environment.json') } catch {}

const adapt = require('@jrh/adapt')({
  configuration: {},

  environment: {
    ...local,
    ...process.env
  }
})
```

#### Example Structure

```
{
  mode: 'staging',

  production_key: 'xyz-654',
  private_api_key: 'vfx-125'
}
```

#### Special Keys

##### The Mode Key

The environment object must contain a mode key which contains the running mode of the application (i.e. `development` or `production`).

This tells [the selecting function](#the-selecting-function) which part of [the configuration object](#the-configuration-object) to use when a [plural key](#plural-keys) is accessed.

For an example, see [the usage example](#the-usage-example).

## The Selecting Function

The selecting function is generated by [the configuration function](#the-configuration-function) and can be used throughout your application to access configuration data.

#### Syntax

`adapt(selector)`

#### Arguments

| Name | Type | Description |
| :-- | :-- | :-- |
| selector | String | A string in dot notation describing which part of the configuration data to return. |

#### Example

`adapt('api.key')`

#### Exceptions

Throws a standard `Error` if:

- No selector is present.
- A matching key cannot be found in [the configuration object](#the-configuration-object).
- The value of a selected [environment value](#environment-values) is undefined.

## Usage Example

**environment.json**

```json
{
  "api_key_development": "development_value"
}
```

**adapt.json**

```json
{
  "api": {
    "keys": {
      "_default": "[api_key_development]",
      "production": "[api_key_production]"
    }
  }
}
```

**adapt.js**

```javascript
let local = {}
try { local = require('./environment.json') } catch {}

module.exports = require('@jrh/adapt')({
  configuration: require('./adapt.json'),

  environment: {
    ...local,
    ...process.env
  }
})
```

**app.js**

```javascript
const adapt = require('./adapt')

// With process.env = { mode: 'development' }:
adapt('api.key') // => 'development_value'

// With process.env = { mode: 'production', api_key_production: 'production_value' }:
adapt('api.key') // => 'production_value'
```
