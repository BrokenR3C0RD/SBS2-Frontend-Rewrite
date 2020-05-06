/*
 * SBS2 Frontend
 * Created on Sun May 03 2020
 *
 * Copyright (c) 2020 MasterR3C0RD
 */

import React from "react";
import { InlineIcon } from "@iconify/react";
import OpenSwitch from "@iconify/icons-mdi/electric-switch";
import ClosedSwitch from "@iconify/icons-mdi/electric-switch-closed";


export default (() => {
    return <footer>
        <div style={{ float: "left", height: "2em" }}>
            &copy; 2020 SmileBASIC Source
        </div>
        <button><InlineIcon icon={ClosedSwitch} /></button>
    </footer>;
}) as React.FunctionComponent;