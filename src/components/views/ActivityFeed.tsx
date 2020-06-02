/*
 * SBS2 Frontend
 * Created on Sat May 23 2020
 *
 * Copyright (c) 2020 MasterR#C0RD
 */

import Link from "next/link";
import { Children } from "react";
import { IAggregateEvent } from "../../classes/Activity";
import { User } from "../../classes/User";
import { CRUD, EntityType } from "../../interfaces/API";
import { IContent, IUser, IView } from "../../interfaces/Views";
import DayJS from "dayjs";
import Calendar from "dayjs/plugin/calendar";
DayJS.extend(Calendar);

let LinkFromTarget = (({
    linkParts = ["/", "/", "unknown"],
    children
}) =>
    <Link href={linkParts[0]} as={linkParts[1]}><a>
        {Children.count(children) == 0 ? linkParts[2] : children}
    </a></Link>
) as React.FunctionComponent<{
    linkParts?: [string, string, string]
}>;

let ActivityEvent = (({
    event,
    users,
    content
}) => {
    if (!([EntityType.Content, EntityType.User, EntityType.Comment].includes(event.type)))
        return null;

    const targets = (event.type == EntityType.User ? users as IView[] : content as IView[]).filter(r => event.ids.includes(r.id));
    let involved = users.filter(u => event.uids.includes(u.id!));
    if (involved.length == 0 && event.type === EntityType.User)
        involved = targets; // Probably means we're working with a user creation

    const data = targets.map(target => {
        let poss = users.find(user => user.id == (target as IContent).parentId);
        if (event.type === EntityType.User) {
            return [`/user/[id]`, `/user/${target.id}`, (target as IUser).username];
        } else if (poss) {
            return [`/user/[id]`, `/user/${poss.id}`, `${(poss as IUser).username}'s userpage`];
        } else {
            let base = (target as IContent).type.split(".")[0].substr(1) + "s";
            return [`/${base}/[id]`, `/${base}/${target.id}`, (target as IContent).name];
        }
    }).reverse() as [string, string, string][];

    let involvedData = involved.map(target => {
        return [`/user/[id]`, `/user/${target.id}`, (target as IUser).username];
    }).reverse() as [string, string, string][];

    return <li>
        <LinkFromTarget linkParts={data[data.length - 1]}>
            {involved.length === 1 ? <img src={User.Avatar({ username: involved[0].username!, avatar: involved[0].avatar! }, 64, true)} title={involved[0].username!} alt={involved[0].username!} />
                : <div className="imgs">
                    {involved.map(user => <img key={user.id!} src={User.Avatar({ username: user.username!, avatar: user.avatar! }, 64, true)} title={user.username!} alt={user.username!} />)}
                </div>}
        </LinkFromTarget>
        <div className="content">
            <span>
                <LinkFromTarget linkParts={involvedData[0]} />
                {involvedData.length > 1 && ` and ${involvedData.length - 1} other${involvedData.length != 2 ? "s" : ""}`}
                {` `}
                {
                    (() => {
                        let targetPart = (
                            data.length == 1
                                ? <LinkFromTarget linkParts={data[0]} />
                                : <>{data.length} pages</>
                        );
                        if (event.type == EntityType.User) {
                            switch (event.action) {
                                case CRUD.Create:
                                    return <>created an account.</>;
                                case CRUD.Update:
                                    return <>confirmed their account.</>;
                                case CRUD.Delete:
                                    return <>deleted their account.</>;
                            }
                        } else if (event.type == EntityType.Comment) {
                            switch (event.action) {
                                case CRUD.Create:
                                    return <>posted {event.count} comment{event.count != 1 && "s"} on {targetPart}.</>;
                                case CRUD.Update:
                                    return <>edited {event.count} comment{event.count != 1 && "s"} on {targetPart}.</>;
                                case CRUD.Delete:
                                    return <>deleted {event.count} comment{event.count != 1 && "s"} on {targetPart}.</>;
                            }
                        } else {
                            switch (event.action) {
                                case CRUD.Create:
                                    return <>submitted {targetPart}.</>;
                                case CRUD.Update:
                                    return <>made {event.count} edit{event.count != -1 && "s"} to {targetPart}.</>;
                                case CRUD.Delete:
                                    return <>deleted {targetPart}.</>;
                            }
                        }
                    })()
                }
            </span>
            <span className="time">
                {DayJS(event.lastPost as unknown as string).calendar()}
            </span>
        </div>
    </li>;
}) as React.FunctionComponent<{
    event: IAggregateEvent,
    users: Partial<IUser>[],
    content: Partial<IContent>[]
}>;

export default (({
    activity, users, content
}) => {
    return <ul className="activity">
        {activity.map((event, i) =>
            <ActivityEvent
                key={i}
                event={event}
                content={content}
                users={users}
            />)}
    </ul>
}) as React.FunctionComponent<{
    activity: IAggregateEvent[],
    users: Partial<IUser>[],
    content: Partial<IContent>[]
}>;