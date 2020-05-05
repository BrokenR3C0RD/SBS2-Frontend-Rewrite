/*
 * SBS2 Frontend
 * Created on Fri May 01 2020
 *
 * Copyright (c) 2020 MasterR3C0RD
 */

import React from "react";
import ReactDOM from "react-dom";
import App from "./components/App";
import "./classes/CacheDriver"; // This loads in window.Intercept

let token = (sessionStorage.getItem("sbs-auth") || localStorage.getItem("sbs-auth"));
Intercept.OnLogin((token) => localStorage.setItem("sbs-auth", token));

if (token)
    Intercept.Authenticate(token);

const Index = () => {
    return <App />;
};

ReactDOM.render(<Index />, document.getElementById("root"));