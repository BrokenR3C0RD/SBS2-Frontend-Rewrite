/*
 * SBS2 Frontend
 * Created on Tue May 05 2020
 *
 * Copyright (c) 2020 MasterR#C0RD
 */

import Head from "next/head";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { Content } from "../../classes/Content";
import { User } from '../../classes/User';
import DefaultPageView from "../../components/views/DefaultPage";
import ProgramPageView from "../../components/views/ProgramPage";
import DiscussionView from "../../components/views/Discussion";
import useChain from '../../hooks/Chain';
import { EntityType } from "../../interfaces/API";
import ProgramPage from "../../components/views/ProgramPage";
import useComments from "../../hooks/Comment";

const Discussion = function ({
    dispatch,
    state
}) {
    // @ts-ignore
    const Router = useRouter();
    const { id } = Router.query;

    const response = useChain(() => {
        if (id == null)
            throw null;

        if (isNaN(+id))
            return null;

        return [{
            entity: EntityType.Content,
            query: {
                ids: [+id]
            },
            cons: Content as any
        },
        {
            entity: EntityType.User,
            constraint: [
                ["createUserId", "editUserId"]
            ],
            cons: User as any
        }];
    }, [id]);

    const contents = response?.[EntityType.Content];
    const users = response?.[EntityType.User];

    let [page, setPage] = useState<Content>();
    let [createUser, setCreateUser] = useState<User>();
    let [editUser, setEditUser] = useState<User>();

    let [comments, listeners, cusers] = useComments(page);

    useEffect(() => {
        if (contents != null && users != null) {
            if (contents[0]) {
                setPage(page = contents[0] as Content);
                setCreateUser(createUser = users.find(user => user.id == page!.createUserId)! as User);
                setEditUser(editUser = users.find(user => user.id == page!.editUserId)! as User);
            }
        }
        if (response) {
            dispatch({ "type": "PAGE_LOADED" });
            dispatch({ "type": "CHANGE_TITLE", title: page?.name || "t" });
            dispatch({ "type": "DISABLE_FOOTER" });
        }
    }, [response]);

    return <>
        {contents != null && page == null && <h1>Page not found.</h1>}
        {contents && page && createUser && editUser &&
            <DiscussionView discussion={page} comments={comments} listeners={listeners} users={cusers} self={state.user} />
        }
    </>;
} as React.FunctionComponent<{ dispatch: React.Dispatch<Action>, state: State }>;

export default Discussion;