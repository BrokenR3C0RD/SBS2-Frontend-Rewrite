/*
 * SBS2 Frontend
 * Created on Sun May 03 2020
 *
 * Copyright (c) 2020 MasterR3C0RD
 */

import React, { useEffect } from "react";
import {useRouter} from "next/router";
import Grid from "../components/layout/Grid";
import Cell from "../components/layout/Cell";
import Form from "../components/functional/Form";
import { Dictionary } from "../interfaces/Generic";
import { FullUser } from "../classes/User";

export default (({ dispatch }) => {
    const Router = useRouter();
    useEffect(() => {
        dispatch({ type: "PAGE_LOADED" });
        dispatch({ type: "CHANGE_TITLE", title: "Log In"});
    }, [])

    async function DoLogin(data: Dictionary<string | number | boolean>) {
        await FullUser.Login(data["username"] as string, data["password"] as string);
        await Router.push("/");
    }
    async function DoRegister(data: Dictionary<string | number | boolean>) {
        await FullUser.Register({
            username: data["username"] as string,
            password: data["password"] as string,
            email: data["email"] as string
        })
    }

    return <Grid
        cols={["1fr", "1fr"]}
        rows={["min-content"]}
        gapX="1em"
        gapY="1em"
    >
        <Cell x={1} y={1}>
            <h2>Login</h2>
            <Form onSubmit={DoLogin}>
                <input type="text" name="username" placeholder="Username" autoComplete="username" />
                <input type="password" name="password" placeholder="Password" autoComplete="current-password" />
                <input type="submit" value="Login!" />
            </Form>
        </Cell>
        <Cell x={2} y={1}>
            <h2>Register</h2>
            <Form onSubmit={DoRegister}>
                <input type="text" name="username" placeholder="Username (3-20 characters)" autoComplete="off" />
                <input type="email" name="email" placeholder="Email" autoComplete="email" />
                <input type="password" name="password" placeholder="Password (> 8 characters)" autoComplete="new-password" />
                <input type="password" name="confirm" placeholder="Confirm password" autoComplete="new-password" />
                <input type="submit" value="Register!" />
            </Form>
        </Cell>
    </Grid>
}) as React.FunctionComponent<{ dispatch: React.Dispatch<Action> }>;