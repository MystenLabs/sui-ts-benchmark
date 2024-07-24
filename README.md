# Nitro starter

Look at the [nitro quick start](https://nitro.unjs.io/guide#quick-start) to learn more how to get started.

## Routes

- `/api/balance`: Reports the current address and balance
- `/api/execute/simple-transfer`: Executes a transaction that sends 1 MIST to the sender

## Variables

- `SUI_PRIVATE_KEY` sets the private key used for executing transactions
- `SUI_JSON_RPC_URL` sets the JSON RPC endpoint used to execute transactions
- `PROMETHEUS_PORT` sets the Port to report metrics to. Will log metrics to the console of not set
- `COUNTER_PACKAGE_ID` sets the ID of the counter package. See Packages section below
- `SHARED_COUNTER_ID` set the ID of the shared counter object to increment
- `OWNED_COUNTER_ID` set the ID of the owned counter object to increment

## Packages:

- counter:
  - mainnet:
    - package: `0x1465e2a9dc8a5d5b406c3c2d931d84b0d3195e574bec76fb72a9da9b53860049`
    - shared counter: `0x61b3fd17844ce4fdf6ce3db9eaa14de92326ed8f07a8a0de19a129f87daf6e6a`
    - owned counter: `0x86dd3aed21acb9e124db1971e8ec386a86375b6554eeeb7da94340a21fd53e6b`
  - testnet:
    - package `0x7190cfaecbe30eea5afd180c426b4a14f5ca5a333cc96a12aecc86eb2d508f7e`
    - shared counter: `0xaf7a0a1346420a575015429cc4289a1d55faf37d93fa69bb07a1619b3be5665c`
    - owned counter: `0xe6f57449a3425927009a5a29044d6333053fb3f0b9c82b8d73777c72f2b33827`
