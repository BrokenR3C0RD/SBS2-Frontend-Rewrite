/*
 * SBS2 Frontend
 * Created on Fri May 08 2020
 *
 * Copyright (c) 2020 MasterR#C0RD
 */

import ContentEditorView from "../../components/views/ContentEditor";
import { useEffect, useCallback } from "react";
import Cell from "../../components/layout/Cell";
import { useRouter } from "next/router";
import useAsync from "../../hooks/Async";
import { Content } from "../../classes/Content";

export default (({ state, dispatch }) => {
    const Router = useRouter();
    const { id, cid } = Router.query;
    
    const [, page] = useAsync(
        useCallback(() => {
            if (id == null) {
                throw null;
            }
            if (isNaN(+id)) {
                return Promise.resolve(null)
            } else {
                return Content.Get({ ids: [+id] });
            }
        }, [id])
    );

    useEffect(() => {
        if(id == null || page != null)
            dispatch({ type: "PAGE_LOADED" });
    }, [id, page]);

    return <Cell>
        <ContentEditorView user={state.user} content={page?.[0] || null} type="@page.resource" category={cid ? +cid : undefined} />
    </Cell>;
}) as React.FunctionComponent<{
    state: State,
    dispatch: React.Dispatch<Action>
}>;