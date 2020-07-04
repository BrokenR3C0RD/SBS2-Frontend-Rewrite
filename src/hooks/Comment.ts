/*
 * SBS2 Frontend
 * Created on Sun Jun 28 2020
 *
 * Copyright (c) 2020 MasterR#C0RD
 */

import { Dictionary } from "../interfaces/Generic";
import { useEffect, useState } from "react";
import { Comment } from "../classes/Comment";
import { User } from "../classes/User";
import { IChainedResponse } from "../interfaces/Views";

export default function useComments(contentId: number | undefined): [Comment[], User[], User[], boolean, boolean, () => void] {
    const [comments, setComments] = useState<Comment[]>([]);
    const [listenerIds, setListenerIds] = useState<number[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [fetching, setFetching] = useState<boolean>(false);
    const [more, setMore] = useState<boolean>(false);
    const [listen, setListen] = useState<boolean>(false);

    useEffect(() => {
        if (contentId == null || listen)
            return;

        Comment
            .Fetch({ id: contentId }, {
                reverse: true,
                limit: 40
            })
            .then(([comments, users]) => {
                setComments(comments.sort((a, b) => a.id - b.id));
                setUsers(users);
                setListen(true);
                setMore(comments.length >= 40);
            });
    }, [contentId])

    useEffect(() => {
        if (contentId == null || !listen)
            return;

        Intercept.SetStatus("Online", contentId);
        setListenerIds(Object.keys(Intercept.Listeners[contentId] || {}).map(id => +id));

        let eid = Intercept.On("listener.chains", async (chain: IChainedResponse) => {
            let comms = chain?.comment?.filter(comment => comment.parentId == contentId) || [];
            if (comms.length > 0) {
                setComments(comments => {
                    let newcoms = comments.slice();
                    comms.forEach(comment => {
                        let idx = newcoms.findIndex(u => u.id == comment.id);
                        if (idx != -1)
                            newcoms[idx] = new Comment(comment);
                        else
                            newcoms.push(new Comment(comment));
                    })
                    return newcoms.sort((a, b) => a.id - b.id);
                });
            }
            if (chain.user)
                setUsers(users => {
                    chain.user?.forEach(user => {
                        let idx = users.findIndex(u => u.id == user.id);
                        if (idx != -1)
                            users[idx] = new User(user);
                        else
                            users.push(new User(user));
                    });
                    return users;
                });
        });
        let lid = Intercept.On("listener.listeners", async (list: Dictionary<Dictionary<string>>) => {
            if (list[contentId]) {
                setListenerIds(Object.keys(list[contentId]).map(id => +id));
            }
        });
        return () => { Intercept.Off("listener.chains", eid); Intercept.Off("listener.listeners", lid); }
    }, [contentId, listen]);

    useEffect(() => {
        if (fetching && contentId != null && comments.length != 0) {
            let maxid = Math.min.apply(Math, comments.map(comment => comment.id));
            Comment
                .Fetch({ id: contentId }, {
                    maxid,
                    limit: 30,
                    reverse: true
                })
                .then(([newc, newu]) => {
                    setComments(comments => {
                        let newcoms = comments.slice();
                        newc.forEach(comment => {
                            let idx = newcoms.findIndex(u => u.id == comment.id);
                            if (idx != -1)
                                newcoms[idx] = new Comment(comment);
                            else
                                newcoms.push(new Comment(comment));
                        })
                        return newcoms.sort((a, b) => a.id - b.id);
                    });
                    setUsers(users => {
                        newu.forEach(user => {
                            let idx = users.findIndex(u => u.id == user.id);
                            if (idx != -1)
                                users[idx] = user;
                            else
                                users.push(user);
                        });
                        return users;
                    });
                    setMore(newc.length >= 30);
                    setFetching(false);
                });
        } else {
            setFetching(false);
        }
    }, [fetching]);

    return [comments as Comment[], users.filter(user => listenerIds.includes(user.id)), users, fetching, more, () => setFetching(more)];
}