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
import Boundary from "../components/functional/ErrorBoundary";

import "../styles/normalize.css";
import "../styles/global.css";
import "../styles/dark.css";
import "../styles/light.css";

import { CacheDriver } from "../classes/CacheDriver";
import { EntityType, IActivityFilter } from "../interfaces/API";
import { API_ROOT } from "../constants/ApiRoutes";

import DayJS from "dayjs";
import Calendar from "dayjs/plugin/calendar";
DayJS.extend(Calendar);

if (typeof window === "object") {
    window.Intercept = new CacheDriver();
    window.Intercept.On("authenticated", (token) => {
        if (token == null)
            localStorage.removeItem("sbs-auth");
        else
            localStorage.setItem("sbs-auth", token as string);
    });
    window.Intercept.Authenticate((sessionStorage.getItem("sbs-auth") || localStorage.getItem("sbs-auth") || undefined));
    window.Intercept.Read(EntityType.Category, {}); // Preloading categories = good idea
    window.Intercept.SetListenChain([ // Activity chaining
        { // Get all updated comments
            entity: EntityType.Comment,
            constraint: [["id"]]
        },
        { // Get all new activity events.
            entity: EntityType.Activity,
            constraint: [["id"]]
        },
        { // Get all new watch notifications
            entity: EntityType.ActivityAggregate,
            constraint: [["id"]],
            query: {
                ContentLimit: {
                    watches: true
                }
            } as Partial<IActivityFilter>
        },
        { // Get all users linked to events
            entity: EntityType.User,
            constraint: [[], ["createUserId", "editUserId"], ["userId", "contentId"], ["userIds"]]
        },
        { // Get all content lined to events
            entity: EntityType.Content,
            constraint: [[], ["parentId"], ["contentId"], ["id"]]
        }
    ]);
    window.Intercept.SetStatus("Online (SBS2)");

} else {
    global.Intercept = new CacheDriver();
}

const InitialState = {
    sideOpen: false,
    userOpen: false,
    user: null as FullUser | null,
    theme: "light",
    loaded: false,
    title: "",
    footer: true,
    SiteJS: ""
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
                    ...InitialState,
                    theme: state.theme,
                    user: state.user
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
            case "DISABLE_FOOTER":
                return {
                    ...state,
                    footer: false
                }
            case "SET_THEME":
                return {
                    ...state,
                    theme: action.theme ? action.theme : state.theme == "light" ? "dark" : "light"
                }
            case "SET_SITEJS":
                return {
                    ...state,
                    SiteJS: action.SiteJS!
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

    useEffect(() => {
        if (localStorage.getItem("sbs-theme")) {
            dispatch({ type: "SET_THEME", theme: localStorage.getItem("sbs-theme")! });
        }
    }, []);

    useEffect(() => {
        if (Intercept.token !== "")
            Intercept
                .GetVariable("user_settings")
                .then(settings => {
                    const set = JSON.parse(settings || "{}");
                    dispatch({ type: "SET_THEME", theme: set?.theme || state.theme });
                    dispatch({ type: "SET_SITEJS", SiteJS: set?.SiteJS || "" });
                })
                .catch(() => { });
    }, [Intercept.token])

    useEffect(() => {
        document.documentElement.dataset.theme = state.theme;
        localStorage.setItem("sbs-theme", state.theme);
        if (Intercept.token !== "") {
            Intercept
                .SetVariable("user_settings", JSON.stringify({
                    theme: state.theme,
                    SiteJS: state.SiteJS
                }));
        }
    }, [state.theme]);

    return <>
        <Head>
            <meta charSet="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta httpEquiv="X-UA-Compatible" content="ie=edge" />
            <link rel="shortcut icon" href="/favicon.svg" />

            <meta name="rating" content="general" />
            <meta name="description" content="A community for learning to program and sharing programs made with SmileBASIC for the Nintendo 3DS and Switch." />
            <meta name="keywords" content="programming, programs, 3DS, Switch, Nintendo, SmileBASIC, BASIC, debugging, resources" />

            <meta key="ogd" property="og:description" content="A community for learning to program and sharing programs made with SmileBASIC for the Nintendo 3DS and Switch." />
            <meta key="ogi" property="og:image" content="https://new.smilebasicsource.com/res/img/logo.svg" />
            <meta key="ogt" property="og:type" content="website" />
            <meta property="og:site_name" content="SmileBASIC Source" />
            <meta property="og:url" content={`https://oboy.smilebasicsource.com:49420${Router.asPath}`} />

            <link rel="canonical" href={`https://oboy.smilebasicsource.com:49420${Router.asPath}`} />
            <link rel="preconnect" href={API_ROOT} crossOrigin="anonymous" />
            <link rel="preconnect" href="//a.sbapi.me" crossOrigin="anonymous" />A

            <title>{state.title ? `${state.title} | SmileBASIC Source` : "SmileBASIC Source"}</title>
        </Head>
        <Navbar dispatch={dispatch} user={state.user} userOpen={state.userOpen} />
        <Sidebar open={state.sideOpen} />
        <div id="container">
            <div id="content">
                <Boundary>
                    <Component dispatch={dispatch} state={state} {...pageProps} />
                </Boundary>
            </div>
            {!state.loaded && <div id="loading"><Spinner /></div>}
            {state.footer && <Footer dispatch={dispatch} theme={state.theme} />}
        </div>
    </>
}) as NextPage<AppProps<{ dispatch: React.Dispatch<Action> }>>;