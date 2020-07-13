import { SubmittableExtrinsic, SubmittableResultSubscription } from "@polkadot/api/types";
import { KeyringPair } from "@polkadot/keyring/types";
import { EventRecord, Hash } from "@polkadot/types/interfaces";
import { SignatureOptions } from "@polkadot/types/types";

import { log } from "./log";

const deferred = <T>() => {
    const deferredObj: { promise: Promise<T>, resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void } = {} as any;
    // tslint:disable-next-line: promise-must-complete
    deferredObj.promise = new Promise<T>((resolve, reject) => {
        deferredObj.resolve = resolve;
        deferredObj.reject = reject;
    });
    return deferredObj;
};

/**
 * Sign and send transaction to substrate chain.
 */
export const sendTx = async (tx: SubmittableExtrinsic<"promise">, pair: KeyringPair, options?: Partial<SignatureOptions>) => {
    let send: SubmittableResultSubscription<"promise">;
    const finalized = deferred<{ events: EventRecord[], blockHash: Hash, txHash: Hash }>();
    const inBlock = deferred<{ events: EventRecord[], blockHash: Hash, txHash: Hash }>();
    const signed = await tx.signAsync(pair, options || {});
    log("[INFO] Sending transaction:", {
        from: pair.address.toString(),
        nonce: signed.nonce.toJSON(),
        method: `${signed.method.sectionName}.${signed.method.methodName}`,
        args: tx.args.map(x => x.toHuman()).join(", "),
        hash: signed.hash.toString(),
    });
    send = signed.send(res => {
        log(`[INFO] [${signed.hash.toHex().slice(0, 8)}...] ${res.status.toString()}`);
        if (res.isInBlock) {
            inBlock.resolve({ events: res.events, blockHash: res.status.asInBlock, txHash: signed.hash });
        } else if (res.isFinalized) {
            finalized.resolve({ events: res.events, blockHash: res.status.asFinalized, txHash: signed.hash });
        } else if (res.isError) {
            inBlock.reject(res.status.toJSON());
            finalized.reject(res.status.toJSON());
        }

    });
    send.catch(inBlock.reject);
    send.catch(finalized.reject);

    finalized
        .promise
        .finally(async () => {
            (await send)();
        })
        .catch(console.error);

    return {
        finalized: finalized.promise,
        inBlock: inBlock.promise,
        send,
    };
};
