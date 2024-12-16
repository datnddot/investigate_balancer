import { ethers } from 'ethers';
import 'dotenv/config'

const rpcUrl = process.env.RPC_URL
const pk: string = process.env.PK as string

async function run() {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const senderWallet = new ethers.Wallet(pk, provider);
  console.log(senderWallet.address)

  //send tx
  const tx = {
    to: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
    data: `0x52bbbe2900000000000000000000000000000000000000000000000000000000000000e00000000000000000000000008088ab972ad9cf061f0dc98b621de2969b3c2fe700000000000000000000000000000000000000000000000000000000000000000000000000000000000000008088ab972ad9cf061f0dc98b621de2969b3c2fe7000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000027160000000000000000000000000000000000000000000000000de0b6b3a763ffff9da11ff60bfc5af527f58fd61679c3ac98d040d900000000000000000000010000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000b2c639c533813f4aa9d7837caf62653d097ff8500000000000000000000000094b008aa00579c1307b0ef2c499ad98a8ce58e58000000000000000000000000000000000000000000000000000000000000271000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000`,
    value: '0'
  }



  const result =  await senderWallet.sendTransaction(tx)
  console.log(result)
}

run();