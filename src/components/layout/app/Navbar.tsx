/*
 * SBS2 Frontend
 * Created on Sun May 03 2020
 *
 * Copyright (c) 2020 MasterR3C0RD
 */

import React, { useState } from "react";
import { Link } from "@reach/router";

export default (({ dispatch }) => {
    const [query, setQuery] = useState<string>("");

    return <nav>
        <span id="nav-brand">
            <img onClick={() => dispatch({type: "TOGGLE_LEFT"})} src="/res/img/logo.svg" />
        </span>

        <span className="search-container">
            <input type="text" placeholder="Search..." value={query} onChange={(evt) => setQuery(evt.currentTarget.value)} />
            <div id="hideout" />
            <div id="results">

            </div>
        </span>

        <img src="/res/img/hamburger.png" id="show-sidebar" onClick={() => dispatch({type: "TOGGLE_RIGHT"})} />
        <div id="user-info">

        </div>
    </nav>
}) as React.FunctionComponent<{
    dispatch: React.Dispatch<Action>
}>;