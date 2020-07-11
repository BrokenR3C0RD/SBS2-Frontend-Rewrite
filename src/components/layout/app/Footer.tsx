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


export default (({ dispatch, theme }) => {
    return <footer>
        <div className="footer-text">
            &copy; 2020 SmileBASIC Source
        </div>
        <button aria-label="Switch theme" onClick={() => dispatch({ type: "SET_THEME" })}><InlineIcon icon={theme === "dark" ? ClosedSwitch : OpenSwitch} /></button>
    </footer>;
}) as React.FunctionComponent<{ dispatch: React.Dispatch<Action>, theme: string }>;