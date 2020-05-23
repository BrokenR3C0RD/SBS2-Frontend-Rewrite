/*
 * SBS2 Frontend
 * Created on Tue May 05 2020
 *
 * Copyright (c) 2020 MasterR#C0RD
 */

import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { TransmittedCache } from "../../classes/CacheDriver";
import { Content } from "../../classes/Content";
import { User } from "../../classes/User";
import withCache from "../../components/functional/Cache";
import UserView from "../../components/views/User";
import useChain from "../../hooks/Chain";
import { EntityType } from "../../interfaces/API";
import { IUser } from "../../interfaces/Views";
import Head from "next/head";
import Cell from "../../components/layout/Cell";


const [Page, getServerSideProps] = withCache((({
    dispatch,
    cache
}) => {
    const Router = useRouter();
    const { id } = Router.query;

    const [, resp] = useChain(() => {
        if (id == null)
            throw null;

        return [{
            entity: EntityType.User,
            query: {
                ids: !isNaN(+id) ? [+id] : [],
                username: isNaN(+id) ? id.toString() + "%" : undefined,
                limit: 1
            },
            cons: User
        },
        {
            entity: EntityType.Content,
            query: {
                type: "@user.page",
                limit: 1,
                reverse: true
            },
            constraint: [
                [
                    "id$parentIds"
                ]
            ],
            cons: Content
        }]
    }, [id]);

    useEffect(() => {
        if (resp != null) {
            dispatch({ type: "PAGE_LOADED" });
            dispatch({ type: "CHANGE_TITLE", title: (resp.user?.[0] as IUser)?.username || "" });
        } else {
            dispatch({ type: "CHANGE_TITLE", title: "User" });
        }
    }, [resp]);

    const preloadUser = cache?.user?.[0];

    return <>
        <Head>
            {preloadUser && <>
                <meta property="og:title" content={preloadUser.username} />
                <meta property="og:image" content={User.Avatar({ username: preloadUser.username, avatar: preloadUser.avatar }, 300, true)} />
                <meta property="og:image:type" content="image/svg" />
                <meta property="og:image:alt" content={`${preloadUser.username}'s avatar`} />
            </>}
        </Head>
        {resp !== undefined && (resp?.user?.[0] == null || resp?.user?.length == 0) && <Cell><h1>User not found.</h1></Cell>}
        {resp && resp.user?.[0] && <UserView user={resp.user![0] as User} page={resp.content?.[0] as Content} />}
    </>;
}) as React.FunctionComponent<{ dispatch: React.Dispatch<Action>, cache: TransmittedCache }>, ({ id }) => id != null ?
    [{
        entity: EntityType.User,
        query: {
            ids: !isNaN(+id) ? [+id] : [],
            ...isNaN(+id) ? { username: id.toString() + "%" } : {},
            limit: 1
        },
    },
    {
        entity: EntityType.Content,
        query: {
            type: "@user.page",
            limit: 1,
            reverse: true
        },
        constraint: [
            [
                "id$parentIds"
            ]
        ],
    }] : []
);

export default Page;
export { getServerSideProps };
