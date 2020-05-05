/*
 * SBS2 Frontend
 * Created on Fri May 01 2020
 *
 * Copyright (c) 2020 MasterR3C0RD
 */


import React, { useState, useReducer } from "react";
import Router from "./Router";
import Navbar from "./layout/app/Navbar";
import Footer from "./layout/app/Footer";
import LeftSidebar from "./layout/app/LeftSidebar";
import RightSidebar from "./layout/app/RightSidebar";
import { FullUser } from "../classes/User";

const InitialState = {
    leftOpen: false,
    rightOpen: false,
    user: null as FullUser | null
};

export default (() => {
    const [state, dispatch] = useReducer((state: typeof InitialState, action: Action) => {
        switch(action.type){
            case "TOGGLE_LEFT":
                return {
                    ...state,
                    leftOpen: !state.leftOpen
                }
            case "TOGGLE_RIGHT":
                return {
                    ...state,
                    rightOpen: !state.rightOpen
                }
            case "USER_CHANGE":
                return {
                    ...state,
                    user: action.user || null
                };
        }
    }, InitialState)

    return <>
        <Navbar dispatch={dispatch} />
        <LeftSidebar open={state.leftOpen} />
        <RightSidebar open={state.rightOpen} user={state.user} />
        <div id="content">
            <Router />
        </div>
        <Footer />
    </>
}) as React.FunctionComponent;