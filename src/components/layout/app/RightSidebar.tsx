/*
 * SBS2 Frontend
 * Created on Sun May 03 2020
 *
 * Copyright (c) 2020 MasterR3C0RD
 */

import React from "react";
import { FullUser } from "../../../classes/User";

export default (({
    open,
    user
}) => {
    return (<div id="watch-sidebar" data-open={open}>
        {user && <div id="user-info">
            <img src={user.Avatar(64)} />
            <span>{user.username}</span>
        </div>}
    </div>);
}) as React.FunctionComponent<{
    open: boolean,
    user: FullUser | null
}>;