import { ApiPromise } from "@polkadot/api";

const Reset = "\x1b[0m";
const FgGreen = "\x1b[32m";
const FgRed = "\x1b[31m";

const detectTag = (str: string) => {
    const [, tag, msg] = str.match(/(\[[A-Za-z0-9\.:]+\])? ?(.*)/) as string[];
    if (tag) {
        str = `${tag === "[ERROR] " ? FgRed : FgGreen}${tag}${Reset}\t${detectTag(msg)}`;
    }
    return str;
};

/**
 * Very simple log with log levels highlighted.
 */
export const log = (...x: unknown[]) => {
    // tslint:disable-next-line: prefer-const
    let [first, ...rest] = x;
    if (first && typeof first === "string") {
        first = detectTag(first);
    }
    // tslint:disable-next-line: no-console
    console.log(first, ...rest);
};

/**
 * Log all events from a substrate chain.
 * @param api Polkadot API instance.
 */
export const logEvents = (api: ApiPromise) => {
    // Subscribe to system events via storage
    api.query.system.events((events) => {
        // Loop through the Vec<EventRecord>
        events.forEach((record) => {
            // log(`[${i + 1}/${events.length}]:`, record);

            // Extract the phase, event and the event types
            const { event } = record;
            const types = event.typeDef;

            // Show what we are busy with
            log(`[EVENT] [${event.section}:${event.method}]`);
            log(`\t${event.meta.documentation.toString()}`);

            // Loop through each of the parameters, displaying the type and data
            event.data.forEach((data, index) => {
                log(`\t${types[index].type}: ${data.toString()}`);
            });
        });
    })
        .catch(console.error);
};
