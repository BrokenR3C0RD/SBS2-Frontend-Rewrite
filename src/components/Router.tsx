/*
 * SBS2 Frontend
 * Created on Sun May 03 2020
 *
 * Copyright (c) 2020 MasterR3C0RD
 */

import React from "react";
import { Router } from "@reach/router";
import IndexPage from "./pages/Index";
import LoginPage from "./pages/Login";

export default () => {
    return (
        <Router>
            <IndexPage path="/" />
            <LoginPage path="/login" />
        </Router>
    );
}