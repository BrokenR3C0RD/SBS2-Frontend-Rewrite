/*
 * SBS2 Frontend
 * Created on Sat May 02 2020
 *
 * Copyright (c) 2020 MasterR3C0RD
 */

export { };

import { CacheDriver } from "./classes/CacheDriver";
import { FullUser } from "./classes/User";

declare global {
    module NodeJS {
        interface Global {
            Intercept: CacheDriver;
        }
    }
    interface Window {
        Intercept: CacheDriver;
        __INITIAL_CACHE__?: string;
    }
    const Intercept: CacheDriver;
    type Action = {
        type: "TOGGLE_SIDE" | "TOGGLE_USER" | "RESET_MENUS" | "USER_CHANGE" | "PAGE_LOADED" | "PAGE_LOADING" | "CHANGE_TITLE",
        title?: string,
        user?: FullUser | null
    }
}