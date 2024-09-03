# Sui TS benchmark

This repo contains a Sui end-to-end performance benchmark. To run (on testnet):

Get gas if necessary:

     $ sui client faucet

Export private key:

     $ sui client addresses
     ╭──────────────┬────────────────────────────────────────────────────────────────────┬────────────────╮
     │ alias        │ address                                                            │ active address │
     ├──────────────┼────────────────────────────────────────────────────────────────────┼────────────────┤
     │ upbeat-topaz │ 0x69755d85baca525a6b555f060c9255ebcef0fc73c348bb0cf579ad63062f0fd2 │ *              │
     ╰──────────────┴────────────────────────────────────────────────────────────────────┴────────────────╯


     $ sui keytool export --key-identity upbeat-topaz
     ╭────────────────────┬────────────────────────────────────────────────────────────────────────────────────────────╮
     │ exportedPrivateKey │  suiprivkeyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx                    │
     │ key                │ ╭─────────────────┬──────────────────────────────────────────────────────────────────────╮ │
     │                    │ │ alias           │                                                                      │ │
     │                    │ │ suiAddress      │  0x69755d85baca525a6b555f060c9255ebcef0fc73c348bb0cf579ad63062f0fd2  │ │
     │                    │ │ publicBase64Key │  ACO3AH1wskshimCIrGc2pdudrQJs0ytlNWnUqUicKPrU                        │ │
     │                    │ │ keyScheme       │  ed25519                                                             │ │
     │                    │ │ flag            │  0                                                                   │ │
     │                    │ │ peerId          │  23b7007d70b24b218a6088ac6736a5db9dad026cd32b653569d4a9489c28fad4    │ │
     │                    │ ╰─────────────────┴──────────────────────────────────────────────────────────────────────╯ │
     ╰────────────────────┴────────────────────────────────────────────────────────────────────────────────────────────╯

Build and run server:

     $ pnpm install
     $ pnpm run build
     $ SUI_JSON_RPC_URL=https://benchmark-rpc.sui-testnet.mystenlabs.com:443  SUI_PRIVATE_KEY=suiprivkeyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx pnpm run preview

Instructions for running on mainnet are identical, except you will need to fund the account yourself instead of using faucet,
and you should use `SUI_JSON_RPC_URL=https://benchmark-rpc.sui-mainnet.mystenlabs.com:443`

## Variables

- `SUI_PRIVATE_KEY` sets the private key used for executing transactions
- `SUI_JSON_RPC_URL` sets the JSON RPC endpoint used to execute transactions
- `PROMETHEUS_PORT` sets the Port to report metrics to. Will log metrics to the console of not set
- `COUNTER_PACKAGE_ID` sets the ID of the counter package. See Packages section below
- `SHARED_COUNTER_ID` set the ID of the shared counter object to increment
- `OWNED_COUNTER_ID` set the ID of the owned counter object to increment
