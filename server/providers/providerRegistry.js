const providerEnvKeys = {
  localFinanceExpenditure: ['LOFIN_EXPENDITURE_API_KEY'],
  assemblyBill: ['ASSEMBLY_BILL_API_URL', 'ASSEMBLY_BILL_API_KEY'],
  dart: ['DART_API_KEY'],
  stockPrice: ['STOCK_PRICE_API_KEY'],
}

export function getProviderStatus() {
  return Object.fromEntries(
    Object.entries(providerEnvKeys).map(([provider, envKeys]) => [
      provider,
      {
        configured: envKeys.every((envKey) => Boolean(process.env[envKey])),
        requiredEnvironmentVariables: envKeys,
      },
    ]),
  )
}
