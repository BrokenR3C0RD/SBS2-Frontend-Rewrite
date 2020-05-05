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
import UserPage from "./pages/User";
import ContentPage from "./pages/Page";
import ErrorBoundary from "./functional/ErrorBoundary";

export default () => {
    return (
        <ErrorBoundary>
            <Router>
                <IndexPage path="/" />
                <LoginPage path="/login" />
                <UserPage path="/user/:uid" />
                <ContentPage path="/pages/:pid" />
            </Router>
        </ErrorBoundary>

    );
}