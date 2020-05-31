/*
 * SBS2 Frontend
 * Created on Tue May 26 2020
 *
 * Copyright (c) 2020 MasterR#C0RD
 */

import { IDriver, IChainedRequest } from "../interfaces/Driver";
import { HTTPDriver } from "./HTTPDriver";
import { EventEmitter } from "./Event";
import { IBase, IEvent, ICategory, IComment, ICommentAggregate, IContent, IFile, IUser, IUserSelf, IChainedResponse } from "../interfaces/Views";
import { Dictionary } from "../interfaces/Generic";
import { EntityType, ISearchQuery, IUserCredential, IUserSensitiveUpdate } from "../interfaces/API";
import equal from "deep-equal";

export class CacheItem<T extends IBase> extends EventEmitter implements IBase {
    public value: T | null;
    public id: number = NaN;
    private refs: number = 0;
    private updateInterval: number;
    private updateTimeout: number = NaN;
    public expired: boolean = false;

    public constructor(value: T | null, updateInterval: number = 30000) {
        super();
        this.value = value;
        this.id = value?.id ?? NaN;
        this.updateInterval = updateInterval;
        this.AddTimeout();
    }

    public AddTimeout(force: boolean = false) {
        if (force) {
            clearTimeout(this.updateTimeout);
            this.updateTimeout = NaN;
        }
        if (this.refs > 0 && isNaN(this.updateTimeout)) {
            this.updateTimeout = setInterval(() => { this.expired = true; this.refs > 0 && this._Dispatch("expired"); }, this.updateInterval) as unknown as number;
        }
    }

    public async Update(value: T | null) {
        if (this.value != value && !equal(this.value, value)) {
            this.value = value;
        }
        this.expired = false;
        this.AddTimeout(true);
        return this._Dispatch("update", value);
    }

    public UpdateRefCount(delta: number = 1) {
        this.refs += delta;
        this.AddTimeout(true);
    }

    public async AwaitUpdate() {
        this.UpdateRefCount(1)
        await this.ResolveOn("update");
        this.UpdateRefCount(-1);
        return this.value;
    }

    public async AwaitValue() {
        this.UpdateRefCount(1)
        if (this.value == null || this.expired) {
            await this.ResolveOn("update");
        }
        this.UpdateRefCount(-1);
        return this.value;
    }

    public async Destruct() {
        await this._Dispatch("delete");
        this.value = null;
        return null;
    }
}

function hashRequest(type: EntityType, req: Partial<ISearchQuery>) {
    let str = `${type.toLowerCase()}`;
    let keys = Object.keys(req);
    for (let i = 0; i < keys.length; i++) {
        str += "#" + keys[i] + "=" + JSON.stringify(req[keys[i] as keyof ISearchQuery]);
    }
    return str;
}

function hashChain(request: IChainedRequest[]) {
    let hash = "";
    for (let i = 0; i < request.length; i++) {
        hash += `${i}+${hashRequest(request[i].entity, request[i].query || {})}-${request[i].constraint?.join(",") || ""},`
    }
    return hash;
}

export class CachedRequest extends EventEmitter {
    public type: EntityType;
    public request: Partial<ISearchQuery>;
    public response: number[];
    private updateInterval: number;
    private refs: number = 0;
    private updateTimeout: number = NaN;
    public expired: boolean = false;

    public constructor(type: EntityType, request: Partial<ISearchQuery>, response: number[], updateInterval: number = 30000) {
        super();
        this.type = type;
        this.request = request;
        this.response = response;
        this.updateInterval = updateInterval;
        this.AddTimeout();
    }

    public AddTimeout(force: boolean = false) {
        if (force) {
            clearTimeout(this.updateTimeout);
            this.updateTimeout = NaN;
        }
        if (this.refs > 0 && isNaN(this.updateTimeout)) {
            this.updateTimeout = setInterval(() => { this.expired = true; this.refs > 0 && this._Dispatch("expired"); }, this.updateInterval) as unknown as number;
        }
    }
    public async Update(value: number[]) {
        this.response = value;
        this.expired = false;
        this.AddTimeout(true);

        await this._Dispatch("update", value);
    }

    public UpdateRefCount(delta: number = 1) {
        this.refs += delta;
        this.AddTimeout(true);

    }

    public async AwaitUpdate() {
        this.refs++;
        await this.ResolveOn("update");
        this.refs--;
        return this.response;
    }

    public async Destruct() {
        await this._Dispatch("delete");
        this.UpdateRefCount(-this.refs);
        this.response = [];
        return null;
    }

    public async AwaitValue() {
        this.UpdateRefCount(1)
        if (this.expired) {
            await this.ResolveOn("update");
        }
        this.UpdateRefCount(-1);
        return this.response;
    }
}

export class CachedChainRequest extends EventEmitter {
    public request: Partial<IChainedRequest[]>;
    public response: ChainCacheResponse;
    private updateInterval: number;
    private refs: number = 0;
    private updateTimeout: number = NaN;
    public expired: boolean = false;

    public constructor(request: IChainedRequest[], response: ChainCacheResponse, updateInterval: number = 30000) {
        super();
        this.request = request;
        this.response = response;
        this.updateInterval = updateInterval;
        this.AddTimeout();
    }

    public AddTimeout(force: boolean = false) {
        if (force) {
            clearTimeout(this.updateTimeout);
            this.updateTimeout = NaN;
        }
        if (this.refs > 0 && isNaN(this.updateTimeout)) {
            this.updateTimeout = setInterval(() => { this.expired = true; this.refs > 0 && this._Dispatch("expired"); }, this.updateInterval) as unknown as number;
        }
    }
    public async Update(value: ChainCacheResponse) {
        this.response = value;
        this.expired = false;
        this.AddTimeout(true);
        await this._Dispatch("update", value);
    }

    public UpdateRefCount(delta: number = 1) {
        this.refs += delta;
        this.AddTimeout(true);
    }

    public async AwaitUpdate() {
        this.refs++;
        await this.ResolveOn("update");
        this.refs--;
        return this.response;
    }

    public async Destruct() {
        await this._Dispatch("delete");
        this.UpdateRefCount(-this.refs);
        return null;
    }

    public async AwaitValue() {
        this.UpdateRefCount(1)
        if (this.expired) {
            await this.ResolveOn("update");
        }
        this.UpdateRefCount(-1);
        return this.response;
    }
}

type Cache = {
    [EntityType.Activity]: Dictionary<CacheItem<IEvent>>,
    [EntityType.Category]: Dictionary<CacheItem<ICategory>>,
    [EntityType.Comment]: Dictionary<CacheItem<IComment>>,
    [EntityType.CommentAggregate]: Dictionary<CacheItem<ICommentAggregate>>,
    [EntityType.Content]: Dictionary<CacheItem<IContent>>,
    [EntityType.File]: Dictionary<CacheItem<IFile>>,
    [EntityType.User]: Dictionary<CacheItem<IUser>>
}

type RequestCache = {
    [EntityType.Activity]: Dictionary<CachedRequest>,
    [EntityType.Category]: Dictionary<CachedRequest>,
    [EntityType.Comment]: Dictionary<CachedRequest>,
    [EntityType.CommentAggregate]: Dictionary<CachedRequest>,
    [EntityType.Content]: Dictionary<CachedRequest>,
    [EntityType.File]: Dictionary<CachedRequest>,
    [EntityType.User]: Dictionary<CachedRequest>
}

type ChainCache = {
    [i: string]: CachedChainRequest;
}

export type ChainCacheResponse<T = number> = {
    [i in EntityType]?: T[]
}

export class CacheDriver extends EventEmitter implements IDriver {
    private currentDriver: IDriver = new HTTPDriver();
    private cache: Cache = {
        [EntityType.Activity]: {},
        [EntityType.Category]: {},
        [EntityType.Comment]: {},
        [EntityType.CommentAggregate]: {},
        [EntityType.Content]: {},
        [EntityType.File]: {},
        [EntityType.User]: {}
    }
    private reqcache: RequestCache = {
        [EntityType.Activity]: {},
        [EntityType.Category]: {},
        [EntityType.Comment]: {},
        [EntityType.CommentAggregate]: {},
        [EntityType.Content]: {},
        [EntityType.File]: {},
        [EntityType.User]: {}
    }
    private chaincache: ChainCache = {}

    public token: string = "";

    public constructor(token?: string) {
        super();

        this.On("authenticated", async (token) => {
            if (token == "") {
                await this._Dispatch("user-self", null);
            } else {
                await this.Self();
            }
        });

        this.Authenticate(token);
    }

    private _cacheItem<T extends IBase>(type: EntityType, value: T, dontUpdateAlone: boolean = false) {
        let id = value.id;
        if (this.cache[type][id]) {
            this.cache[type][id].Update(value as any);
        } else {
            this.cache[type][id] = new CacheItem(value as any);
            if (!dontUpdateAlone)
                this.cache[type][id].On("expired", async () => {
                    await this.Read(type, { ids: [id] });
                });
        }
        return this.cache[type][id];
    }

    private _cacheRequest<T extends IBase>(type: EntityType, request: Partial<ISearchQuery>, value: T[]) {
        let hash = hashRequest(type, request);
        for (let i = 0; i < value.length; i++) {
            this._cacheItem(type, value[i]);
        }
        if (this.reqcache[type][hash]) {
            this.reqcache[type][hash].Update(value.map(v => v.id));
        } else {
            this.reqcache[type][hash] = new CachedRequest(type, request, value.map(v => v.id));
            this.reqcache[type][hash].On("expired", async () => {
                await this.Read(type, request);
            });
        }
        return this.reqcache[type][hash];
    }

    private _cacheChain(request: IChainedRequest[], response: IChainedResponse) {
        let hash = hashChain(request);
        let data: ChainCacheResponse = {};
        for (let key in response) {
            data[key as EntityType] = (response[key as EntityType] as IBase[]).map((t: IBase) => t.id);
            if (!request.some(req => req.entity == key && (req.fields || []).length > 0))
                response[key as EntityType].forEach((item: IBase) => this._cacheItem(key as EntityType, item));
        }
        if (this.chaincache[hash]) {
            this.chaincache[hash].Update(data);
        } else {
            this.chaincache[hash] = new CachedChainRequest(request, data);
            this.chaincache[hash].On("expired", async () => {
                console.log("data expired");
                this.Chain(request);
            });
        }
        return this.chaincache[hash];
    }

    public async Authenticate(token?: string) {
        let res = await this.currentDriver.Authenticate(token);
        if (res) {
            this.token = token ?? "";
            await this._Dispatch("authenticated", token);
        }
        return res;
    }

    public async Login(creds: Partial<IUserCredential>): Promise<true> {
        await this.currentDriver.Login(creds);
        this.token = this.currentDriver.token ?? "";
        await this._Dispatch("authenticated", this.token);

        return true;
    }

    public async Register(creds: IUserCredential): Promise<true> {
        return await this.currentDriver.Register(creds);
    }

    public async Confirm(token: string): Promise<true> {
        await this.currentDriver.Confirm(token);
        this.token = this.currentDriver.token ?? "";
        await this._Dispatch("authenticated", this.token);

        return true;
    }

    public async Self(): Promise<IUserSelf | null> {
        let res = await this.currentDriver.Self();
        await this._Dispatch("user-self", res);
        return res;
    }

    public async UpdateSensitive(update: Partial<IUserSensitiveUpdate>): Promise<true> {
        await this.currentDriver.UpdateSensitive(update);
        await this.Self();

        return true;
    }

    public async UpdateAvatar(avatar: number): Promise<true> {
        await this.currentDriver.UpdateAvatar(avatar);
        await this.Self();

        return true;
    }

    public async ListVariables() {
        return this.currentDriver.ListVariables();
    }

    public async GetVariable(name: string) {
        return this.currentDriver.GetVariable(name);
    }

    public async SetVariable(name: string, value: string) {
        return this.currentDriver.SetVariable(name, value);
    }

    public async DeleteVariable(name: string) {
        return this.currentDriver.DeleteVariable(name);
    }

    public async Create<ICategory>(type: EntityType.Category, data: Partial<ICategory>): Promise<ICategory>;
    public async Create<IComment>(type: EntityType.Comment, data: Partial<IComment>): Promise<IComment>;
    public async Create<IContent>(type: EntityType.Content, data: Partial<IContent>): Promise<IContent>;

    public async Create<T extends IBase>(type: EntityType, data: Partial<T>): Promise<T> {
        let res = await this.currentDriver.Create(type, data);
        this._cacheItem(type, res);
        await this._Dispatch("create", type, res);

        return res;
    }

    public async Read<T extends IBase, U extends T = T>(type: EntityType, query: Partial<ISearchQuery>, cons: (new (inp: T) => U) | boolean = false): Promise<U[]> {
        const queryKeys = Object.keys(query);
        let results: T[] = [];

        if (queryKeys.length == 1 && queryKeys[0].toLowerCase() == "ids") {
            let ids = query.ids!;
            let uncached: number[] = [];

            for (let i = 0; i < ids.length; i++) {
                if (this.cache[type][ids[i]] && !this.cache[type][ids[i]].expired) {
                    results.push((await this.cache[type][ids[i]].AwaitValue())! as IBase as T);
                } else {
                    this.cache[type][ids[i]] = new CacheItem<any>(null);
                    uncached.push(ids[i]);
                }
            }

            if (uncached.length > 0) {
                let data: T[] = await this.currentDriver.Read(type, { ids: uncached });
                for (let i = 0; i < data.length; i++) {
                    this._cacheItem(type, data[i]);
                }
                results = results.concat(data);
            }
        } else {
            let hash = hashRequest(type, query);
            if (this.reqcache[type][hash]) {
                let ids: number[] = await this.reqcache[type][hash].AwaitValue();
                results = results.concat(await this.Read(type, { ids }));
            } else {
                let data: T[] = await this.currentDriver.Read(type, query);
                this._cacheRequest(type, query, data);
                results = results.concat(data)
            }
        }

        await this._Dispatch("read", type, query, results);
        if (typeof cons == "function") {
            results = results.map(d => new cons(d));
        } else if (cons) {
            results = results.map(d => this.cache[type][d.id]) as unknown as U[];
        }

        return results as U[];
    }

    public async Update<T extends IBase>(type: EntityType, data: Partial<T> & { id: number }): Promise<T | null> {
        let res = await this.currentDriver.Update(type, data);
        if (res) {
            this._cacheItem(type, res);
            await this._Dispatch("update", type, res);
        }

        return res;
    }

    public async Delete<T extends IBase>(type: EntityType, data: Partial<T> & { id: number }): Promise<T | null> {
        let res = await this.currentDriver.Delete(type, data);
        if (res) {
            await this.cache[type][res.id]?.Destruct();
            delete this.cache[type][res.id];
            await this._Dispatch("delete", type, res);
        }

        return res;
    }

    public async Upload(file: Blob): Promise<IFile> {
        let res = await this.currentDriver.Upload(file);
        await this._cacheItem(EntityType.File, res);
        return res;
    }

    public async Chain(request: IChainedRequest<any>[], abort?: AbortSignal | boolean): Promise<IChainedResponse> {
        let hash = hashChain(request);
        let resp: IChainedResponse;
        if (this.chaincache[hash]) {
            let d = await this.chaincache[hash].AwaitValue();
            resp = {
                [EntityType.Activity]: [],
                [EntityType.Category]: [],
                [EntityType.Comment]: [],
                [EntityType.CommentAggregate]: [],
                [EntityType.Content]: [],
                [EntityType.File]: [],
                [EntityType.User]: []
            };

            for (let k in d) {
                let ids = d[k as EntityType]!;
                resp[k as EntityType] = await this.Read(k as EntityType, { ids }, typeof abort == "boolean" ? abort : false) as any;
            }

            return resp;
        } else {
            let resp = await this.currentDriver.Chain(request);
            this._cacheChain(request, resp);
            return resp;
        }
    }


    public GetCacheItems(type: EntityType, ids: number[]): CacheItem<IBase>[] {
        let results: CacheItem<IBase>[] = [];
        for (let i = 0; i < ids.length; i++) {
            results.push(this.cache[type][ids[i]]);
        }
        return results;
    }
    public GetCachedRequest(type: EntityType, req: Partial<ISearchQuery>): CachedRequest {
        return this.reqcache[type][hashRequest(type, req)];
    }
    public GetChainedRequest(request: IChainedRequest[]): CachedChainRequest {
        return this.chaincache[hashChain(request)];
    }
}