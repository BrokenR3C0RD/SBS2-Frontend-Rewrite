/*
 * SBS2 Frontend
 * Created on Sun May 03 2020
 *
 * Copyright (c) 2020 MasterR3C0RD
 */

import React from "react";

export default (({
    children,
    x,
    y,
    width = 1,
    height = 1,
    style = {},
    className = "",
    ...props
}) => {
    return <div className={`cell ${className}`} style={Object.assign({}, {
        gridColumnStart: x,
        gridColumnEnd: x + width,
        gridRowStart: y,
        gridRowEnd: y + height
    }, style)} {...props}>
        {children}
    </div>
}) as React.FunctionComponent<{
    x: number,
    y: number,
    width?: number,
    height?: number,
    style?: React.CSSProperties,
    className?: string
} & React.HTMLAttributes<HTMLDivElement>>;