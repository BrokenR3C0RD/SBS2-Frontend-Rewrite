/*
 * SBS2 Frontend
 * Created on Fri May 22 2020
 *
 * Copyright (c) 2020 MasterR#C0RD
 */

import { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import { TransmittedCache, CacheDriver } from "../../classes/CacheDriver";
import { IChainedRequest } from "../../interfaces/Driver";
import { Dictionary } from "../../interfaces/Generic";

const ENV = typeof process === "undefined" ? false : !process.browser;

export default function withCache<T extends { cache: TransmittedCache }>(Component: React.FunctionComponent<T>, request: (params: Dictionary<string | string[] | undefined>) => IChainedRequest<unknown>[]): [React.FunctionComponent<T>, GetServerSideProps<{ cache: TransmittedCache }>] {
    let wrapped: React.FunctionComponent<T> = function ({
        cache,
        ...props
    }: {
        cache: TransmittedCache
    }) {
        const [tcache, setTcache] = useState<TransmittedCache>();

        useEffect(() => {
            if (cache != null && JSON.stringify(cache) !== JSON.stringify(tcache)) {
                Intercept.LoadTransmittedCache(cache);
                setTcache(cache);
            }
        }, [cache]);

        return (cache && (ENV || tcache)) ? <Component cache={ENV ? cache : tcache} {...props as T} /> : null;
    };

    let getServerSideProp = (async context => {
        global.Intercept = new CacheDriver();

        if (context.req.url!.substr(-5) === ".json"){
            console.log("Not sending cached data.");
            return { props: { cache: {} } };
        }

        const params = context.query;
        try {
            await Intercept.Chain(request(params));
            return { props: { cache: await Intercept.CreateTransmittableCache() } };
        } catch (e) {
            console.error("Failure loading precache: " + e.stack);
            return { props: { cache: {} } };
        }
    }) as GetServerSideProps<{
        cache: TransmittedCache
    }>;

    return [wrapped, getServerSideProp];
}