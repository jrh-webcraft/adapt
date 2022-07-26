import fs from 'fs'

export default (directory) => {
  if (fs.existsSync(directory + '/context.environment.data.js')) {
    console.log(`[adapt] Local environment data detected in ${ directory }. Using existing environment data.`)
    return
  }

  console.log(`[adapt] No local environment data detected in ${ directory }. Creating default environment data.`)

  const content = 'export default {}'
  fs.writeFileSync(directory + '/context.environment.data.js', content)
}
