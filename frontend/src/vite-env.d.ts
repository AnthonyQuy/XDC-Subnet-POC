/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEFAULT_RPC_URL: string
  readonly VITE_DEFAULT_CONTRACT_ADDRESS: string
  readonly VITE_SUBNET_CHAIN_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
