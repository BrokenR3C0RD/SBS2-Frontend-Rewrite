/*
 * SBS2 Frontend
 * Created on Tue May 05 2020
 *
 * Copyright (c) 2020 MasterR#C0RD
 */

import React from "react";
import Grid from "../layout/Grid";
import { User } from "../../classes/User";
import Cell from "../layout/Cell";
import Moment from "moment";

export default (({ user }) => {
    return <Grid
        className="user-view"
        cols={["min-content", "1fr"]}
        rows={["min-content", "min-content", "max-content"]}
        gapX="1em" gapY="1em"
        style={{ minHeight: "100%" }}
    >
        <Cell x={1} y={1} width={2}>
            <h1>{user.username}</h1>
            <div id="page-info">
                <b>{`Joined: `}</b> {Moment(user.createDate).calendar()}
            </div>
        </Cell>
        <Cell x={1} y={2}>
            <img className="profile-avatar" src={user.Avatar(256)} />
        </Cell>
    </Grid>
}) as React.FunctionComponent<{
    user: User
}>;