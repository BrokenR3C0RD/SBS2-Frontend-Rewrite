/*
 * SBS2 Frontend
 * Created on Sat May 02 2020
 *
 * Copyright (c) 2020 MasterR3C0RD
 */

import { IDriver, ISubscription } from "../interfaces/Driver";

export class HTTPDriver implements IDriver {
    private token: string;

    public async Authenticate(token: string) {
        
    }
}

export class HTTPDriverSubscription<T> implements ISubscription<T> {

}