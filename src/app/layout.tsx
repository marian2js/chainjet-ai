'use client'

import './globals.css'
import { Inter } from 'next/font/google'
import '@rainbow-me/rainbowkit/styles.css'
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit'
import { WagmiConfig, configureChains, createConfig } from 'wagmi'
import { mainnet, polygon, optimism, arbitrum } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'
import ChainJetContextProvider from '@/components/providers/ChainJetProvider'

const inter = Inter({ subsets: ['latin'] })

const { chains, publicClient } = configureChains([mainnet, polygon, optimism, arbitrum], [publicProvider()])

const { connectors } = getDefaultWallets({
  appName: 'ChainJet AI',
  chains,
})

const wagmiConfig = createConfig({
  autoConnect: true,
  publicClient,
  connectors,
})

// export const metadata = {
//   title: 'Create Next App',
//   description: 'Generated by create next app',
// }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ChainJetContextProvider>
          <WagmiConfig config={wagmiConfig}>
            <RainbowKitProvider chains={chains}>{children}</RainbowKitProvider>
          </WagmiConfig>
        </ChainJetContextProvider>
      </body>
    </html>
  )
}
