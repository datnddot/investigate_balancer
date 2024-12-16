import {
  BalancerApi,
  ChainId,
  Slippage,
  SwapKind,
  Token,
  TokenAmount,
  Swap,
  SwapBuildOutputExactIn,
  SwapBuildCallInput,
  ExactOutQueryOutput,
} from '@balancer/sdk'
import { ethers } from 'ethers'
import 'dotenv/config'

const pk: string = process.env.PK as string
const rpcUrl = process.env.RPC_URL as string
const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

async function main() {
  // User defined
  const chainId = ChainId.OPTIMISM
  const swapKind = SwapKind.GivenOut
  const tokenIn = new Token(
    chainId,
    '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    6,
    'USDC',
  )
  const tokenOut = new Token(
    chainId,
    '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    6,
    'USDT',
  )
  const wethIsEth = false // If true, incoming ETH will be wrapped to WETH, otherwise the Vault will pull WETH tokens
  const deadline = 999999999999999999n // Deadline for the swap, in this case infinite
  const slippage = Slippage.fromPercentage('0.1') // 0.1%
  const swapAmount = TokenAmount.fromHumanAmount(tokenOut, '0.01')

  // API is used to fetch best swap paths from available liquidity across v2 and v3
  const balancerApi = new BalancerApi('https://api-v3.balancer.fi/', chainId)

  const sorPaths = await balancerApi.sorSwapPaths.fetchSorSwapPaths({
    chainId,
    tokenIn: tokenIn.address,
    tokenOut: tokenOut.address,
    swapKind,
    swapAmount,
  })

  // Swap object provides useful helpers for re-querying, building call, etc
  const swap = new Swap({
    chainId,
    paths: sorPaths,
    swapKind,
  })

  console.log(
    `Input token: ${swap.inputAmount.token.address}, Amount: ${swap.inputAmount.amount}`,
  )
  console.log(
    `Output token: ${swap.outputAmount.token.address}, Amount: ${swap.outputAmount.amount}`,
  )

  // Get up to date swap result by querying onchain
  const updated = (await swap.query(rpcUrl)) as ExactOutQueryOutput
  console.log('Required Amount In', updated.expectedAmountIn.amount.toString())

  let buildInput: SwapBuildCallInput
  // In v2 the sender/recipient can be set, in v3 it is always the msg.sender
  if (swap.protocolVersion === 2) {
    const senderWallet = new ethers.Wallet(pk, provider)
    buildInput = {
      slippage,
      deadline,
      queryOutput: updated,
      wethIsEth,
      sender: senderWallet.address as `0x${string}`,
      recipient: senderWallet.address as `0x${string}`,
    }
  } else {
    buildInput = {
      slippage,
      deadline,
      queryOutput: updated,
      wethIsEth,
    }
  }

  const callData = swap.buildCall(buildInput) as SwapBuildOutputExactIn

  console.log('calldata', callData)
}

main().catch(console.error)
