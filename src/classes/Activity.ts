/*
 * SBS2 Frontend
 * Created on Sat May 23 2020
 *
 * Copyright (c) 2020 MasterR#C0RD
 */

import { CRUD, EntityType, IActivityFilter } from "../interfaces/API";
import { IAggregate } from "../interfaces/Views";

// Returns true if the arrays have the same data.
function hasSameData(arr1: number[], arr2: number[]): boolean {
    return arr1.length == arr2.length // Arrays are same length
        &&
        arr1.filter(val => arr2.indexOf(val) == -1).length == 0; // arr2 contains every element of arr1
}

function removeDuplicates<T>(arr: T[]): T[] {
    return arr.reduce((acc, val) => acc.indexOf(val) == -1 ? acc.concat([val]) : acc, [] as T[]);
}

export interface IAggregateEvent extends IAggregate {
    /** The number of events this aggregate should account for. */
    count: number;

    /** The entities this is linked to. */
    ids: number[];

    /** The last action taken that was included in this aggregate */
    action: CRUD;

    /** The type of content modified. */
    type: EntityType;

    /** The content type. */
    contentType: string;

    /** UIDs involved */
    uids: number[];

    /** Time of first related event. */
    firstPost: Date;

    /** TIme of last related event. */
    lastPost: Date;

    /** Extra data related. */
    extra: string[]
}

export class Activity {
    public static async Fetch(filter?: Partial<IActivityFilter>) {
        let data = await Intercept.Chain([
            {
                entity: EntityType.Activity,
                query: filter
            },
            {
                entity: EntityType.CommentAggregate,
                query: filter
            },
            {
                entity: EntityType.Content,
                fields: ["id", "name", "type", "parentId"],
                constraint: [
                    ["contentId"],
                    ["id"]
                ]
            },
            {
                entity: EntityType.User,
                fields: ["id", "username", "avatar"],
                constraint: [
                    ["userId", "contentId"],
                    ["userIds"],
                    ["parentId"]
                ]
            }
        ]);

        let events = data.activity;
        let comments = data.commentaggregate.filter(comment => comment.lastPost != null);
        let aggregate: IAggregateEvent[] = [];
        for (let i = 0; i < events.length; i++) {
            let event = events[i];
            aggregate.push({
                count: 1,
                ids: [event.contentId],
                action: event.action,
                type: event.type,
                contentType: event.contentType,
                uids: [event.userId],
                firstPost: new Date(event.date),
                lastPost: new Date(event.date),
                extra: [event.extra]
            });
        }

        for (let i = 0; i < comments.length; i++) {
            let event = comments[i];
            let content = data.content.find(con => con.id == event.id)!;

            aggregate.push({
                count: event.count,
                ids: [event.id],
                action: CRUD.Create,
                type: EntityType.Comment,
                contentType: content.type || "",
                uids: event.userIds,
                firstPost: new Date(event.firstPost!),
                lastPost: new Date(event.lastPost!),
                extra: []
            });
        }

        aggregate = aggregate.sort((a, b) => a.lastPost.getTime() - b.lastPost.getTime()).reduce((res, evt) => {
            let last = res[res.length - 1];
            if (last == null)
                return [evt];

            if (last.type == evt.type) { // Same entity type
                if (last.action == evt.action) { // Repeated occurance of same action
                    if (hasSameData(last.ids, evt.ids)) { // Same action on same IDs, condense
                        last.lastPost = evt.lastPost;
                        last.count += evt.count;
                        last.uids = removeDuplicates(last.uids.concat(evt.uids));
                        last.extra = last.extra.concat(evt.extra);
                    } else { // Same action on multiple IDs
                        if (hasSameData(last.uids, evt.uids) && evt.uids.indexOf(-1) == -1) { // Same user doing this (and it's not anonymous), condense
                            last.lastPost = evt.lastPost;
                            last.count += evt.count;
                            last.ids = removeDuplicates(last.ids.concat(evt.ids));
                            last.extra = last.extra.concat(evt.extra);
                        } else { // Completely unrelated actions, do not condense
                            res.push(evt);
                        }
                    }
                } else if (last.action == CRUD.Create && evt.action == CRUD.Update) { // Creation followed by an update
                    if (hasSameData(last.ids, evt.ids)) { // Same content created and then edited, condense
                        last.lastPost = evt.lastPost;
                        last.count += evt.count;
                        last.action = CRUD.Create;
                        last.uids = removeDuplicates(last.uids.concat(evt.uids));
                        last.extra = last.extra.concat(evt.extra);
                    }
                } else {

                }
            } else { // Completely different entities, do not condense
                res.push(evt);
            }

            return res;
        }, [] as IAggregateEvent[]);

        return {
            activity: aggregate.slice().reverse(),
            user: data.user.slice(),
            content: data.content.slice()
        };
    }
}