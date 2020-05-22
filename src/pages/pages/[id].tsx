/*
 * SBS2 Frontend
 * Created on Tue May 05 2020
 *
 * Copyright (c) 2020 MasterR#C0RD
 */

import { GetServerSideProps } from 'next';
import Head from "next/head";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useState } from "react";
import { Content } from "../../classes/Content";
import DefaultPageView from "../../components/views/DefaultPage";
import useAsync from "../../hooks/Async";
import { EntityType } from "../../interfaces/API";
import { IChainedRequest, IChainedResponse } from '../../interfaces/Driver';
import { IView } from '../../interfaces/Views';
import { User } from '../../classes/User';
import { TransmittedCache } from '../../classes/CacheDriver';
import useChain from '../../hooks/Chain';

export const getServerSideProps: GetServerSideProps<{
    preloadPage?: Content,
    cache?: TransmittedCache | {}
}> = async context => {
    const { id } = context.query;
    try {
        if (typeof id === "string" && !isNaN(+id)) {
            const response = await Intercept.Chain([{
                entity: EntityType.Content,
                query: {
                    ids: [+id]
                }
            },
            {
                entity: EntityType.User,
                constraint: [["createUserId", "editUserId"]]
            }]);

            if (response[EntityType.Content]?.[0])
                return { props: { preloadPage: response[EntityType.Content]?.[0]! as Content, cache: await Intercept.CreateTransmittableCache() } };
        }
    } catch (e) {
        console.error("Failure loading page ID " + id + ": " + e.stack);
    }
    return { props: { cache: {} } };
}

const Page = (function ({
    dispatch,
    preloadPage,
    cache
}) {
    // @ts-ignore
    const Router = useRouter();
    const { id } = Router.query;
    const [tCache, setTCache] = useState<TransmittedCache>();

    useEffect(() => {
        if (JSON.stringify(cache) !== JSON.stringify(tCache)) {
            setTCache(cache);
            if (cache != null)
                Intercept.LoadTransmittedCache(cache!);
        }
    });

    const [, response] = useChain(() => {
        if (id == null || tCache == null)
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

    }, [id, tCache]);

    const contents = response?.[EntityType.Content];
    const users = response?.[EntityType.User];

    let [page, setPage] = useState<Content>();
    let [createUser, setCreateUser] = useState<User>();
    let [editUser, setEditUser] = useState<User>();

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
            dispatch({ "type": "CHANGE_TITLE", title: page?.name || "" });
            dispatch({ "type": "DISABLE_FOOTER" });
        }
    }, [response]);


    return <>
        <Head>
            {preloadPage && <meta property="og:title" content={preloadPage.name} />}
        </Head>
        {contents != null && page == null && <h1>Page not found.</h1>}
        {contents && page && createUser && editUser && <DefaultPageView page={page} createUser={createUser} editUser={editUser} />}
    </>;
}) as React.FunctionComponent<{ dispatch: React.Dispatch<Action>, preloadPage?: Content, cache?: TransmittedCache }>;

export default Page;