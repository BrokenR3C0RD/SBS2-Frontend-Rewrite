/*
 * SBS2 Frontend
 * Created on Sun May 10 2020
 *
 * Copyright (c) 2020 MasterR#C0RD
 */

import useAsync from "./Async";
import { Category } from "../classes/Category";

const useTree = (name: string): [any, Category | undefined | null] => {
    return useAsync(async () => {
        let t = await Category.GlobalTree();
        return t.find(cat => cat.name == name) || null;
    });
}

const useCategory = (cid: number): [any, Category | undefined | null] => {
    return useAsync(async () => {
        return await (await Category.Get({ ids: [cid] }))?.[0];
    });
}

export { useTree, useCategory }