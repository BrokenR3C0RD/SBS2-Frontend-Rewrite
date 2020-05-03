/*
 * SBS2 Frontend
 * Created on Sat May 02 2020
 *
 * Copyright (c) 2020 MasterR3C0RD
 */

export {};

import { IDriver } from "./interfaces/Driver"


declare global {
    interface Window {
        Intercept: IDriver
    }
    const Intercept: IDriver;
}