/*
 * SBS2 Frontend
 * Created on Fri May 01 2020
 *
 * Copyright (c) 2020 MasterR3C0RD
 */

import React from "react";
import ReactDOM from "react-dom";
import Boundary from "./components/functional/ErrorBoundary";
import App from "./components/App";
import "./classes/CacheDriver"; // This loads in window.Intercept

let token = (sessionStorage.getItem("sbs-auth") || localStorage.getItem("sbs-auth"));
Intercept.On("authenticated", (token) => token ? localStorage.setItem("sbs-auth", token as string) : localStorage.removeItem("sbs-auth"));

window.addEventListener("storage", (evt) => {
    if(evt.key == "sbs-auth"){
        Intercept.Authenticate(sessionStorage.getItem("sbs-auth") || localStorage.getItem("sbs-auth") || undefined);
    }
});

Intercept
    .Authenticate(token || undefined)
    .finally(() => {
        const Index = () => {
            return <App />;
        };

        ReactDOM.render(<Boundary><Index /></Boundary>, document.getElementById("root"));
    });