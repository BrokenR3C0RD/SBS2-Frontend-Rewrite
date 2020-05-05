/*
 * SBS2 Frontend
 * Created on Tue May 05 2020
 *
 * Copyright (c) 2020 MasterR#C0RD
 */

import React, { useCallback } from "react";
import { RouteComponentProps } from "@reach/router";
import useAsync from "../../hooks/Async";
import { Content } from "../../classes/Content";
import DefaultPageView from "../views/DefaultPage";

export default (({
    pid
}) => {
    const [, page] = useAsync(
        useCallback(() => {
            if (pid == null) {
                throw null;
            }
            if (isNaN(+pid)) {
                return Promise.resolve(null)
            }
            else {
                return Content.Get({ ids: [+pid] });
            }
        }, [pid])
    );
    const [, createUser] = useAsync(
        useCallback(() => {
            if (page == null || page?.[0] == null)
                throw null;
            else
                return page[0].GetCreateUser();
        }, [page])
    );

    const [, editUser] = useAsync(
        useCallback(() => {
            if (page == null || page?.[0] == null)
                throw null;
            else
                return page[0].GetEditUser();
        }, [page])
    );

    return <>
        {(page === undefined || page != null && (createUser === undefined || editUser === undefined)) && <h1>Loading...</h1>}
        {page !== undefined && (page === null || page.length == 0) && <h1>Page not found.</h1>}
        {page?.[0] && createUser && editUser && <DefaultPageView page={page[0]} createUser={createUser} editUser={editUser} />}
    </>;
}) as React.FunctionComponent<RouteComponentProps<{
    pid: string
}>>