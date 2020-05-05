/*
 * SBS2 Frontend
 * Created on Tue May 05 2020
 *
 * Copyright (c) 2020 MasterR#C0RD
 */

import React, { useCallback } from "react";
import { User } from "../../classes/User";
import { RouteComponentProps } from "@reach/router";
import useAsync from "../../hooks/Async";
import UserView from "../views/User";

export default (({
    uid
}) => {
    const [error, user] = useAsync(
        useCallback(() => {
            if (uid == null) {
                throw null;
            } if (isNaN(+uid)) {
                return Promise.resolve(null)
            } else {
                return User.Get({ ids: [+uid] });
            }
        }, [uid])
    );

    return <>
        {user === undefined && <h1>Loading...</h1>}
        {user !== undefined && (user === null || user.length == 0) && <h1>User not found.</h1>}
        {user?.[0] && <UserView user={user[0]} />}
    </>;
}) as React.FunctionComponent<RouteComponentProps<{
    uid: string
}>>