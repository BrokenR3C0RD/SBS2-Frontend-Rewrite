/*
 * SBS2 Frontend
 * Created on Tue May 05 2020
 *
 * Copyright (c) 2020 MasterR#C0RD
 */

import { FullUser } from "../classes/User";
import useSWR from "swr";
import { useState, useEffect } from "react";

export function useSelf(){
    const [self, setSelf] = useState<FullUser | null>();
    
    const {data: view, mutate} = useSWR("user-self", () => Intercept.Self());

    useEffect(() => {
        if(view){
            setSelf(new FullUser(view));
        } else if(view !== undefined){
            setSelf(null);
        }
    }, [view]);

    useEffect(() => {
        const id = Intercept.On("authenticated", async () => {
            mutate(await Intercept.Self(), false);
        });
        return () => Intercept.Off("authenticated", id);
    }, []);

    return self;
}