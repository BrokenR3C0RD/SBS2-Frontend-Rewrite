/*
 * SBS2 Frontend
 * Created on Sun May 03 2020
 *
 * Copyright (c) 2020 MasterR3C0RD
 */

import Link from "next/link";
import React, { useEffect } from "react";
import { Content } from "../classes/Content";
import Cell from "../components/layout/Cell";
import Gallery from "../components/layout/Gallery";
import Grid from "../components/layout/Grid";
import Spinner from "../components/layout/Spinner";
import ActivityFeed from "../components/views/ActivityFeed";
import useActivity from "../hooks/Activity";
import useChain from "../hooks/Chain";
import { EntityType } from "../interfaces/API";
import { API_ENTITY } from "../constants/ApiRoutes";

export default (({ dispatch }) => {
    useEffect(() => {
        dispatch({ type: "PAGE_LOADED" });
        dispatch({ type: "CHANGE_TITLE", title: "Home" });
    }, [dispatch]);

    const actdata = useActivity({
        includeAnonymous: true,
        reverse: true
    });

    const programs = useChain(() => [
        {
            entity: EntityType.Content,
            query: {
                type: "@page.program",
                sort: "random",
                limit: 5
            },
            cons: Content
        }
    ], []);

    return <>
        <Grid
            rows={["min-content", "1fr", "min-content", "min-content"]}
            cols={["1fr", "max-content", "1fr"]}
            // gapX="1em"
            // gapY="1em"
            style={{
                width: "100%",
                right: 0
            }}
        >
            <Cell x={1} y={1} width={4}>
                <h1>Welcome to SmileBASIC Source!</h1>
                <Link href="/discussions/[id]" as="/discussions/384"><a>Test</a></Link>
            </Cell>
            <Cell x={1} y={2} width={2}>
                <h2>
                    <Link href="/pages/programs"><a>Program Gallery</a></Link>
                </h2>
                <p>
                    Here's a selection of programs submitted by users in our community!
                </p>
                <div className="showcase-container">
                    <Gallery width="400px" height="240px" className="program-showcase">
                        {programs?.content?.map((prg, i) => {
                            let p = prg as Content;
                            let img = API_ENTITY(`File/raw/${p.GetValue("photos")?.split(",")?.[0]}`);
                            if (p.GetValue("photos") == null || p.GetValue("photos")?.trim() == "")
                                img = "/res/img/logo.svg";

                            return <div className="program" key={i}>
                                <Link href="/pages/[id]" as={`/pages/${p.id}`}><img key={prg.id} src={img} /></Link>
                                <span className="title">{p.name}</span>
                            </div>
                        })}
                    </Gallery>
                </div>
                <p>
                    You can view all programs and resources
                </p>
            </Cell>
            <Cell x={3} y={2} width={2} height={1}>
                <h2>Activity Feed</h2>
                {actdata == null && <Spinner />}
                {actdata && <ActivityFeed activity={actdata.activity} users={actdata.user} content={actdata.content} />}
            </Cell>
            <Cell x={1} y={4} width={4}>
                <h2>About SmileBASIC Source</h2>
                <p>
                    SmileBASIC Source is an online community for <a href="http://smilebasic.com/en/">"SmileBASIC"</a>, a programming language and IDE for Nintendo platforms
                    developed and released by SmileBoom Co. Ltd.
                    It all began with Petit Computer in 2011, which gave users the first taste of SmileBASIC. Since then,
                    there have been iterations of SmileBASIC for the 3DS, Wii U, and now the Nintendo Switch.
                    <br />
                    <br />
                    SmileBASIC Source was made to give people a place to discuss SmileBASIC, share their creations, and ask questions.
                    Whether brand new to programming or a seasoned veteran, we hope to provide everything you need to enjoy
                    SmileBASIC!
                </p>
            </Cell>
            <Cell x={1} y={5} width={4}>
                <h2>Under development</h2>
                <p>
                    SmileBASIC Source is still under active development, so you may find bugs or notice features that aren't yet available.
                    <br /><br />
                    Please report any bugs to MasterR3C0RD on Discord: @MasterR3C0RD#7695
                </p>
            </Cell>
        </Grid>
    </>;
}) as React.FunctionComponent<{ dispatch: React.Dispatch<Action> }>;