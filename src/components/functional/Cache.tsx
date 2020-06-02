/*
 * SBS2 Frontend
 * Created on Fri May 22 2020
 *
 * Copyright (c) 2020 MasterR#C0RD
 */

import { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import { CacheDriver, ChainCacheResponse } from "../../classes/CacheDriver";
import { IChainedRequest } from "../../interfaces/Driver";
import { Dictionary } from "../../interfaces/Generic";
import { IBase } from "../../interfaces/Views";

const ENV = typeof process === "undefined" ? false : !process.browser;

export default function withCache<T extends { preload?: ChainCacheResponse<IBase> }>(Component: React.FunctionComponent<T>, request: (parts: { [i: string]: string | string[] | undefined }) => IChainedRequest[]): [React.FunctionComponent<T>, GetServerSideProps<{ preload?: ChainCacheResponse<IBase> }>] {
    const comp = (({
        ...props
    }) => {
        if (props.preload === undefined)
            return null;

        props.preload = props.preload ?? undefined;

        return <Component {...props} />
    }) as React.FunctionComponent<T & { preload?: ChainCacheResponse<IBase> }>;

    const getServerSideProps: GetServerSideProps<{ preload?: ChainCacheResponse<IBase> }> = async (ctx) => {
        return {
            props: {
                preload: (await Intercept.Chain(request(ctx.query))) ?? null
            }
        }
    }

    return [comp, getServerSideProps];
}