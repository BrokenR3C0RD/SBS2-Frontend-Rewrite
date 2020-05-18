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

export const getServerSideProps: GetServerSideProps<{
    preloadPage?: Content
}> = async context => {
    const { pid } = context.query;
    try {
        if (typeof pid === "string" && !isNaN(+pid)) {
            const page = await Intercept.Read(EntityType.Content, { ids: [+pid!] });
            if (page?.[0])
                return { props: { preloadPage: page![0] as Content } };
        }
    } catch (e) {
        console.error("Failure loading page ID " + pid + ": " + e.stack);
    } finally {
        return { props: {} };
    }
}

const Page = (function ({
    dispatch,
    preloadPage
}) {
    // @ts-ignore
    const Router = useRouter();
    const { id } = Router.query;

    const [, page] = useAsync(
        useCallback(() => {
            if (id == null) {
                throw null;
            }
            if (isNaN(+id)) {
                return Promise.resolve(null)
            }
            if (preloadPage)
                return Promise.resolve([new Content(preloadPage)]);

            else {
                return Content.Get({ ids: [+id] });
            }
        }, [id])
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

    useEffect(() => {
        if (page !== undefined && (page === null || page.length === 0 || (createUser !== undefined && editUser !== undefined))) {
            dispatch({ type: "PAGE_LOADED" });
            dispatch({ type: "CHANGE_TITLE", title: page?.[0]?.name || "" });
            dispatch({ type: "DISABLE_FOOTER" })
        }
    }, [page, createUser, editUser]);

    return <>
        <Head>
            {preloadPage && <meta property="og:title" content={preloadPage.name} />}
        </Head>
        {page !== undefined && (page === null || page.length == 0) && <h1>Page not found.</h1>}
        {page?.[0] && createUser && editUser && <DefaultPageView page={page[0]} createUser={createUser} editUser={editUser} />}
    </>;
}) as React.FunctionComponent<{ dispatch: React.Dispatch<Action>, preloadPage?: Content }>;

export default Page;