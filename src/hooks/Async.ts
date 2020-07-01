/*
 * SBS2 Frontend
 * Created on Tue May 05 2020
 *
 * Copyright (c) 2020 MasterR#C0RD
 */

import { useState, useEffect } from "react";

/**
 * Turns a promise into a hook that returns the error and the result
 * @param promise The promise to evaluate
 * @returns [ Error, Result ]
 */
export default function useAsync<T>(promise: () => Promise<T>, deps: any[] = []): [any, T | null | undefined] {
    const [result, setResult] = useState<T | null>();
    const [error, setError] = useState<any>();
    const [lpromise, setlPromise] = useState<Promise<T>>();

    useEffect(() => {
        try {
            if (!lpromise) {
                setlPromise(promise());
            }
        } catch (e) { if (e != null) console.error(e.stack); }
    }, [promise]);

    useEffect(() => {
        console.log(deps);
        try {
            setlPromise(promise());
            setResult(undefined);
        } catch (e) { if (e != null) console.error(e.stack); }
    }, deps);

    useEffect(() => {
        if (!result && lpromise) {
            lpromise
                .then(res => { setResult(() => res) })
                .catch(err => { setError(err); setResult(null) });
        }
    }, [lpromise]);

    return [error, result];
}