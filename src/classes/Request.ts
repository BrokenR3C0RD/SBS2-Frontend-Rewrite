/*
 * SBS2 Frontend
 * Created on Fri May 01 2020
 *
 * Copyright (c) 2020 MasterR3C0RD
 */

import { Dictionary } from "../interfaces/Generic";

type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export default class APIRequest<T> {
    private url: URL;
    private cons: new (data: any) => T;
    private method: Method = "GET";
    private data: Dictionary<(string | number | boolean) | (string | number)[]> = {};
    private headers: Dictionary<string> = {};

    public constructor(loc: string, constructor: new (data: any) => T) {
        this.url = new URL(window.location.protocol + loc);
        this.cons = constructor;
    }

    public AddHeader(name: string, value: string): this {
        this.headers[name] = value;
        return this;
    }

    public AddField(name: string, value: (string | number | boolean) | (string | number)[]): this {
        this.data[name] = value;
        return this;
    }

    public AddFields(dict: Dictionary<(string | number | boolean) | (string | number)[]>): this {
        this.data = {
            ...this.data,
            ...dict
        };
        return this;
    }

    public Method(method: Method): this {
        this.method = method;
        return this;
    }

    public async Fetch(signal?: AbortSignal): T {
        let n = new URL(this.url.toString());
        
        if(this.method == "GET"){
            for(let key in this.data){
                if(this.data[key] instanceof Array){
                    (this.data[key] as Array<string | number>).forEach(value => n.searchParams.append(key, value.toString()));
                } else {
                    n.searchParams.append(key, this.data[key].toString());
                }
            }
        }

        const hasBody = this.method !== "GET" && this.method !== "DELETE";

        let response = await fetch(n.toString(), {
            signal,
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                ...this.headers
            },
            body: hasBody ? JSON.stringify(this.data) : null
        });
    }
}