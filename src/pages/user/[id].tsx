/*
 * SBS2 Frontend
 * Created on Tue May 05 2020
 *
 * Copyright (c) 2020 MasterR#C0RD
 */

import React, { useCallback, useEffect } from "react";
import { User } from "../../classes/User";
import useAsync from "../../hooks/Async";
import UserView from "../../components/views/User";
import { useRouter } from "next/router";
import { EntityType } from "../../interfaces/API";

export default (({
    dispatch
}) => {
    const Router = useRouter();
    const { id } = Router.query;

    const [error, user] = useAsync(
        useCallback(() => {
            if (id == null) {
                throw null;
            } if (isNaN(+id)) {
                return Promise.resolve(null)
            } else {
                return User.Get({ ids: [+id] });
            }
        }, [id])
    );

    useEffect(() => {
        if (user !== undefined) {
            dispatch({ type: "PAGE_LOADED" });
            dispatch({ type: "CHANGE_TITLE", title: user?.[0]?.username || "" });
        } else {
            dispatch({ type: "CHANGE_TITLE", title: "User" });
        }
    }, [user]);

    return <>
        {user !== undefined && (user === null || user.length == 0) && <h1>User not found.</h1>}
        {user?.[0] && <UserView user={user[0]} />}
    </>;
}) as React.FunctionComponent<{ dispatch: React.Dispatch<Action> }>