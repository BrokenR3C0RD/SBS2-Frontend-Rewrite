/*
 * SBS2 Frontend
 * Created on Sun May 03 2020
 *
 * Copyright (c) 2020 MasterR3C0RD
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FullUser, User } from "../../../classes/User";
import { Icon } from "@iconify/react";
import LoginIcon from "@iconify/icons-mdi/login";
import Form from "../../functional/Form";
import { Dictionary } from "../../../interfaces/Generic";
import dl from "damerau-levenshtein";
import { EntityType } from "../../../interfaces/API";
import { Content } from "../../../classes/Content";

const URL_MAP = {
    "user": "/user/[id]",
    "discussion": "/discussions/[id]",
    "page": "/pages/[id]"
}

export default (({ dispatch, user, sidebarToggleId, userOpen }) => {
    const [query, setQuery] = useState<string>("");
    const [results, setResults] = useState<{
        type: string,
        name: string,
        id: number,
        keywords: string[]
    }[]>([]);

    useEffect(() => {
        let abort = new AbortController();
        setTimeout(
            (async () => {
                if (abort.signal.aborted)
                    return;

                if (query.length == 0)
                    return setResults([]);;

                try {
                    let response = await Intercept.Chain(
                        [
                            {
                                entity: EntityType.User,
                                query: {
                                    usernamelike: `%${query}%`,
                                    limit: 10
                                }
                            },
                            {
                                entity: EntityType.Content,
                                query: {
                                    name: `%${query}%`,
                                    type: "@page%",
                                    limit: 10
                                }
                            },
                            {
                                entity: EntityType.Content,
                                query: {
                                    keyword: `%${query}%`,
                                    type: "@page%",
                                    limit: 10
                                }
                            },
                            {
                                entity: EntityType.Content,
                                query: {
                                    name: `%${query}%`,
                                    type: "@discussion%",
                                    limit: 10
                                }
                            },
                            {
                                entity: EntityType.Content,
                                query: {
                                    keyword: `%${query}%`,
                                    type: "@discussion%",
                                    limit: 10
                                }
                            }
                        ],
                        abort.signal
                    );

                    let aggregate = ((response.user as User[] || []).map<any>(user => ({
                        type: "user",
                        name: user.username,
                        keywords: [],
                        id: user.id
                    })))
                        .concat(
                            ((response.content as Content[] || []).map<any>(page => ({
                                type: page.type,
                                name: page.name,
                                id: page.id,
                                keywords: page.keywords
                            }))
                            )
                        )
                        .sort((a: any, b: any) => {
                            return (
                                dl(b.keywords.join(" "), query).similarity
                                - dl(a.keywords.join(" "), query).similarity
                            ) * 10
                                + (
                                    dl(b.name, query).similarity
                                    - dl(a.name, query).similarity
                                ) * 5
                        })
                        .slice(0, 10);

                    if (!abort.signal.aborted)
                        setResults(aggregate);
                } catch (e) {

                }
            }), 250);
        return () => abort.abort();
    }, [query]);

    function DoLogOut() {
        Intercept.Authenticate();
    }
    async function DoLogin(data: Dictionary<string | number | boolean>) {
        await FullUser.Login(data["username"] as string, data["password"] as string);
    }

    return <nav>
        <div className="nav-main">
            <span id="nav-brand">
                <Link href="/"><a>
                    <img src="/res/img/logo.svg" alt="(OK)" />
                </a>
                </Link>
            </span>

            <span className="search-container">
                <input type="text" placeholder="Search..." value={query} onChange={(evt) => setQuery(evt.currentTarget.value)} />
                <div id="hideout" />
                <div id="results">
                    <ul>
                        {results.map((result, i) => {
                            let href = result.type == "user" ? "/user/[id]" : (URL_MAP as any)[result.type.substr(1).split(".")[0]] || URL_MAP["page"];
                            let as = href.replace("[id]", result.id.toString());
                            return <li key={i}>
                                <Link href={href} as={as}><a>{result.name}</a></Link>
                            </li>
                        })}
                    </ul>
                </div>
            </span>
        </div>

        <div id="user-info" data-open={userOpen}>
            {user && (
                <>
                    <img src={user?.Avatar(64)} className="user-avatar" onClick={() => dispatch({ type: "TOGGLE_USER" })} />
                    <ul>
                        <b>{user.username}</b>
                        <li><Link href="/user/[id]" as={`/user/${user.id}`}><a>Profile</a></Link></li>
                        <li><Link href="/usersettings"><a>Settings</a></Link></li>
                        <li><a onClick={DoLogOut}>Logout</a></li>
                    </ul>
                </>
            )}
            {!user && <>
                <button onClick={() => dispatch({ type: "TOGGLE_USER" })} aria-label="Log In"><Icon icon={LoginIcon} className="user-avatar" /></button>
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
        <label htmlFor={sidebarToggleId} id="show-sidebar"><img src="/res/img/hamburger.png" aria-role="button" aria-pressed="false" tabIndex={0} alt="Toggle Sidebar" /></label>
    </nav>
}) as React.FunctionComponent<{
    dispatch: React.Dispatch<Action>,
    user: FullUser | null | undefined,
    sidebarToggleId: string,
    userOpen: boolean
}>;