/*
 * SBS2 Frontend
 * Created on Tue May 05 2020
 *
 * Copyright (c) 2020 MasterR#C0RD
 */

import React from "react";
import { User } from "../../classes/User";
import { Content } from "../../classes/Content";
import Grid from "../layout/Grid";
import Cell from "../layout/Cell";
import Moment from "moment";
import Link from "next/link";

export default (({
    page,
    createUser,
    editUser
}) => {
    return <Grid
        className="defaultpage-view"
        cols={["1fr"]}
        rows={["min-content", "max-content", "min-content", "max-content"]}
    >
        <Cell x={1} y={1}>
            <h1>{page.name}</h1>
            <div id="page-info">
                <b>{`Author: `}</b>
                <Link href="/user/[uid]" as={`/user/${createUser.id}`}>
                    <a>
                        <img src={createUser.Avatar(32)} className="info-avatar" />
                        {createUser.username}
                    </a>
                </Link>
            </div>
        </Cell>
        <Cell x={1} y={2}>

        </Cell>
        <Cell x={1} y={3}>

        </Cell>
        <Cell x={1} y={4}>

        </Cell>
    </Grid>
}) as React.FunctionComponent<{
    page: Content,
    createUser: User,
    editUser: User
}>;