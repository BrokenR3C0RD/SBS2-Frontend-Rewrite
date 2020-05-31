/*
 * SBS2 Frontend
 * Created on Mon May 18 2020
 *
 * Copyright (c) 2020 MasterR#C0RD
 */

import useAsync from "./Async";
import { IChainedRequest } from "../interfaces/Driver";
import { useCallback, useState, useEffect, useReducer, Reducer } from "react";
import { IChainedResponse, IBase } from "../interfaces/Views";
import { CacheItem, ChainCacheResponse, CachedChainRequest } from "../classes/CacheDriver";
import equal from "deep-equal";
import { EntityType } from "../interfaces/API";

export default function useChain(request: () => (IChainedRequest<any>[] | null), dependencies: any[]) {
    const [data, setData] = useState<IChainedResponse>();
    const [items, setItems] = useState<ChainCacheResponse<CacheItem<IBase>>>();
    const [chained, setChained] = useState<CachedChainRequest>();
    const [req, setReq] = useState<IChainedRequest[]>();
    const [response, setResponse] = useState<ChainCacheResponse<IBase>>();

    const [lastDeps, setLastDeps] = useState<any[]>(dependencies)

    useEffect(() => {
        if (!equal(lastDeps, dependencies)) {
            setData(undefined);
            setItems(undefined);
            setChained(undefined);
            setResponse(undefined);
            setLastDeps(dependencies);
        }
    }, dependencies)

    let [, res] = useAsync<IChainedResponse | null>(useCallback(() => {
        try {
            let req = request();
            console.log(req);
            if (req != null) {
                setReq(req);
                return Intercept.Chain(req);
            } else
                return Promise.resolve(null);
        } catch (e) { e != null && console.error(e); throw null; }
    }, dependencies));

    useEffect(() => {
        if (req != null && res != null && !equal(data, res)) {
            setData(res);
            let chained = Intercept.GetChainedRequest(req);
            setChained(chained);
        }
    }, [res, req]);

    useEffect(() => {
        if (chained) {
            let ref2 = chained.On("update", async (nr) => {
                setResponse(resp => !equal(resp, nr) ? nr as IChainedResponse : resp);
            });
            chained.UpdateRefCount(1);
            setChained(chained);
            return () => { chained.Off("update", ref2); chained.UpdateRefCount(-1); }
        }
    }, [chained]);

    useEffect(() => {
        let nitems: ChainCacheResponse<CacheItem<IBase>> | null = null;
        if (!items && data != null) {
            nitems = {};
            for (let key in data) {
                const type = key as EntityType;
                let items = Intercept.GetCacheItems(type, (data[type] as IBase[]).map(d => d.id)).filter(v => v != null);
                nitems[type] = items;
                // Updating every item = bad idea
                // Just redo the entire chain when it's time
                /*items.forEach(item => {
                    item.On("expired", async () => {
                        setUpdate(update => !update);
                    });
                    item.UpdateRefCount(1)
                });*/
            }
            setItems(nitems);
        }
        if (res != null && (items != null || nitems != null)) {
            nitems = items ?? nitems ?? {};
            (async () => {
                let resp: ChainCacheResponse<IBase> = {};
                for (let key in nitems) {
                    const type = key as EntityType;
                    let items = nitems[type]!;
                    resp[type] = resp[type] || [];
                    if (items.length == 0) {
                        let resItems = res![type]! as IBase[];
                        for (let i = 0; i < resItems.length; i++) {
                            resp[type]!.push(resItems[i]);
                        }
                    } else {
                        for (let i = 0; i < items.length; i++) {
                            let item = items[i];
                            let nval = await item.AwaitValue();
                            if (nval) resp[type]!.push(nval);
                        }
                    }
                }
                setResponse(res => {
                    console.log("Checking ", resp, res, equal(res, resp));
                    return !equal(res, resp) ? resp : res
                });
            })();
        }
    }, [data, items]);

    console.log("actual hook returning", response);
    return response;
}
