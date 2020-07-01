/*
 * SBS2 Frontend
 * Created on Tue May 05 2020
 *
 * Copyright (c) 2020 MasterR#C0RD
 */

import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { Content } from "../../classes/Content";
import { User } from "../../classes/User";
import withCache from "../../components/functional/Cache";
import UserView from "../../components/views/User";
import useChain from "../../hooks/Chain";
import { EntityType } from "../../interfaces/API";
import { IUser, IChainedResponse, IBase } from "../../interfaces/Views";
import Head from "next/head";
import Cell from "../../components/layout/Cell";
import { ChainCacheResponse } from "../../classes/CacheDriver";


const [Page, getServerSideProps] = withCache((({
    dispatch,
    preload
}) => {
    const Router = useRouter();
    const { id } = Router.query;

    const resp = useChain(() => {
        if (id == null)
            throw null;

        return [{
            entity: EntityType.User,
            query: {
                ids: !isNaN(+id) ? [+id] : [0],
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

    const preloadUser = preload?.user?.[0] as IUser | undefined;

    return <>
        <Head>
            {preloadUser && <>
                <meta property="og:title" content={preloadUser.username} />
                <meta key="ogi" property="og:image" content={User.Avatar({ username: preloadUser.username, avatar: preloadUser.avatar }, undefined, true)} />
                <meta property="og:image:type" content="image/svg+xml" />
                <meta property="og:image:alt" content={`${preloadUser.username}'s avatar`} />
            </>}
        </Head>
        {resp !== undefined && (resp?.user?.[0] == null || resp?.user?.length == 0) && <Cell><h1>User not found.</h1></Cell>}
        {resp && resp.user?.[0] && <UserView user={resp.user![0] as User} page={resp.content?.[0] as Content} />}
    </>;
}) as React.FC<{ preload?: ChainCacheResponse<IBase>, dispatch: React.Dispatch<Action> }>, ({ id }) => id != null ?
    [{
        entity: EntityType.User,
        query: {
            ids: !isNaN(+id) ? [+id] : [0],
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
