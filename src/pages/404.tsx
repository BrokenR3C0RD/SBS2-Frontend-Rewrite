/*
 * SBS2 Frontend
 * Created on Sun May 10 2020
 *
 * Copyright (c) 2020 MasterR#C0RD
 */

import React, { useEffect } from "react";
import Cell from "../components/layout/Cell";
import Link from "next/link";

export default (({
    dispatch
}) => {
    useEffect(() => dispatch({ type: "PAGE_LOADED" }), []);

    return <Cell>
        <h1>404 Not Found</h1>
        <p>
            Well, you've gotten yourself stuck, haven't you. How unfortunate...<br/>
            You should get out quick, before a hungry grue comes by.<br/>
            Just <Link href="/"><a>RUN</a></Link> and you'll be out of here in no time.</p>

    </Cell>
}) as React.FunctionComponent<{ dispatch: React.Dispatch<Action> }>;