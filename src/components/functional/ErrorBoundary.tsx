/*
 * SBS2 Frontend
 * Created on Tue May 05 2020
 *
 * Copyright (c) 2020 MasterR#C0RD
 */

import React from "react";
import { useErrorBoundary } from "preact/hooks";
import Cell from "../layout/Cell";

export default (({ children }) => {
    const [error, resetError] = useErrorBoundary();
    console.log(error);
    return error ? <Cell x={1} y={1}>
        <h1>Fatal error.</h1>
        <h2>
            Well that's not good.
                </h2>
        <div>
            Something went very very wrong. Please take a screenshot of the error below and report it to MasterR3C0RD, along
            with a description of what you were doing when this happened.
                </div>
        <pre style={{
            backgroundColor: "var(--secondary-bg)",
            color: "var(--primary-accent)",
            padding: "10px"
        }}>
            <b>Path: </b>{window.location.pathname}
            {`\n\n`}
                    Stacktrace: {error?.stack || error}
        </pre>
    </Cell> : <>{children}</>
}) as React.FunctionComponent;