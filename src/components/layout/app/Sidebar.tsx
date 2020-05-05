/*
 * SBS2 Frontend
 * Created on Sun May 03 2020
 *
 * Copyright (c) 2020 MasterR3C0RD
 */

import React from "react";
import { FullUser } from "../../../classes/User";
import { Link } from "@reach/router";

export default (({
    open
}) => {
    return (<div id="sidebar" data-open={open}>
        <ul>
            <li><Link to="/">Home</Link></li>
        </ul>

    </div>);
}) as React.FunctionComponent<{
    open: boolean
}>;