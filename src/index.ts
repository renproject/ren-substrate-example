import { options } from "@acala-network/api";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { Keyring } from "@polkadot/keyring";

import { log, logEvents } from "./log";
import { handleBitcoinDeposit } from "./ren";
import { sendTx } from "./sendTx";

const config = {
    ws: "ws://localhost:9944",
    seed: "//Alice",
};

const main = async () => {
    // Configure API.
    const ws = new WsProvider(config.ws);
    const api = new ApiPromise(options({ provider: ws }));
    const keyring = new Keyring({ type: "sr25519" });
    await api.isReady;

    // Listen to events.
    logEvents(api);

    // Configure account.
    const pair = keyring.addFromUri(config.seed);
    const account = await api.query.system.account(pair.address);
    log(pair.address, account.data.free.toHuman());

    // Wait for bitcoin deposit and submit to RenVM.
    const mintResponse = await handleBitcoinDeposit();

    if (!mintResponse || !mintResponse.queryTxResult) {
        log("[ERROR] Missing ren_queryTx result.");
        return;
    }

    // Submit mint signature to substrate chain.
    await (await sendTx(api.tx.renToken.mint(
        mintResponse.queryTxResult.autogen.phash,
        parseInt(mintResponse.queryTxResult.autogen.amount, 10),
        mintResponse.queryTxResult.autogen.nhash,
        mintResponse.signature,
    ), pair)).finalized;
};

main()
    .catch(err => { console.error("Error:", err); })
    .finally(process.exit).catch(console.error);
