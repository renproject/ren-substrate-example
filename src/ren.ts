
import { renTestnet } from "@renproject/networks";
import RenJS from "@renproject/ren";
import BigNumber from "bignumber.js";

import { log } from "./log";

/**
 * handleBitcoinDeposit generates a bitcoin deposit address, waits for a deposit
 * and then submit its to RenVM. When RenVM has generated
 */
export const handleBitcoinDeposit = async () => {

    // Instantiate RenJS. The parameters for testnet are used, but a testing
    // RenVM deployment is used instead of the standard testnet RenVM, to
    // avoid requiring confirmations. Remove `lightnode` to test against the
    // real testnet RenVM.
    const renJS = new RenJS({ ...renTestnet, lightnode: "https://mock-renvm.herokuapp.com/" });

    const mint = renJS.lockAndMint({
        // Send BTC from the Bitcoin blockchain to the Ethereum blockchain.
        sendToken: RenJS.Tokens.BTC.Btc2Eth,

        // Recipient
        // TODO: decode AccountID once pallet is fixed to use signed sender.
        // Currently hard-coded to Alice's address in hex.
        sendTo: "d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d",

        // Nonce. This must be stored to resume a transfer after refreshing the page.
        nonce: renJS.utils.randomNonce(),

        // Empty payload. On Ethereum, this is used to specify a smart contract
        // to be called.
        contractFn: "mint",
        contractParams: [],
    });

    // Generate gateway address. This is a deterministic process based on the
    // inputs of `mint`.
    const gatewayAddress = await mint.gatewayAddress();

    log("");
    log(`[INFO] Gateway address: ${gatewayAddress}`);
    log(`[INFO] Waiting for deposit... (Faucet: https://testnet-faucet.mempool.co/)`);

    // Wait for a deposit.
    const tx = await new Promise<{ utxo: any }>(resolve => mint.wait(0)
        .on("deposit", (deposit: any) => {
            log(`[INFO] Received ${new BigNumber(deposit.utxo.amount).div(1e8).toFixed()} BTC (${deposit.utxo.txHash.slice(0, 10)})!`); resolve(deposit);
        }));

    log(`[INFO] Submitting to RenVM...`);

    // Submit to RenVM and wait for response.
    const res = await mint.submit(tx.utxo);

    log(`[INFO] Received mint signature from RenVM. Submitting to substrate...`);

    return res;
};
