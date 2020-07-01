/*
 * SBS2 Frontend
 * Created on Sun Jun 28 2020
 *
 * Copyright (c) 2020 MasterR#C0RD
 */

import { IContent, IChainedResponse, IComment } from "../interfaces/Views";
import { useEffect, useState } from "react";
import { User } from "../classes/User";
import { Dictionary } from "@bbob/preset";
import { EntityType } from "../interfaces/API";
import useChain from "./Chain";
import { Comment } from "../classes/Comment";

export default function useComments(content: IContent | undefined): [Comment[], User[], User[]] {
    const [comments, setComments] = useState<Comment[]>([]);
    const [listenerIds, setListenerIds] = useState<number[]>([0]);
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        if (content == null)
            return;

        Intercept.SetStatus("Online", content.id);

        let eid = Intercept.On("listener.chains", async (chain: IChainedResponse) => {
            let comms = chain?.comment?.filter(comment => comment.parentId == content.id) || [];
            if (comms.length > 0) {
                setComments(comments => comments.concat(comms.map(comment => new Comment(comment))));
            }
            setUsers(users => {
                chain.user?.forEach(user => {
                    let idx = users.findIndex(u => u.id == user.id);
                    if(idx != -1)
                        users[idx] = new User(user);
                    else
                        users.push(new User(user));
                });
                return users;
            });
        });
        let lid = Intercept.On("listener.listeners", async (list: Dictionary<Dictionary<string>>) => {
            if (list[content.id]) {
                console.log(list[content.id]);
                setListenerIds(Object.keys(list[content.id]).map(id => +id));
            }
        });
        return () => { Intercept.Off("listener.chains", eid); Intercept.Off("listener.listeners", lid); }
    }, [content?.id]);

    const chain = useChain(() => listenerIds.length == 0
        ? null
        : [{
            entity: EntityType.User,
            query: {
                ids: listenerIds
            },
            cons: User
        }], [listenerIds, content?.id]);

    console.log(chain);

    return [comments as Comment[], (chain?.user || []) as User[], users];
}