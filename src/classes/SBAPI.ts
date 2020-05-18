/*
 * SBS2 Frontend
 * Created on Fri May 08 2020
 *
 * Copyright (c) 2020 MasterR#C0RD
 */

import Request from "./Request";

export interface KeyInfo {
    filename: string,
    type: "TXT" | "DAT1" | "DAT2" | "PRJ" | "META" | "DAT"
    icon: "TXT" | "DAT" | "PRJ" | "PRG" | "GRP",
    path: string,
    author: {
        uid: number,
        name: string
    },
    uploaded: Date,
    version: number,
    size: number,
    downloads: number,
    available: boolean,
    extInfo: {
        version: number,
        type?: "col" | "int" | "real",
        dims?: number,
        files?: { name: string, size: number }[],
        console: "Switch" | "3DS",
        project_name?: string,
        project_description?: string,
        tags: string[]
    },
    encodings: string[]
}

export default async (key: string): Promise<KeyInfo | null> => {
    return await (
        new Request<KeyInfo>(`//sbapi.me/get/${key}/info`)
            .Method("GET")
            .AddField("json", 1)
            .AddField("en", 1)
            .Execute()
    );
}