/*
 * SBS2 Frontend
 * Created on Tue May 05 2020
 *
 * Copyright (c) 2020 MasterR#C0RD
 */

import Head from "next/head";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { TransmittedCache } from '../../classes/CacheDriver';
import { Content } from "../../classes/Content";
import { User } from '../../classes/User';
import DefaultPageView from "../../components/views/DefaultPage";
import useChain from '../../hooks/Chain';
import { EntityType } from "../../interfaces/API";
import withCache from "../../components/functional/Cache";

const [Page, getServerSideProps] = withCache((function ({
    dispatch,
    cache
}) {
    // @ts-ignore
    const Router = useRouter();
    const { id } = Router.query;

    const [, response] = useChain(() => {
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

    const preloadPage = cache?.content?.[0];

    return <>
        <Head>
            {preloadPage && <>
                <meta property="og:title" content={preloadPage.name} />

            </>}
        </Head>
        {contents != null && page == null && <h1>Page not found.</h1>}
        {contents && page && createUser && editUser && <DefaultPageView page={page} createUser={createUser} editUser={editUser} />}
    </>;
}) as React.FunctionComponent<{ dispatch: React.Dispatch<Action>, cache: TransmittedCache }>, ({ id }) => !isNaN(+(id || NaN)) ? [{
    entity: EntityType.Content,
    query: {
        ids: [+(id as string)]
    }
},
{
    entity: EntityType.User,
    constraint: [["createUserId", "editUserId"]]
}] : []);

export default Page;
export { getServerSideProps };