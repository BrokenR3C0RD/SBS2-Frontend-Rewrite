/*
 * SBS2 Frontend
 * Created on Fri May 01 2020
 *
 * Copyright (c) 2020 MasterR3C0RD
 */


import React, { useState, useReducer, useEffect } from "react";
import Router from "./Router";
import Navbar from "./layout/app/Navbar";
import Footer from "./layout/app/Footer";
import Sidebar from "./layout/app/Sidebar";
import { FullUser } from "../classes/User";
import { useSelf } from "../hooks/User";
import { globalHistory } from "@reach/router";

const InitialState = {
    sideOpen: false,
    userOpen: false,
    user: null as FullUser | null,
    theme: "light"
};

export default (() => {
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
        globalHistory.listen(({ action }) => {
            if (action === "PUSH") {
                dispatch({ type: "RESET_MENUS" });
            }
        })
    }, []);

    return <>
        <Navbar dispatch={dispatch} user={state.user} userOpen={state.userOpen} />
        <Sidebar open={state.sideOpen} />
        <div id="content">
            <Router />
        </div>
        <Footer />
    </>
}) as React.FunctionComponent;