/*
 * SBS2 Frontend
 * Created on Sat May 02 2020
 *
 * Copyright (c) 2020 MasterR3C0RD
 */

import isEmail from "validator/lib/isEmail";
import isJWT from "validator/lib/isJWT";
import isLength from "validator/lib/isLength";
import isUUID from "validator/lib/isUUID";
import { API_CHAIN, API_ENTITY } from "../constants/ApiRoutes";
import { EntityType, ISearchQuery, IUserCredential, IUserSensitiveUpdate, Vote } from "../interfaces/API";
import { IChainedRequest, IDriver } from "../interfaces/Driver";
import { Dictionary } from "../interfaces/Generic";
import { IBase, IChainedResponse, IContent, IFile, IListenActionQuery, IListenChainResponse, IListenListenerQuery, IUserSelf, IView, IVote, IWatch } from "../interfaces/Views";
import { EventEmitter } from "./Event";
import APIRequest from "./Request";

function createChainStrings(chains: IChainedRequest<IView>[]): [string[], { [i in EntityType]?: (new (i: IView) => IView) }, { [i in EntityType]?: string[] }] {
    let requests: string[] = [];
    let constructors: { [i in EntityType]?: (new (i: IView) => IView) } = {};
    let fields: { [i in EntityType]?: string[] } = {};
    for (let i = 0; i < chains.length; i++) {
        let req = chains[i];
        let str = req.entity as string;


        if (req.constraint)
            for (let j = 0; j < req.constraint.length; j++)
                if (req.constraint[j].length > 0)
                    str += req.constraint[j].map(constr => `.${j}${constr}`).join("");

        if (req.query)
            str += "-" + JSON.stringify(req.query);

        requests.push(str);

        if (req.cons)
            constructors[req.entity] = req.cons;

        if (req.fields)
            fields[req.entity] = (fields[req.entity] || []).concat(req.fields as string[]).reduce((acc, r) => acc.indexOf(r) == -1 ? acc.concat([r]) : acc, [] as string[]);
    }

    return [requests, constructors, fields];
}

export class HTTPDriver extends EventEmitter implements IDriver {
    private tok?: string;
    public get token(): string {
        return this.tok || "";
    }
    public get uid(): number {
        return this.tok ? JSON.parse(atob(this.tok.split(".")[1])).uid : 0;
    }

    public constructor() {
        super();
        this.On("authenticated", this._manageListen.bind(this));
    }

    public async Authenticate(token?: string): Promise<boolean> {
        if (!token) {
            this.tok = undefined;
            this._Dispatch("authenticated", token);
            return true;
        }

        if (!isJWT(token))
            throw ["Invalid token."];

        try {
            await (
                new APIRequest<string>(`${API_ENTITY("User")}/me`)
                    .Method("GET")
                    .AddHeader("Authorization", `Bearer ${token}`)
                    .Execute()
            );

            this.tok = token;
            this._Dispatch("authenticated", token);
            return true;
        } catch (e) {
            console.error("Error occurred during authentication: ", e.join(", "));
            return false;
        }
    }

    public async Login({ username, email, password }: IUserCredential): Promise<true> {
        let token = await (
            new APIRequest<string>(`${API_ENTITY("User")}/authenticate`)
                .Method("POST")
                .AddFields({ username, email, password })
                .Execute());

        this.tok = token!;
        return true;
    }

    public async Register({ username, email, password }: IUserCredential): Promise<true> {
        if (!isEmail(email)) {
            throw ["Email is invalid."];
        } else if (!isLength(username, { min: 3, max: 20 })) {
            throw ["Username must be between 3 and 20 characters."];
        } else if (!isLength(password, { min: 8 })) {
            throw ["Password must be over 8 characters in length."];
        }

        await (
            new APIRequest<IUserSelf>(`${API_ENTITY("User")}/register`)
                .Method("POST")
                .AddFields({ username, email, password })
                .Execute()
        );

        await (
            new APIRequest<string>(`${API_ENTITY("User")}/register/sendemail`)
                .Method("POST")
                .AddField("email", email)
                .Execute()
        );

        return true;
    }

    public async Confirm(confirmationKey: string): Promise<true> {
        if (!isUUID(confirmationKey)) {
            throw ["Invalid confirmation key."];
        }

        let token = await (
            new APIRequest<string>(`${API_ENTITY("User")}/register/confirm`)
                .Method("POST")
                .AddField("confirmationKey", confirmationKey)
                .Execute()
        );
        this.tok = token!;
        return true;
    }

    public async Self(): Promise<IUserSelf | null> {
        if (!this.tok) {
            return null;
        }

        return await (
            new APIRequest<IUserSelf>(`${API_ENTITY("User")}/me`)
                .Method("GET")
                .AddHeader("Authorization", `Bearer ${this.token}`)
                .Execute()
        );
    }

    public async UpdateSensitive({ oldPassword, username, password, email }: Partial<IUserSensitiveUpdate>): Promise<true> {
        if (!this.tok) {
            throw ["You must be logged in to perform this action."];
        }
        if (!oldPassword) {
            throw ["Old password must be provided."];
        }
        if (username && !isLength(username, { min: 3, max: 20 })) {
            throw ["New username must be between 3 and 20 characters in length."];
        }
        if (password && !isLength(password, { min: 8 })) {
            throw ["New password must be at least 8 characters long."]
        }
        if (email && !isEmail(email)) {
            throw ["New email is invalid."];
        }

        await (
            new APIRequest<string>(`${API_ENTITY("User")}/sensitive`)
                .Method("POST")
                .AddHeader("Authorization", `Bearer ${this.token}`)
                .AddFields({ oldPassword, password, email, username })
                .Execute()
        );

        return true;
    }

    public async UpdateAvatar(id: number): Promise<true> {
        if (!this.tok) {
            throw ["You must be logged in to perform this action."];
        }

        await (
            new APIRequest<IUserSelf>(`${API_ENTITY("User")}/basic`)
                .Method("POST")
                .AddHeader("Authorization", `Bearer ${this.token}`)
                .AddField("avatar", id)
                .Execute()
        );

        return true;
    }

    public async ListVariables(): Promise<string[]> {
        if (!this.tok)
            return [];

        return (await (
            new APIRequest<string[]>(`${API_ENTITY("Variable")}`)
                .Method("GET")
                .AddHeader("Authorization", `Bearer ${this.token}`)
                .Execute()
        )) || [];
    }

    public async GetVariable(name: string): Promise<string | null> {
        if (!this.tok)
            return null;

        return (await (
            new APIRequest<string>(`${API_ENTITY("Variable")}/${name}`)
                .Method("GET")
                .AddHeader("Authorization", `Bearer ${this.token}`)
                .Execute()
        )) || null;
    }

    public async SetVariable(name: string, value: string): Promise<true> {
        if (!this.tok)
            throw ["You must be logged in to perform this action."];

        await (
            new APIRequest<string>(`${API_ENTITY("Variable")}/${name}`)
                .Method("POST")
                .AddHeader("Authorization", `Bearer ${this.token}`)
                .SetRawBody(JSON.stringify(value))
                .Execute()
        );

        return true;
    }

    public async DeleteVariable(name: string): Promise<true> {
        if (!this.tok)
            throw ["You must be logged in to perform this action."];

        await (
            new APIRequest<string>(`${API_ENTITY("Variable")}/${name}`)
                .Method("DELETE")
                .AddHeader("Authorization", `Bearer ${this.token}`)
                .Execute()
        );

        return true;
    }

    public async Create<T extends IBase>(type: EntityType, data: Partial<T>): Promise<T> {
        if (!this.tok) {
            throw ["You must be logged in to perform this action."];
        }

        const d = { ...data };
        delete d["id"];

        return (
            await (
                new APIRequest<T>(`${API_ENTITY(type)}`)
                    .Method("POST")
                    .AddHeader("Authorization", `Bearer ${this.token}`)
                    .AddFields(d as Partial<IView>)
                    .Execute()
            )
        )!;
    }

    public async Read<T extends IBase>(type: EntityType, query: Partial<ISearchQuery>, cons: new (data: T) => T): Promise<T[]> {
        let resp = (
            (
                await (
                    new APIRequest<T[]>(`${API_ENTITY(type)}`)
                        .Method("GET")
                        .AddHeader("Authorization", this.tok ? `Bearer ${this.token}` : undefined)
                        .AddFields(query as Dictionary<string | number | (string | number)[]>)
                        .Execute()
                )
            ) || []
        );

        if (!cons)
            return resp;
        else
            return resp.map(d => new cons(d));
    }

    public async Update<T extends IBase>(type: EntityType, data: Partial<T> & { id: number }): Promise<T | null> {
        if (!this.tok)
            throw ["You must be logged in to perform this action."];

        return (
            await (
                new APIRequest<T>(`${API_ENTITY(type)}/${data.id}`)
                    .Method("PUT")
                    .AddHeader("Authorization", `Bearer ${this.token}`)
                    .AddFields(data as IBase)
                    .Execute()
            )
        );
    }

    public async Delete<T extends IBase>(type: EntityType, data: Partial<T> & { id: number }): Promise<T | null> {
        if (!this.tok)
            throw ["You must be logged in to perform this action."];

        return (
            await (
                new APIRequest<T>(`${API_ENTITY(type)}/${data.id}`)
                    .Method("DELETE")
                    .AddHeader("Authorization", `Bearer ${this.token}`)
                    .Execute()
            )
        );
    }

    public async Upload(file: Blob): Promise<IFile> {
        if (!this.tok)
            throw ["You must be logged in to perform this action."];

        return (
            await (
                new APIRequest<IFile>(`${API_ENTITY("File")}`)
                    .Method("POST")
                    .AddHeader("Authorization", `Bearer ${this.token}`)
                    .AddFormField("file", file)
                    .Execute()
            )
        )!;
    }

    public async Chain(request: IChainedRequest<any>[], abort?: AbortSignal): Promise<IChainedResponse> {
        let [requests, constructors, fields] = createChainStrings(request);

        let response = (await (
            new APIRequest<IChainedResponse>(API_CHAIN)
                .Method("GET")
                .AddHeader("Authorization", this.tok ? `Bearer ${this.token}` : undefined)
                .AddField("requests", requests)
                .AddFields(fields)
                .Execute(abort)
        ))!;

        for (let key in response) {
            if (key in constructors) {
                response[key as EntityType] = (response[key as EntityType]! as IBase[]).map(res => new constructors[key as EntityType]!(res as IView)) as any;
            }
        }

        return response;
    }

    public async Vote(content: Partial<IContent> & { id: number }, vote: Vote | null): Promise<IVote | null> {
        if (!this.tok)
            throw ["You must be logged in to perform this action."];

        return (await (
            new APIRequest<IVote>(`${API_ENTITY("Vote")}/${content.id}${vote ? `/${vote}` : ""}`)
                .Method(vote ? "POST" : "DELETE")
                .AddHeader("Authorization", `Bearer ${this.token}`)
                .Execute()
        ));

    }

    public async Watch(content: Partial<IContent> & { id: number }): Promise<IWatch | null> {
        if (!this.tok)
            throw ["You must be logged in to perform this action."];

        return (await (
            new APIRequest<IWatch>(`${API_ENTITY("Watch")}/${content.id}`)
                .Method("POST")
                .AddHeader("Authorization", `Bearer ${this.token}`)
                .Execute()
        ));
    }

    public async Unwatch(content: Partial<IContent> & { id: number }): Promise<IWatch | null> {
        if (!this.tok)
            throw ["You must be logged in to perform this action."];

        return (await (
            new APIRequest<IWatch>(`${API_ENTITY("Watch")}/${content.id}`)
                .Method("DELETE")
                .AddHeader("Authorization", `Bearer ${this.token}`)
                .Execute()
        ));
    }

    public async ClearWatch(content: Partial<IContent> & { id: number }): Promise<IWatch | null> {
        if (!this.tok)
            throw ["You must be logged in to perform this action."];

        return (await (
            new APIRequest<IWatch>(`${API_ENTITY("Watch")}/${content.id}/clear`)
                .Method("POST")
                .AddHeader("Authorization", `Bearer ${this.token}`)
                .Execute()
        ));
    }

    private controller: AbortController = new AbortController();
    private queries: IChainedRequest<IView>[] = [];
    private listenStatus: Dictionary<Dictionary<string>> = {
        "0": {}
    };
    private lastId: number = -20;
    private connected: boolean = false;
    private status: Dictionary<string> = {};

    private async _manageListen(): Promise<unknown> {
        if (this.connected)
            return;

        if (this.tok == null)
            return this.controller.abort();

        this.controller = new AbortController();

        try {
            this.connected = true;
            let resp = await (
                new APIRequest<IListenChainResponse>(API_ENTITY('Read/listen'))
                    .Method("GET")
                    .AddHeader("Authorization", `Bearer ${this.tok}`)
                    .AddField("actions", JSON.stringify({
                        lastId: this.lastId,
                        statuses: this.status,
                        chains: createChainStrings(this.queries)[0]
                    } as IListenActionQuery))
                    .AddField("listeners", JSON.stringify({
                        lastListeners: this.listenStatus,
                        chains: ["user.0listeners"]
                    } as IListenListenerQuery))
                    .Execute(this.controller.signal)
            );

            if (resp != null) {
                this.lastId = resp.lastId;
                if (resp.listeners) {
                    this.listenStatus = resp.listeners;
                    await this._Dispatch("listener.listeners", resp.listeners);
                }
                if (resp.chains) {
                    await this._Dispatch("listener.chains", resp.chains);
                }
                if (resp.warnings.length > 0)
                    console.log("Warnings from listener: " + resp.warnings.join(", "));
            }
        } catch (e) {
            if (e?.name != "AbortError") {
                console.error(e instanceof Error
                    ? e.stack
                    : e);

                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        this.connected = false;
        return this._manageListen();
    }

    public get Listeners(): Dictionary<Dictionary<string>> {
        return this.listenStatus;
    }

    public SetStatus(status: string | null, id: number = 0): Dictionary<string> {
        if (status == null) {
            delete this.status[id];
            delete this.listenStatus[id];
        } else {
            this.status[id] = status;
            this.listenStatus[id] = {};
        }

        this.controller.abort();
        return this.status;
    }

    public SetListenChain(chain: IChainedRequest<IView>[]): IChainedRequest<IView>[] {
        this.queries = chain.slice();
        this.controller.abort();

        return this.queries;
    }
}