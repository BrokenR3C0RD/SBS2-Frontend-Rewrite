/*
 * SBS2 Frontend
 * Created on Thu May 07 2020
 *
 * Copyright (c) 2020 MasterR#C0RD
 */

import Composer from "../components/functional/Composer";
import Grid from "../components/layout/Grid";
import Cell from "../components/layout/Cell";
import { useEffect } from "react";

export default (({
    dispatch
}) => {
    useEffect(() => dispatch({type: "PAGE_LOADED"}), []);

    return <Grid
        cols={["1fr"]}
        rows={["1fr"]}
    >
        <Cell x={1} y={1}>
            <Composer />
        </Cell>
    </Grid>
}) as React.FunctionComponent<{dispatch: React.Dispatch<Action>}>;