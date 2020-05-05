/*
 * SBS2 Frontend
 * Created on Sun May 03 2020
 *
 * Copyright (c) 2020 MasterR3C0RD
 */

import React from "react";

export default (() => {
    return <footer>
        <div style={{ float: "left", height: "2em" }}>
            &copy; 2020 SmileBASIC Source
        </div>
        <button style={{ float: "right", height: "2em", verticalAlign: "top", padding: "0" }}><span className="iconify" data-icon={"mdi:electric-switch" + ((typeof document !== "undefined" && document.documentElement.dataset.theme) === "dark" ? "-closed" : "")} data-inline="false"></span></button>
    </footer>;
}) as React.FunctionComponent;