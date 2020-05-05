/*
 * SBS2 Frontend
 * Created on Sun May 03 2020
 *
 * Copyright (c) 2020 MasterR3C0RD
 */

import { IDriver } from "../interfaces/Driver";
import { HTTPDriver } from "./HTTPDriver";
import { EntityType, ISearchQuery, IUserCredential, IUserSensitiveUpdate } from "../interfaces/API";
import { IView, IUser, IUserSelf } from "../interfaces/Views";
import { Dictionary } from "../interfaces/Generic";
import { Entity } from "./Entity";

type DriverCache = {
    [i in EntityType]?: Dictionary<CachedItem<IView>>
}

class CachedItem<T extends IView> {
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
        this.data = data;
        this.lastUpdate = new Date();
    }
}

class CachedRequest<T extends IView> {
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
            return await Intercept.Read<T>(this.entityType, { ids: this.data });
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


// The Cache driver is basically a middleware driver. It allows switching between drivers seamlessly, caches data in
// an expiry cache, and allows intercepting/modifying from SiteJS. The Cache is just what I use it for the most internally.
//
// An instance of the CacheDriver is placed in the global scope as window.Intercept. All classes depend on the driver,
// so you can override the driver entirely if you wish. You just have to make sure that you're returning the proper data.
//
// If you want a good example of what a driver needs to implement, check out the HTTPDriver. If you're using TypeScript,
// implement the IDriver interface. 

export class CacheDriver implements IDriver {
    private currentDriver: IDriver = new HTTPDriver;
    private cache: DriverCache = {};
    private reqcache: Dictionary<CachedRequest<IView>> = {};
    public token: string = "";
    private onLogin: (token: string) => unknown = () => {};

    public constructor() {
        for (let key in EntityType) {
            this.cache[key as EntityType] = {};
        }
    }

    public async Preload(req: [EntityType, number[]][]) {
        for (let i = 0; i < req.length; i++) {
            let k = req[i];
            await this.Read(k[0], { ids: k[1] });
        }
    }

    private async cacheRequest(type: EntityType, req: Partial<ISearchQuery>): Promise<IView[]> {
        let hash = hashRequest(type, req);
        if (this.reqcache[hash] && !this.reqcache[hash].Expired) {
            return (await this.reqcache[hash].Get())!;
        } else {
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

    public async Read<T extends IView>(type: EntityType, query: Partial<ISearchQuery>, cons?: new (data: T) => T): Promise<T[]> {
        this.cache[type] = this.cache[type] || {};

        let results: T[] = [];
        if (Object.keys(query).length == 1 && query["ids"]) { // This is only requesting by IDs, so we might have cached this
            let ids = query["ids"]!;
            let uncached: number[] = [];
            for (let i = 0; i < ids.length; i++) {
                let cacheItem = this.cache[type]![ids[i]];
                if (cacheItem && !cacheItem.Expired) {
                    results.push(await cacheItem.Get() as T);
                } else {
                    uncached.push(ids[i]);
                }
            }

            if (uncached.length > 0) {
                ((await this
                    .currentDriver
                    .Read<T>(type, { ids: uncached })) || [])
                    .forEach(item => {
                        let cacheItem = this.cache[type]![item.id];
                        if (cacheItem) {
                            cacheItem.Fresh(item);
                        } else {
                            this.cache[type]![item.id] = new CachedItem<T>(type, item);
                        }
                        results.push(item);
                    });

            }
        } else {
            results = (await this.cacheRequest(type, query)) as T[] || [];
        }
        if (cons)
            results.map(data => new cons(data));

        return results;
    }

    public async Create<T extends IView>(type: EntityType, data: Partial<T>): Promise<T> {
        let res = await this.currentDriver.Create<T>(type, data);

        // We'll cache the returned object, that way we don't have to worry about multiple requests
        this.cache[type] = this.cache[type] || {};
        this.cache[type]![res.id] = new CachedItem(type, res);

        return res;
    }

    public async Update<T extends IView>(type: EntityType, data: Partial<T> & { id: number }): Promise<T | null> {
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

        return res;
    }

    public async Delete<T extends IView>(type: EntityType, data: Partial<T> & { id: number }): Promise<T | null> {
        let res = await this.currentDriver.Delete(type, data);
        if (res == null)
            return null;

        // If the item's cached, we'll remove it. No need to keep data that isn't going to be used anymore.
        this.cache[type] = this.cache[type] || {};
        delete this.cache[type]![res.id];

        return res;
    }

    public async Authenticate(token?: string): Promise<true> {
        if (!token) {
            this.token = "";
            return true;
        }

        await this.currentDriver.Authenticate(token);
        this.token = token;
        await this.onLogin(token);
        return true;
    }

    public async Login(creds: Partial<IUserCredential>): Promise<true> {
        await this.currentDriver.Login(creds);
        this.token = this.currentDriver.token;
        await this.onLogin(this.token);
        return true;
    }

    public async Register(creds: IUserCredential): Promise<true> {
        await this.currentDriver.Register(creds);
        return true;
    }

    public async Confirm(token: string): Promise<true> {
        await this.currentDriver.Confirm(token);
        this.token = this.currentDriver.token;
        await this.onLogin(this.token);
        return true;
    }

    public async Self(): Promise<IUserSelf | null> {
        // We don't bother caching this since this is also how we detect login status.
        return this.currentDriver.Self();
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
    public async Upload(file: Blob){
        return await this.currentDriver.Upload(file);
    }

    // TODO: Cache these maybe?
    public async ListVariables(){
        return await this.currentDriver.ListVariables();
    }

    public async GetVariable(name: string){
        return await this.currentDriver.GetVariable(name);
    }

    public async SetVariable(name: string, value: string){
        return await this.currentDriver.SetVariable(name, value);
    }
    
    public async DeleteVariable(name: string){
        return await this.currentDriver.DeleteVariable(name);
    }

    public OnLogin(handler: (token: string) => unknown){
        this.onLogin = handler;
    }
}

window.Intercept = new CacheDriver();