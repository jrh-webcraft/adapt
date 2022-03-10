const { expect } = require('chai')

// ---------------------------------------------
// Make specified helper methods available to all tests.

Object.assign(global, {
  expect
})
