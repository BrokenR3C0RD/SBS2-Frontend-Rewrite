/*
 * SBS2 Frontend
 * Created on Sat May 02 2020
 *
 * Copyright (c) 2020 MasterR3C0RD
 */

export {};

import { CacheDriver } from "./classes/CacheDriver";
import { FullUser } from "./classes/User";

declare global {
    interface Window {
        Intercept: CacheDriver;
    }
    const Intercept: CacheDriver;
    type Action = {
        type: "TOGGLE_LEFT" | "TOGGLE_RIGHT" | "USER_CHANGE",
        user?: FullUser | null
    }
}