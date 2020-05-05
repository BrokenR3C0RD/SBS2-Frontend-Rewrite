/*
 * SBS2 Frontend
 * Created on Sun May 03 2020
 *
 * Copyright (c) 2020 MasterR3C0RD
 */

import React from "react";

export default (({
    open
}) => {
    return (<div id="nav-sidebar" data-open={open}>

    </div>);
}) as React.FunctionComponent<{
    open: boolean
}>;