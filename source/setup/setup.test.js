import fs from 'fs'
import init from './adapt.init.js'
import to from '@jrh/to'

// --------------------------------------------

describe('init()', () => {
  const expectedFilePath = to('./fixtures/empty-environment/context/context.environment.data.js', import.meta.url)

  beforeEach(() => {
    if (fs.existsSync(expectedFilePath)) {
      fs.unlinkSync(expectedFilePath)
    }
  })

  context('without existing environment data', () => {
    it('creates an empty environment data file', async () => {
      expect(fs.existsSync(expectedFilePath)).to.eq(false)

      const emptyDirectory = to('./fixtures/empty-environment/context', import.meta.url)

      init(to('./fixtures/empty-environment/context', import.meta.url))

      const newFile = (await import(expectedFilePath)).default
      expect(newFile).to.deep.eq({})
    })
  })

  context('with existing environment data', () => {
    it('does not affect the existing environment data file', async () => {
      const existingFilePath = to('./fixtures/existing-environment/context/context.environment.data.js', import.meta.url)
      const existingFile = (await import(existingFilePath)).default
      expect(existingFile).to.deep.eq({ exists: true })

      init(to('./fixtures/existing-environment', import.meta.url))

      expect(existingFile).to.deep.eq({ exists: true })
    })
  })
})
