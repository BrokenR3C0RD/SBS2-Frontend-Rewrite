/*
 * SBS2 Frontend
 * Created on Sun May 03 2020
 *
 * Copyright (c) 2020 MasterR3C0RD
 */

import { EntityType, ISearchQuery, IUserCredential, IUserSensitiveUpdate } from "../interfaces/API";
import { IDriver, IChainedRequest } from "../interfaces/Driver";
import { Dictionary } from "../interfaces/Generic";
import { IUserSelf, IView, ICategory, IComment, IContent, IUser, IFile, IControlledEntity, INamedEntity, IChainedResponse, ICommentAggregate, IEvent, IBase } from "../interfaces/Views";
import { HTTPDriver } from "./HTTPDriver";
import { EventEmitter } from "./Event";

function onlyContains(arr1: string[], arr2: string[]): boolean {
    for (let i = 0; i < arr1.length; i++) {
        if (arr2.indexOf(arr1[i]) == -1)
            return false;
    }
    return true;
}

function sqlSimilar(str: string, matches: string): boolean {
    let regexp = new RegExp(`^${str.replace(/_/g, ".").replace(/%/g, ".*")}$`, "i");
    return regexp.test(str);
}

// https://stackoverflow.com/a/2450976
function shuffle<T>(array: T[]): T[] {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

type DriverCache = {
    [i in EntityType]?: Dictionary<CachedItem<IBase>>
}

class CachedItem<T extends IBase> {
    private data: T;
    private entityType: EntityType;
    private lastUpdate: Date = new Date();
    private threshold: number = 30000; // 30 seconds

    public get Expired(): boolean {
        return (Date.now() - this.threshold) > this.lastUpdate.getTime()
    }

    public constructor(type: EntityType, data: T, threshold?: number) {
        this.entityType = type;
        this.data = data;
        this.threshold = threshold || this.threshold;
    }

    public async Get(force: boolean = false): Promise<T | null> {
        if (this.Expired || force) {
            let res = await Intercept.Read<T>(this.entityType, { ids: [this.data.id] });
            if (res) {
                this.lastUpdate = new Date();
                return this.data = res[0];
            } else {
                return null;
            }
        } else {
            return this.data;
        }
    }

    public Fresh(data: T) {
        if (JSON.stringify(this.data) !== JSON.stringify(data))
            this.data = data;

        this.lastUpdate = new Date();
    }
}

class CachedRequest<T extends IBase> {
    private request: Partial<ISearchQuery> = {};
    private data: number[];
    private entityType: EntityType;
    private lastUpdate: Date = new Date();
    private threshold: number = 30000; // 30 seconds

    public get Expired(): boolean {
        return (Date.now() - this.threshold) > this.lastUpdate.getTime()
    }

    public constructor(type: EntityType, request: Partial<ISearchQuery>, data: number[], threshold?: number) {
        this.entityType = type;
        this.request = request;
        this.data = data;
        this.threshold = threshold || this.threshold;
    }

    public async Get(force: boolean = false): Promise<T[] | null> {
        if (this.Expired || force) {
            let res = await Intercept.Read<T>(this.entityType, this.request);
            if (res) {
                this.lastUpdate = new Date();
                return res;
            } else {
                return null;
            }
        } else {
            if (this.data.length == 0)
                return [];

            return await Intercept.Read<T>(this.entityType, { ids: this.data });
        }
    }

    public ToTransmit(): TransmittedRequest {
        return {
            entityType: this.entityType,
            request: this.request,
            data: this.data
        }
    }

    public Fresh(data: number[]) {
        this.data = data;
        this.lastUpdate = new Date();
    }
}

function hashRequest(type: EntityType, req: Partial<ISearchQuery>): string {
    return `${type}:${JSON.stringify(req)}`;
}

// Cache locking is kinda gross.
class CacheLock extends EventEmitter {
    private value?: IBase;
    public Unlock(lockedItem: IBase) {
        this._Dispatch("done", this.value = lockedItem);
    }
    public async AwaitUnlock(): Promise<IBase> {
        if (this.value)
            return this.value;
        return (await this.ResolveOn("done"))[0] as IBase;
    }
}

/**
 * A basic cache generated from the server side to improve hydration speed.
 */
export type TransmittedCache = {
    [EntityType.Category]: ICategory[],
    [EntityType.Comment]: IComment[],
    [EntityType.Content]: IContent[],
    [EntityType.User]: IUser[],
    [EntityType.File]: IFile[],
    [EntityType.CommentAggregate]: ICommentAggregate[],
    [EntityType.Activity]: IEvent[],
    requests: TransmittedRequest[]
}

type TransmittedRequest = {
    entityType: EntityType,
    request: Partial<ISearchQuery>,
    data: number[]
};

// The Cache driver is basically a middleware driver. It allows switching between drivers seamlessly, caches data in
// an expiry cache, and allows intercepting/modifying from SiteJS. The Cache is just what I use it for the most internally.
//
// An instance of the CacheDriver is placed in the global scope as window.Intercept. All classes depend on the driver,
// so you can override the driver entirely if you wish. You just have to make sure that you're returning the proper data.
//
// If you want a good example of what a driver needs to implement, check out the HTTPDriver. If you're using TypeScript,
// implement the IDriver interface. 

export class CacheDriver extends EventEmitter implements IDriver {
    private currentDriver: IDriver = new HTTPDriver;
    private cache: DriverCache = {};
    private reqcache: Dictionary<CachedRequest<IView>> = {};
    public token: string = "";
    private locked: Dictionary<Dictionary<CacheLock>> = {
        [EntityType.Category]: {},
        [EntityType.Comment]: {},
        [EntityType.Content]: {},
        [EntityType.User]: {},
        [EntityType.File]: {},
        [EntityType.CommentAggregate]: {},
        [EntityType.Activity]: {}
    };

    public constructor(cacheData?: TransmittedCache) {
        super();

        for (let key in EntityType) {
            this.cache[EntityType[key as keyof typeof EntityType]] = {};
        }
        if (cacheData)
            this.LoadTransmittedCache(cacheData);
    }

    public LoadTransmittedCache(cacheData: TransmittedCache): this {
        for (let key in cacheData) {
            if (key == "requests") {
                for (let i = 0; i < cacheData.requests.length; i++) {
                    let item = cacheData.requests[i];
                    this.reqcache[hashRequest(item.entityType, item.request)] = new CachedRequest(item.entityType, item.request, item.data);
                }
            } else {
                for (let i = 0; i < cacheData[key as EntityType].length; i++) {
                    this.cache[key as EntityType]![cacheData[key as EntityType][i].id] = new CachedItem(key as EntityType, cacheData[key as EntityType][i]);
                }
            }
        }
        return this;
    }

    public async Preload(req: [EntityType, number[]][]) {
        for (let i = 0; i < req.length; i++) {
            let k = req[i];
            await this.Read(k[0], { ids: k[1] });
        }
    }

    private async cacheRequest(type: EntityType, req: Partial<ISearchQuery>, failOnExpiry: boolean = false): Promise<IBase[]> {
        let hash = hashRequest(type, req);
        if (this.reqcache[hash] && !this.reqcache[hash].Expired) {
            return (await this.reqcache[hash].Get())!;
        } else {
            if (failOnExpiry) {
                throw null;
            }
            let resp = await this.currentDriver.Read<IView>(type, req);
            let ids = resp.map(view => view.id);
            resp.forEach(view => {
                if (this.cache[type] && this.cache[type]![view.id]) {
                    this.cache[type]![view.id].Fresh(view);
                } else {
                    this.cache[type]![view.id] = new CachedItem(type, view);
                }
            });
            if (this.reqcache[hash]) {
                this.reqcache[hash].Fresh(ids);
            } else {
                this.reqcache[hash] = new CachedRequest(type, req, ids);
            }
            return resp;
        }
    }

    public async Read<T extends IBase>(type: EntityType, query: Partial<ISearchQuery>, cons?: new (data: T) => T, failOnExpiry: boolean = false): Promise<T[]> {
        this.cache[type] = this.cache[type] || {};

        let results: T[] = [];
        if (query["ids"] && query["ids"].length > 0 && onlyContains(Object.keys(query), ["ids", "parentids", "limit", "skip", "sort", "reverse"])) {
            let ids = query["ids"]!;
            let uncached: number[] = [];
            for (let i = 0; i < ids.length; i++) {
                if (uncached.indexOf(ids[i]) == -1 && this.locked[type][ids[i]]) {
                    results.push((await this.locked[type][ids[i]].AwaitUnlock()) as T)
                    continue;
                } else {
                    let cacheItem = this.cache[type]![ids[i]];
                    if (cacheItem && !cacheItem.Expired) {
                        results.push(await cacheItem.Get() as T);
                    } else {
                        if (failOnExpiry) throw null;
                        if (uncached.indexOf(ids[i]) == -1) {
                            this.locked[type][ids[i]] = new CacheLock();
                            uncached.push(ids[i]);
                        }
                    }
                }
            }

            if (uncached.length > 0) {
                let uncachedItems = ((await this
                    .currentDriver
                    .Read<T>(type, { ids: uncached })) || []);

                for (let i = 0; i < uncachedItems.length; i++) {
                    let item = uncachedItems[i];
                    let cacheItem = this.cache[type]![item.id];
                    if (cacheItem) {
                        cacheItem.Fresh(item);
                    } else {
                        this.cache[type]![item.id] = new CachedItem<T>(type, item);
                    }
                    await this.locked[type][item.id].Unlock(item);
                    delete this.locked[type][item.id];
                    results.push(item);
                }
            }

            switch (query.sort || "ids") {
                case "ids":
                    results = results.sort((a, b) => a.id - b.id);
                    break;
                case "random":
                    results = shuffle(results);
                    break;
            }

            if (query.reverse) {
                results = results.reverse();
            }
        } else {
            results = (await this.cacheRequest(type, query, failOnExpiry)) as T[] || [];
        }

        if (cons)
            results = results.map(data => new cons(data));

        await this._Dispatch(`read-${type.toLowerCase()}`, results);
        return results;
    }

    public async Create<T extends IBase>(type: EntityType, data: Partial<T>): Promise<T> {
        let res = await this.currentDriver.Create<T>(type, data);

        // We'll cache the returned object, that way we don't have to worry about multiple requests
        this.cache[type] = this.cache[type] || {};
        this.cache[type]![res.id] = new CachedItem(type, res);

        await this._Dispatch(`create-${type.toLowerCase()}`, res);
        return res;
    }

    public async Update<T extends IBase>(type: EntityType, data: Partial<T> & { id: number }): Promise<T | null> {
        let res = await this.currentDriver.Update(type, data);
        if (res == null)
            return null;

        // We'll cache the updated content. First we check if it's already cached.
        this.cache[type] = this.cache[type] || {};

        if (this.cache[type]![res.id]) {
            this.cache[type]![res.id].Fresh(res);
        } else {
            this.cache[type]![res.id] = new CachedItem(type, res);
        }

        await this._Dispatch(`update-${type.toLowerCase()}`, res);

        return res;
    }

    public async Delete<T extends IBase>(type: EntityType, data: Partial<T> & { id: number }): Promise<T | null> {
        let res = await this.currentDriver.Delete(type, data);
        if (res == null)
            return null;

        // If the item's cached, we'll remove it. No need to keep data that isn't going to be used anymore.
        this.cache[type] = this.cache[type] || {};
        delete this.cache[type]![res.id];


        await this._Dispatch(`delete-${type.toLowerCase()}`, res);
        return res;
    }

    public async Authenticate(token?: string): Promise<true> {
        if (!token) {
            this.token = "";
            await this.currentDriver.Authenticate();
            await this._Dispatch("authenticated", null);
            return true;
        }

        await this.currentDriver.Authenticate(token);
        this.token = token;
        await this._Dispatch("authenticated", token);
        return true;
    }

    public async Login(creds: Partial<IUserCredential>): Promise<true> {
        await this.currentDriver.Login(creds);
        this.token = this.currentDriver.token;
        await this._Dispatch("authenticated", this.token);
        return true;
    }

    public async Register(creds: IUserCredential): Promise<true> {
        await this.currentDriver.Register(creds);
        return true;
    }

    public async Confirm(token: string): Promise<true> {
        await this.currentDriver.Confirm(token);
        this.token = this.currentDriver.token;
        await this._Dispatch("authenticated", this.token);
        return true;
    }

    public async Self(): Promise<IUserSelf | null> {
        // We don't bother caching this since this is also how we detect login status.
        let self = await this.currentDriver.Self();
        await this._Dispatch("self", self);
        return self;
    }

    public async UpdateSensitive(update: IUserSensitiveUpdate): Promise<true> {
        await this.currentDriver.UpdateSensitive(update);
        let { id, username, avatar, createDate } = (await this.Self())!;

        this.cache[EntityType.User] = this.cache[EntityType.User] || {};
        let ownCacheItem = this.cache[EntityType.User]![id];
        if (ownCacheItem)
            ownCacheItem.Fresh({ id, username, avatar, createDate } as IView);

        return true;
    }

    public async UpdateAvatar(avatarid: number): Promise<true> {
        await this.currentDriver.UpdateAvatar(avatarid);
        let { id, username, avatar, createDate } = (await this.Self())!;

        this.cache[EntityType.User] = this.cache[EntityType.User] || {};
        let ownCacheItem = this.cache[EntityType.User]![id];
        if (ownCacheItem)
            ownCacheItem.Fresh({ id, username, avatar, createDate } as IView);

        return true;
    }

    // We don't cache uploaded files
    public async Upload(file: Blob) {
        return await this.currentDriver.Upload(file);
    }

    // TODO: Cache these maybe?
    public async ListVariables() {
        return await this.currentDriver.ListVariables();
    }

    public async GetVariable(name: string) {
        return await this.currentDriver.GetVariable(name);
    }

    public async SetVariable(name: string, value: string) {
        return await this.currentDriver.SetVariable(name, value);
    }

    public async DeleteVariable(name: string) {
        return await this.currentDriver.DeleteVariable(name);
    }

    public async Chain(request: IChainedRequest<any>[], abort?: AbortSignal): Promise<IChainedResponse> {
        // Alright, we have to be super fancy with this to make it work right with caching.
        // We basically have to attempt to create our own chain, but if any of the data is expired, we return null.
        try {
            let responses: IView[][] = [];
            let output: any = {};
            for (let i = 0; i < request.length; i++) {
                let req = request[i];
                let query = {
                    ...req.query
                }

                if (req.constraint) {
                    for (let j = 0; j < req.constraint.length; j++) {
                        let constraints = req.constraint[j];
                        let res = responses[j];
                        if (constraints.length == 0)
                            continue;
                        if (res.length == 0)
                            throw null;

                        for (let k = 0; k < constraints.length; k++) {
                            let constraint = constraints[k].split("$");
                            let prime = constraint[0];
                            let target = constraint[1] || "ids";

                            let s = res.map(r => (r as any)[prime]);
                            if (target[target.length - 1] == "s") {
                                (query as any)[target] = ((query as any)[target] || []).concat(s).reduce((acc: number[], r: number | number[]) => r instanceof Array ? acc.concat(r) : acc.concat([r]), [] as number[]);
                            } else {
                                (query as any)[target] = s[0];
                            }
                        }
                    }
                }

                let res = await this.Read(req.entity, {
                    ...query
                }, req.cons as new (data: IView) => IView, true);

                output[req.entity] = (output[req.entity] || []).concat(res.map(r => {
                    if (req.fields == null)
                        return r;

                    let out: Partial<IView> = {};
                    for (let i = 0; i < req.fields.length; i++) {
                        (out as any)[req.fields[i]] = (r as any)[req.fields[i]];
                    }
                    return out;
                }));
                responses.push(res);
            }
            return output;
        } catch (e) {
            if (e != null)
                console.error(e);

            let r = await this.currentDriver.Chain(request, abort);
            for (let k in r) {
                let type = k as EntityType;

                // We'll cache the entity we receive, but we need to make sure we're getting full objects here and not some trash we don't want.
                this.cache[type] = this.cache[type] || {};

                if (request.filter(req => req.entity == type && req.fields?.length != 0).reduce((acc, r) => acc.concat(r.fields as string[] || []), [] as string[]).length > 0)
                    continue;

                for (let j = 0; j < r[type]!.length; j++) {
                    let res = r[type]![j];
                    if (this.cache[type]![res.id!]) {
                        this.cache[type]![res.id!].Fresh(res as IView);
                    } else {
                        this.cache[type]![res.id!] = new CachedItem(type, res as IView);
                    }
                }
            }
            // This is likely the most complex caching logic I'm going to write.
            // Caching chain sub-requests is extremely difficult, and requires basically narrowing down the data from each request down to
            // what we expect it to grab.
            // This is IMPOSSIBLE if field limiting is used, since we're only supposed to be caching complete data.
            let res: IView[][] = [];
            req:
            for (let i = 0; i < request.length; i++) {
                let req = request[i];
                if (req.fields)
                    continue;

                let query: Partial<ISearchQuery> = {
                    ...req.query
                };

                let subres: IView[] = r[req.entity]?.slice() as IView[];
                if (req.constraint && req.constraint.length > 0) {
                    for (let j = 0; j < req.constraint.length; j++) {
                        let constraints = req.constraint[j];
                        if (constraints.length == 0)
                            continue;

                        let cres = res[j];
                        if (cres == null || cres.length == 0)
                            continue req; // Request is invalid, don't even touch it.

                        for (let k = 0; k < constraints.length; k++) {
                            let constraint = constraints[k].split("$");
                            let prime = constraint[0];
                            let target = constraint[1] || "ids";

                            let s = cres.map(r => (r as any)[prime]);
                            if (target[target.length - 1] == "s") {
                                (query as any)[target] = ((query as any)[target] || []).concat(s).reduce((acc: number[], r: number | number[]) => r instanceof Array ? acc.concat(r) : acc.concat([r]), [] as number[]);
                            } else {
                                (query as any)[target] = s[0];
                            }
                        }
                    }
                }
                if ((query.ids?.length || 0) > 0) {
                    subres = subres.filter(r => query.ids!.indexOf(r.id) != -1);
                }
                if (query.parentids) {
                    subres = subres.filter(r => query.parentids!.indexOf((r as IControlledEntity).parentId))
                }
                if (query.minid) {
                    subres = subres.filter(r => r.id >= query.minid!);
                }
                if (query.maxid) {
                    subres = subres.filter(r => r.id <= query.minid!);
                }
                if (query.name && [EntityType.Content, EntityType.Category].includes(req.entity)) {
                    subres = subres.filter(r => sqlSimilar((r as INamedEntity).name, query.name!));
                }
                if (query.username && req.entity == EntityType.User) {
                    subres = subres.filter(r => sqlSimilar((r as IUser).username, query.username!));
                }
                if (query.keyword && req.entity == EntityType.Content) {
                    subres = subres.filter(r => (r as IContent).keywords.some(k => sqlSimilar(k, query.keyword!)));
                }
                if (query.type && req.entity == EntityType.Content) {
                    subres = subres.filter(r => (r as INamedEntity).name);
                }
                switch (query.sort || "ids") {
                    case "ids":
                        subres = subres.sort((a, b) => a.id - b.id);
                        break;
                    case "random":
                        subres = shuffle(subres);
                        break;
                }
                if (query.reverse) {
                    subres = subres.reverse();
                }
                if (query.skip) {
                    subres = subres.slice(query.skip);
                }
                if (query.limit) {
                    subres = subres.slice(0, query.limit);
                }

                let ids = subres.map(r => r.id);
                this.reqcache[hashRequest(req.entity, query)] = new CachedRequest(req.entity, query, ids);
                res.push(subres);
            }
            return r as IChainedResponse;
        }
    }

    public async CreateTransmittableCache(): Promise<TransmittedCache> {
        let output: TransmittedCache = {
            [EntityType.Category]: [],
            [EntityType.Comment]: [],
            [EntityType.Content]: [],
            [EntityType.User]: [],
            [EntityType.File]: [],
            [EntityType.CommentAggregate]: [],
            [EntityType.Activity]: [],
            requests: []
        };

        for (let k in EntityType) {
            let key = EntityType[k as keyof typeof EntityType];
            let cache = this.cache[key as EntityType];
            if (cache == null)
                continue;

            for (let id in cache) {
                output[key as EntityType].push((await cache[id].Get()) as any);
            }
        }

        output.requests = Object.values(this.reqcache).map(req => req.ToTransmit());
        return output;
    }

    public prereqs: Dictionary<Partial<ISearchQuery>[]> = {};
    public Requires(queries: [EntityType, Partial<ISearchQuery>[]][]) {
        for (let i = 0; i < queries.length; i++) {
            this.prereqs[queries[i][0]] = (this.prereqs[queries[i][0]] || []).concat(queries[i][1]);
        }
    }
}