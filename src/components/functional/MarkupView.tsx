/*
 * SBS2 Frontend
 * Created on Wed May 06 2020
 *
 * Copyright (c) 2020 MasterR#C0RD
 */

import isURL from "validator/lib/isURL";
import isDataURI from "validator/lib/isDataURI"
import createPreset, { Node, TagNode } from "@bbob/preset";
import BBCode from "@bbob/react";
import React from "react";
import { Dictionary } from "../../interfaces/Generic";
import "../../vendor/parse";

export default (({
    code,
    markupLang = "12y",
    className = "",
    preview = false
}) => {
    if (typeof Parse == undefined)
        return <>IT AINT WORK</>;

    let e = document.createElement("div");
    e.append(Parse?.parseLang(code, markupLang, preview));
    let html = e.innerHTML;
    console.log(html);
    return <div className={`bbcode-view ${className}`} dangerouslySetInnerHTML={{ __html: html }}></div>

}) as React.FunctionComponent<{
    code: string,
    markupLang?: string,
    className?: string,
    preview?: boolean
}>;