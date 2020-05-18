/*
 * SBS2 Frontend
 * Created on Fri May 01 2020
 *
 * Copyright (c) 2020 MasterR3C0RD
 */

import { EntityType, ISearchQuery, IUserCredential, IUserSensitiveUpdate } from "./API";
import { IView, IUserSelf, IFile } from "./Views";

export interface IChainedRequest<T extends IView> {
    entity: EntityType;
    query?: Partial<ISearchQuery>;
    constraint?: string[][];
    constructor?: new (v: T) => T;
    fields?: (keyof T)[];
}

export type IChainedResponse = {
    [i in EntityType]?: Partial<IView>[]
}

export interface IDriver {
    token: string;

    Authenticate    (token?: string): Promise<boolean>;
    Login           (creds: Partial<IUserCredential>)       : Promise<true>;
    Register        (creds: IUserCredential)                : Promise<true>;
    Confirm         (token: string)                         : Promise<true>;
    Self            ()                                      : Promise<IUserSelf | null>;
    UpdateSensitive (update: Partial<IUserSensitiveUpdate>) : Promise<true>;
    UpdateAvatar    (id: number)                            : Promise<true>;

    ListVariables   ()                                      : Promise<string[] >;
    GetVariable     (name: string)                          : Promise<string | null>;
    SetVariable     (name: string, value: string)           : Promise<true>;
    DeleteVariable  (name: string)                          : Promise<true>;

    Create    <T extends IView> (type: EntityType, data: Partial<T>): Promise<T>;
    Update    <T extends IView> (type: EntityType, data: Partial<T> & {id: number}): Promise<T | null>;
    Delete    <T extends IView> (type: EntityType, data: Partial<T> & {id: number}): Promise<T | null>;
    Read      <T extends IView> (type: EntityType, search: Partial<ISearchQuery>, constructor?: new (data: T) => T): Promise<T[]>;

    Preload(requests: [EntityType, number[]][]): void;

    Chain(request: IChainedRequest<IView>[]): Promise<IChainedResponse>

    Upload (file: Blob) : Promise<IFile>;
    // Subscribe <T extends IView> (type: EntityType, search: Partial<ISearchQuery>, constructor: new (data: IView) => T): Promise<ISubscription<T>>;
}

export interface ISubscription<T> {
    AddListener(callback: (data: T) => never): void;
    RemoveListener(callback: (data:T) => never): void;
    Unsubscribe(): Promise<void>;
}