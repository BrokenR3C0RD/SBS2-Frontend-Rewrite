/*
 * SBS2 Frontend
 * Created on Sun May 03 2020
 *
 * Copyright (c) 2020 MasterR3C0RD
 */

import React, { useState } from "react";
import Link from "next/link";
import { FullUser } from "../../../classes/User";
import { Icon } from "@iconify/react";
import LoginIcon from "@iconify/icons-mdi/login";
import Form from "../../functional/Form";
import { Dictionary } from "../../../interfaces/Generic";

export default (({ dispatch, user, userOpen }) => {
    const [query, setQuery] = useState<string>("");

    function DoLogOut() {
        Intercept.Authenticate();
    }
    async function DoLogin(data: Dictionary<string | number | boolean>) {
        await FullUser.Login(data["username"] as string, data["password"] as string);
    }

    return <nav>
        <span id="nav-brand">
            <Link href="/"><a>
                <img src="/res/img/logo.svg" />
            </a>
            </Link>
        </span>

        <span className="search-container">
            <input type="text" placeholder="Search..." value={query} onChange={(evt) => setQuery(evt.currentTarget.value)} />
            <div id="hideout" />
            <div id="results">

            </div>
        </span>

        <img src="/res/img/hamburger.png" id="show-sidebar" onClick={() => dispatch({ type: "TOGGLE_SIDE" })} />
        <div id="user-info" data-open={userOpen}>
            {user && (
                <>
                    <img src={user?.Avatar(64)} className="user-avatar" onClick={() => dispatch({ type: "TOGGLE_USER" })} />
                    <ul>
                        <b>{user.username}</b>
                        <li><Link href="/user/[uid]" as={`/user/${user.id}`}><a>Profile</a></Link></li>
                        <li><Link href="/usersettings"><a>Settings</a></Link></li>
                        <li><a onClick={DoLogOut}>Logout</a></li>
                    </ul>
                </>
            )}
            {!user && <>
                <button onClick={() => dispatch({ type: "TOGGLE_USER" })}><Icon icon={LoginIcon} className="user-avatar" /></button>
                <ul>
                    <h2>Login</h2>
                    <Form onSubmit={DoLogin}>
                        <input type="text" name="username" placeholder="Username" autoComplete="username" />
                        <input type="password" name="password" placeholder="Password" autoComplete="current-password" />
                        <input type="submit" value="Login!" />
                    </Form>
                </ul>
            </>}
        </div>
    </nav>
}) as React.FunctionComponent<{
    dispatch: React.Dispatch<Action>,
    user: FullUser | null | undefined,
    userOpen: boolean
}>;