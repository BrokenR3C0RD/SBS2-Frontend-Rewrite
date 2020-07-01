/*
 * SBS2 Frontend
 * Created on Sun May 03 2020
 *
 * Copyright (c) 2020 MasterR3C0RD
 */

import React, { useState } from "react";
import { Dictionary } from "../../interfaces/Generic";

export default (({
    children,
    onSubmit,
    className = ""
}) => {
    const [errors, setErrors] = useState<string[]>([]);

    async function SubmissionHelper(evt: React.FormEvent<HTMLFormElement>) {
        evt.preventDefault();
        let formItems = evt.currentTarget.elements;
        let data: Dictionary<string | boolean | number> = {};

        f: for (let i = 0; i < formItems.length; i++) {
            let element = formItems[i];
            if (element instanceof HTMLButtonElement)
                continue;

            if (element instanceof HTMLInputElement) {
                switch (element.type) {
                    case "submit":
                        continue f;
                    case "checkbox":
                        data[element.name] = element.value == "on"
                        break;
                    default:
                        data[element.name] = element.value;
                }
            } else {
                data[(element as any).name] = (element as any).value;
            }
        }

        try {
            await onSubmit(data);
        } catch (e) {
            if (e instanceof Array) {
                setErrors(e);
            } else if (e instanceof Error) {
                setErrors([e.message]);
            } else {
                setErrors([e + ""]) // This is less likely to fail if the object doesn't implement toString() (ex, undefined)
            }
        }
    }

    return <form onSubmit={SubmissionHelper} className={className}>
        {children}
        <div className="errors">
            {errors.length > 0 && <>
                <b>Errors:</b>
                <ul>
                    {errors.map((error, i) => <li key={i}>{error}</li>)}
                </ul>
            </>
            }
        </div>
    </form>
}) as React.FunctionComponent<{
    onSubmit: (data: Dictionary<string | boolean | number>) => Promise<unknown>,
    className?: string
}>;