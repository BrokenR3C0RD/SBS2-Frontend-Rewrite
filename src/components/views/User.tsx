/*
 * SBS2 Frontend
 * Created on Tue May 05 2020
 *
 * Copyright (c) 2020 MasterR#C0RD
 */

import React from "react";
import { Content } from "../../classes/Content";
import { User } from "../../classes/User";
import Cell from "../layout/Cell";
import Grid from "../layout/Grid";
import MarkupView from "../functional/MarkupView";
import DayJS from "dayjs";
import Calendar from "dayjs/plugin/calendar";
DayJS.extend(Calendar);

export default (({ user, page }) => {
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
                <b>{`Joined: `}</b> {DayJS(user.createDate).calendar()}
            </div>
        </Cell>
        <Cell x={1} y={2}>
            <img className="profile-avatar" src={user.Avatar(256)} />
        </Cell>
        <Cell x={2} y={2}>
            <h2>About me:</h2>
            {page == null && <b>This user hasn't created their page yet!</b>}
            {page != null && <MarkupView code={page.content} markupLang={page.Markup} />}
        </Cell>
    </Grid>
}) as React.FunctionComponent<{
    user: User,
    page?: Content
}>;