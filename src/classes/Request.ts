/*
 * SBS2 Frontend
 * Created on Fri May 01 2020
 *
 * Copyright (c) 2020 MasterR3C0RD
 */

import { Dictionary } from "../interfaces/Generic";
import { IView } from "../interfaces/Views";

type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export default class APIRequest<T> {
    private url: URL;
    private cons?: new (data: any) => T;
    private method: Method = "GET";
    private data: Dictionary<(string | number | boolean) | (string | number)[]> = {};
    private headers: Dictionary<string> = {};
    private formData?: FormData;
    private rawBody?: string;

    public constructor(loc: string, constructor?: new (data: any) => T) {
        this.url = new URL(window.location.protocol + loc);
        this.cons = constructor;
    }

    public AddHeader(name: string, value: string | undefined): this {
        if(value)
            this.headers[name] = value;
        else
            delete this.headers[name];
        
        return this;
    }

    public AddField(name: string, value: (string | number | boolean) | (string | number)[]): this {
        this.data[name] = value;
        return this;
    }

    public AddFields(dict: Dictionary<(string | number | boolean) | (string | number)[] | Dictionary<(string | number | boolean) | (string | number)[]> | undefined> | Partial<IView>): this {
        this.data = {
            ...this.data
        };
        for(let key in dict){
            if((dict as any)[key] != null){
                this.data[key] = (dict as any)[key];
            }
        }
        return this;
    }

    public AddFormField(name: string, value: string | Blob): this {
        if(!this.formData)
            this.formData = new FormData();
        
        this.formData.append(name, value);
        return this;
    }

    public SetRawBody(value: string){
        this.rawBody = value;
        return this;
    }

    public Method(method: Method): this {
        this.method = method;
        return this;
    }

    public async Execute(signal?: AbortSignal): Promise<T | null> {
        let n = new URL(this.url.toString());

        if (this.method == "GET" || this.formData) {
            for (let key in this.data) {
                if (this.data[key] instanceof Array) {
                    (this.data[key] as Array<string | number>).forEach(value => n.searchParams.append(key, value.toString()));
                } else {
                    n.searchParams.append(key, this.data[key].toString());
                }
            }
        }

        const hasBody = this.method !== "GET" && this.method !== "DELETE";

        try {
            let response = await fetch(n.toString(), {
                signal,
                headers: {
                    "Content-Type": this.formData ? "application/json" : "multipart/form-data",
                    "Accept": "application/json",
                    ...this.headers
                },
                body: hasBody ? this.rawBody || this.formData || JSON.stringify(this.data) : null
            });

            if (response.status == 200) {
                if (this.cons)
                    return new (this.cons)(await response.json());
                else
                    return (await response.json() as T);
            } else if(response.status == 404){
                return null;
            } else {
                let err = await response.json();
                if (typeof err == "string") {
                    // Since Random hasn't switched everything to a JSON object yet, we still have to be able to deal with string errors.
                    throw [err];
                } else {
                    // This is a .NET validation error, which has a property, errors, which contains the validation error messages.
                    let errorData: Dictionary<string[]> = err.errors;
                    throw Object
                        .keys(errorData)
                        .map(key => `[${key}] ${errorData[key].join(", ")}`);
                }
            }
        } catch (e) {
            console.error("An error occurred during a request: " + (e?.stack || e.toString()));
            if (e instanceof Error)
                throw [e.stack];
            else
                throw e;
        }
    }
}