/*
 * SBS2 Frontend
 * Created on Fri May 01 2020
 *
 * Copyright (c) 2020 MasterR3C0RD
 */


import React, { useReducer, useEffect } from "react";
import Navbar from "../components/layout/app/Navbar";
import Footer from "../components/layout/app/Footer";
import Sidebar from "../components/layout/app/Sidebar";
import { FullUser } from "../classes/User";
import { useSelf } from "../hooks/User";
import Spinner from "../components/layout/Spinner";
import { useRouter } from "next/router";
import { NextPage } from "next";
import Head from "next/head";
import { AppProps } from "next/app";
import "isomorphic-fetch";

import { CacheDriver } from "../classes/CacheDriver";

if (typeof window === "object") {
    window.Intercept = new CacheDriver();
    window.Intercept.On("authenticated", (token) => {
        if (token == null)
            localStorage.removeItem("sbs-auth");
        else
            localStorage.setItem("sbs-auth", token as string);
    });
    window.Intercept.Authenticate((sessionStorage.getItem("sbs-auth") || localStorage.getItem("sbs-auth") || undefined));
} else {
    global.Intercept = new CacheDriver();
}

const InitialState = {
    sideOpen: false,
    userOpen: false,
    user: null as FullUser | null,
    theme: "light",
    loaded: false,
    title: ""
};

export default (({
    Component,
    pageProps
}) => {
    const Router = useRouter();

    const [state, dispatch] = useReducer((state: typeof InitialState, action: Action) => {
        switch (action.type) {
            case "TOGGLE_SIDE":
                return {
                    ...state,
                    sideOpen: !state.sideOpen
                }
            case "TOGGLE_USER":
                return {
                    ...state,
                    userOpen: !state.userOpen
                }
            case "RESET_MENUS":
                return {
                    ...state,
                    sideOpen: false,
                    userOpen: false
                };
            case "USER_CHANGE":
                return {
                    ...state,
                    user: action.user || null
                };
            case "PAGE_LOADED":
                return {
                    ...state,
                    loaded: true
                }
            case "PAGE_LOADING":
                return {
                    ...state,
                    loaded: false
                }
            case "CHANGE_TITLE":
                return {
                    ...state,
                    title: action.title || ""
                }
        }
    }, InitialState);

    const self = useSelf();

    useEffect(() => {
        if (state.user !== self) {
            dispatch({
                type: "USER_CHANGE",
                user: self
            });
        }
    }, [self]);

    useEffect(() => {
        Router.events.on("routeChangeStart", (url) => {
            if (window.location.pathname === url)
                return;

            dispatch({ type: "RESET_MENUS" });
            dispatch({ type: "PAGE_LOADING" });
        })
    }, []);

    return <>
        <Head>
            <meta charSet="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta httpEquiv="X-UA-Compatible" content="ie=edge" />
            <link rel="shortcut icon" href="/favicon.svg" />

            <meta name="rating" content="general" />
            <meta name="description" content="A community for learning to program and sharing programs made with SmileBASIC for the Nintendo 3DS and Switch." />
            <meta name="keywords" content="programming, programs, 3DS, Switch, Nintendo, SmileBASIC, BASIC, debugging, resources" />

            <meta property="og:description" content="A community for learning to program and sharing programs made with SmileBASIC for the Nintendo 3DS and Switch." />
            <meta property="og:image" content="https://new.smilebasicsource.com/res/img/logo.svg" />
            <meta property="og:type" content="website" />
            <meta property="og:site_name" content="SmileBASIC Source" />
            <meta property="og:url" content={`https://new.smilebasicsource.com${Router.asPath}`} />

            <link rel="canonical" href={`https://new.smilebasicsource.com${Router.asPath}`} />

            <link rel="stylesheet" href="/res/styles/normalize.css" />
            <link rel="stylesheet" href="/res/styles/global.css" />
            <link rel="stylesheet" href="/res/styles/light.css" />
            <link rel="stylesheet" href="/res/styles/dark.css" />
            <title>{state.title ? `${state.title} | SmileBASIC Source` : "SmileBASIC Source"}</title>
        </Head>
        <Navbar dispatch={dispatch} user={state.user} userOpen={state.userOpen} />
        <Sidebar open={state.sideOpen} />
        <div id="content">
            <Component dispatch={dispatch} {...pageProps} />
        </div>
        {!state.loaded && <div id="loading"><Spinner /></div>}
        <Footer />
    </>
}) as NextPage<AppProps<{ dispatch: React.Dispatch<Action> }>>;