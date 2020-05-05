/*
 * SBS2 Frontend
 * Created on Sun May 03 2020
 *
 * Copyright (c) 2020 MasterR3C0RD
 */

import React from "react";
 
export default (({
    children,
    rows,
    cols,
    gapX = "0",
    gapY = "0",
    style = {},
    className = "",
    always = false
}) => {
    return <div className={`grid ${className}`} style={Object.assign({}, {
        gridTemplateColumns: cols.join(" "),
        gridTemplateRows: rows.join(" "),
        gridRowGap: gapY,
        gridColumnGap: gapX
    }, style)} {...{ "data-always": always ? "data-always" : undefined}}>
        {children}
    </div>
}) as React.FunctionComponent<{
    rows: string[],
    cols: string[],
    gapX?: string,
    gapY?: string,
    style?: React.CSSProperties,
    always?: boolean,
    className?: string
}>;