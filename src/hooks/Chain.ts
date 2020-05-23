/*
 * SBS2 Frontend
 * Created on Mon May 18 2020
 *
 * Copyright (c) 2020 MasterR#C0RD
 */

import useAsync from "./Async";
import { IChainedRequest } from "../interfaces/Driver";
import { useCallback } from "react";
import { IChainedResponse } from "../interfaces/Views";

export default function useChain(request: () => (IChainedRequest<any>[] | null), dependencies: any[]) {
    return useAsync<IChainedResponse | null>(
        useCallback(() => {
            let req = request();
            if (req != null)
                return Intercept.Chain(req);
            else
                return Promise.resolve(null);
        }, dependencies)
    );
}
