/*
 * SBS2 Frontend
 * Created on Fri May 01 2020
 *
 * Copyright (c) 2020 MasterR3C0RD
 */

import { EntityType, ISearchQuery, IActivityFilter } from "./API";
import { IView } from "./Views";

export interface IDriver {
    Authenticate(token: string): Promise<boolean>;

    Create    <T extends IView> (type: EntityType, data: Partial<T>): Promise<T>;
    Update    <T extends IView> (type: EntityType, data: Partial<T>): Promise<T>;
    Delete    <T extends IView> (type: EntityType, data: Partial<T>): Promise<T>;
    Read      <T extends IView> (type: EntityType, search: Partial<ISearchQuery>, constructor: new (data: IView) => T): Promise<T[]>;

    Subscribe <T extends IView> (type: EntityType, search: Partial<ISearchQuery>, constructor: new (data: IView) => T): Promise<ISubscription<T>>;
}

export interface ISubscription<T> {
    AddListener(callback: (data: T) => never): void;
    RemoveListener(callback: (data:T) => never): void;
    Unsubscribe(): Promise<void>;
}