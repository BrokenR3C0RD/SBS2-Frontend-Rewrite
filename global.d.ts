/*
 * SBS2 Frontend
 * Created on Sat May 02 2020
 *
 * Copyright (c) 2020 MasterR3C0RD
 */

import { CacheDriver } from "./src/classes/CacheDriver";
import { FullUser } from "./src/classes/User";

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
        type: "TOGGLE_SIDE" | "TOGGLE_USER" | "RESET_MENUS" | "USER_CHANGE" | "PAGE_LOADED" | "PAGE_LOADING" | "CHANGE_TITLE" | "DISABLE_FOOTER" | "SET_THEME" | "SET_SITEJS",
        title?: string,
        user?: FullUser | null,
        theme?: string,
        SiteJS?: string
    }
    type State = {
        sideOpen: boolean,
        userOpen: boolean,
        user: FullUser | null,
        theme: string,
        loaded: false,
        title: string,
        footer: true,
        SiteJS: string
    }
}
