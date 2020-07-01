/*
 * SBS2 Frontend
 * Created on Fri May 01 2020
 *
 * Copyright (c) 2020 MasterR3C0RD
 */

import { EntityType, ISearchQuery, IUserCredential, IUserSensitiveUpdate, IActivityFilter, Vote } from "./API";
import { IView, IUserSelf, IFile, IChainedResponse, ICommentAggregate, IEvent, IBase, IContent, IComment, IListenActionQuery, IListenListenerQuery, IVote, IWatch } from "./Views";
import { EventEmitter } from "../classes/Event";
import { Dictionary } from "@bbob/preset";

export interface IChainedRequest<T = unknown> {
    entity: EntityType;
    query?: Partial<ISearchQuery>;
    constraint?: string[][];
    cons?: new (v: T) => T;
    fields?: (keyof T)[];
}

export interface IDriver extends EventEmitter {
    token: string;
    Listeners: Dictionary<Dictionary<string>>;

    Authenticate(token?: string): Promise<boolean>;
    Login(creds: Partial<IUserCredential>): Promise<true>;
    Register(creds: IUserCredential): Promise<true>;
    Confirm(token: string): Promise<true>;
    Self(): Promise<IUserSelf | null>;
    UpdateSensitive(update: Partial<IUserSensitiveUpdate>): Promise<true>;
    UpdateAvatar(id: number): Promise<true>;

    ListVariables(): Promise<string[]>;
    GetVariable(name: string): Promise<string | null>;
    SetVariable(name: string, value: string): Promise<true>;
    DeleteVariable(name: string): Promise<true>;

    Create<T extends IBase>(type: EntityType, data: Partial<T>): Promise<T>;
    Update<T extends IBase>(type: EntityType, data: Partial<T> & { id: number }): Promise<T | null>;
    Delete<T extends IBase>(type: EntityType, data: Partial<T> & { id: number }): Promise<T | null>;
    Read<T extends IBase>(type: EntityType, search: Partial<ISearchQuery>, constructor?: new (data: T) => T): Promise<T[]>;

    Chain(request: IChainedRequest<any>[], abort?: AbortSignal): Promise<IChainedResponse>

    Upload(file: Blob): Promise<IFile>;

    Vote(content: Partial<IContent> & { id: number }, vote: Vote | null): Promise<IVote | null>;
    Watch(content: Partial<IContent> & { id: number }): Promise<IWatch | null>;
    Unwatch(content: Partial<IContent> & { id: number }): Promise<IWatch | null>;
    ClearWatch(content: Partial<IContent> & { id: number }): Promise<IWatch | null>;

    SetStatus(status: string | null, id?: number): Dictionary<string>;
    SetListenChain(chain: IChainedRequest<IView>[]): IChainedRequest<IView>[];
}