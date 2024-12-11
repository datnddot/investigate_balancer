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
    ExactOutQueryOutput
  } from "@balancer/sdk";

    const RPC_URL = "https://eth-mainnet.public.blastapi.io";

    async function main() {
        // User defined
  const chainId = ChainId.MAINNET;
  const swapKind = SwapKind.GivenOut;
  const tokenIn = new Token(
      chainId,
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      18,
      "WETH"
  );
  const tokenOut = new Token(
      chainId,
      "0xba100000625a3754423978a60c9317c58a424e3D",
      18,
      "BAL"
  );
  const wethIsEth = false; // If true, incoming ETH will be wrapped to WETH, otherwise the Vault will pull WETH tokens
  const deadline = 999999999999999999n; // Deadline for the swap, in this case infinite
  const slippage = Slippage.fromPercentage("0.1"); // 0.1%
  const swapAmount = TokenAmount.fromHumanAmount(tokenOut, "1.2345678910");
  
  // API is used to fetch best swap paths from available liquidity across v2 and v3
  const balancerApi = new BalancerApi(
      "https://api-v3.balancer.fi/",
      chainId
  );
  
  const sorPaths = await balancerApi.sorSwapPaths.fetchSorSwapPaths({
      chainId,
      tokenIn: tokenIn.address,
      tokenOut: tokenOut.address,
      swapKind,
      swapAmount,
  });
  
  // Swap object provides useful helpers for re-querying, building call, etc
  const swap = new Swap({
      chainId,
      paths: sorPaths,
      swapKind,
  });
  
  console.log(
      `Input token: ${swap.inputAmount.token.address}, Amount: ${swap.inputAmount.amount}`
  );
  console.log(
      `Output token: ${swap.outputAmount.token.address}, Amount: ${swap.outputAmount.amount}`
  );
  
  // Get up to date swap result by querying onchain
  const updated = await swap.query(RPC_URL) as ExactOutQueryOutput;
  console.log('Required Amount In', updated.expectedAmountIn.amount.toString());
  
  let buildInput: SwapBuildCallInput;
  // In v2 the sender/recipient can be set, in v3 it is always the msg.sender
  if (swap.protocolVersion === 2) {
      buildInput = {
          slippage,
          deadline,
          queryOutput: updated,
          wethIsEth,
          sender: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
          recipient: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      };
  } else {
      buildInput = {
          slippage,
          deadline,
          queryOutput: updated,
          wethIsEth,
      };
  }
  
  const callData = swap.buildCall(buildInput) as SwapBuildOutputExactIn;
  
  console.log('calldata', callData);
    }
  
main().catch(console.error);