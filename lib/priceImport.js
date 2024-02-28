import csvtojsonV2 from 'csvtojson'
import { importApiRoot } from './services'
import { logAndExit } from './helpers'
const nconf = require('nconf')
const importContainerKey =
  'standalonePrice-import-container'
 
export const createImportContainer = async (key) => {
  console.log(importApiRoot)
  try {
    const log = await importApiRoot
      .importContainers()
      .post({
        body: {
          key: key,
          resourceType: 'standalone-price'
        }
      })
      .execute()
    console.log(log)
  } catch (err) {
    return await logAndExit(
      err,
      `Failed to create import container`
    )
  }
}
 
export const checkImportSummary = async (
  importContainerKey
) => {
  console.log('entering checkImportSummary')
  try {
    const log = await importApiRoot
      .importContainers()
      .withImportContainerKeyValue({ importContainerKey })
      .importSummaries()
      .get()
      .execute()
    console.log(log)
  } catch (err) {
    return await logAndExit(
      err,
      `Failed to check import summary`
    )
  }
}
 
export const checkImportOperationsStatus = async (
  importContainerKey
) => {
  console.log('entering checkImportOperationsStatus')
 
  try {
    const log = await importApiRoot
      .importContainers()
      .withImportContainerKeyValue({ importContainerKey })
      .importOperations()
      .get({
        queryArgs: {
          debug: true
        }
      })
      .execute()
    console.log(log)
  } catch (err) {
    return await logAndExit(
      err,
      `Failed to check import operation status`
    )
  }
}
 
export const checkImportOperationStatusById = async (
  id
) => {
  console.log('entering checkImportOperationStatusById')
 
  try {
    const log = await importApiRoot
      .importOperations()
      .withIdValue({ id })
      .get()
      .execute()
    console.log(log)
  } catch (err) {
    return await logAndExit(
      err,
      `Failed to check import operation status by id`
    )
  }
}
 
export const importPriceDrafts = async (
  csvFilePath = './data/standalonePrice.csv'
) => {
  // createImportContainer(importContainerKey)
  console.log('entering importPriceDrafts')
  return importApiRoot
    .standalonePrices()
    .importContainers()
    .withImportContainerKeyValue({ importContainerKey })
    .post({
      body: await createStandalonePriceDraftImportRequest(
        csvFilePath
      )
    })
    .execute()
    .then((log) => {
      logAndExit(log, `imported standalone price`)
      checkImportSummary(importContainerKey)
      checkImportOperationsStatus(importContainerKey)
    })
    .catch((err) =>
      logAndExit(err, `Failed to import standalone price`)
    )
}
 
const createStandalonePriceDraftImportRequest = async (
  csvFilePath
) => ({
  type: 'standalone-price',
  resources: await getStandalonePriceDraftImportArray(
    csvFilePath
  )
})
 
const getStandalonePriceDraftImportArray = async (
  csvFilePath
) => {
  // Get price data from csv
  const standalonePrice = await csvtojsonV2().fromFile(
    csvFilePath
  )
  const priceToStandalonePriceDraftImport = (
    standalonePrice
  ) => {
    console.log(
      'entering priceToStandalonePriceDraftImport'
    )
 
    return {
      key: standalonePrice.key,
      sku: standalonePrice.sku,
      value: {
        centAmount: standalonePrice.centAmount,
        currencyCode: standalonePrice.currencyCode,
        type: standalonePrice.type,
        fractionDigits: standalonePrice.fractionDigits
      },
      country: standalonePrice.country
    }
  }
  return standalonePrice.map(
    priceToStandalonePriceDraftImport
  )
}
 
if (nconf.get('import')) {
  // eslint-disable-next-line no-console
  console.log('\x1b[32m%s\x1b[0m', 'Importing prices...')
  importPriceDrafts(nconf.get('csv'))
}