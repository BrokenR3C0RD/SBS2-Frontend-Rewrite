/*
 * SBS2 Frontend
 * Created on Fri May 01 2020
 *
 * Copyright (c) 2020 MasterR3C0RD
 */

import { Dictionary } from "./Generic";
import { CRUD, EntityType } from "./API";

//#region Generic Entity types.

/**
 * Every view returned by the API implements this view.
 * ... except for Activity
 */
export interface IView {
    /**
     * The unique ID for this item. The ID space is shared between all items in the API.
     */
    id: number;

    /**
     * The date that this item was created.
     */
    createDate: Date;
}


/**
 * Contains information about aggregated data.
 */
export interface IAggregate {
    /**
     * The date of the first post made.
    */
    firstPost: Date | null;

    /**
     * The date of the last post made. 
    */
    lastPost: Date | null;

    /**
     * The number of posts made.
    */
    count: number;
}

/** Aggregated data for comments on a specified parent along with a list of users involved. */
export interface ICommentAggregate extends IAggregate {
    /**
     * The parent ID of the comment aggregate.
    */
    id: number;

    /**
     * The users who made comments included in the aggregated dataset.
     */
    userIds: number[];
}

/**
 * Stores information about watched content.
 */
export interface IWatchInformation extends IView {
    //userId:
}

/**
 * An entity is a piece of information stored by the API.
 */
export interface IEntity extends IView {
    /**
     * The date that this item was last edited.
     */
    editDate: Date;

    /**
     * The IUser that created and owns this entity. They will always be granted every permission on this entity.
     * @see {IUser}
     */
    createUserId: number;

    /**
     * The IUser that last edited this entity.
     */
    editUserId: number;
}

/**
 * An IEntity which has controlled access by permissions.
 */
export interface IControlledEntity extends IEntity {
    /**
     * The direct parent of this entity. Set to 0 if the entity does not have a parent.
     */
    parentId: number;

    /**
     * A Dictionary of permissions for this Entity. The key is the user ID, where 0 is every user (including those not logged in!) and the value is a combination of
     * C (create), R (read), U (update), and D (delete) which describes which actions the user may perform on this Entity. 
     */
    permissions: Dictionary<string>;

    /**
     * A list of actions that the currently logged in user is permitted to take.
     */
    myPerms: string;
}

/**
 * An IControlledEntity which has a name and a set of associated values attached to it.
 */
export interface INamedEntity extends IControlledEntity {
    /**
     * The name of this entity.
     * Must be between 1 and 128 characters in length
     */
    name: string;

    /**
     * A Dictionary of values associated with this entity. Keys and values must be strings.
     */
    values: Dictionary<string>;
}

export type IChainedResponse = {
    [EntityType.User]: IUser[],
    [EntityType.Content]: IContent[],
    [EntityType.Category]: ICategory[],
    [EntityType.Comment]: IComment[],
    [EntityType.File]: IFile[]
}

//#endregion

//#region Specific Entity types

/**
 * A user object describes a user with an account.
 */
export interface IUser extends IView {
    /**
     * The name that this user is identified by.
     */
    username: string;

    /**
     * The user's avatar ID, referring to a File entity.
     */
    avatar: number;
}

/**
 * An extended view of a User when viewed by themselves.
 */
export interface IUserSelf extends IEntity, IUser {
    /**
     * The email linked to this user's account.
     */
    email: string;

    /**
     * A user's Superuser status. Superusers are given all Create, Update, and Delete permissions on all Entities (unless they aren't permitted to Read the Entity)
     */
    super: boolean;
}

/**
 * Categories are the highest level Entity available in the API. They are used to categorize other entities contained within it.
 */
export interface ICategory extends INamedEntity {
    /**
     * A description of this category.
     * Must be between 0 and 2048 characters in length.
     */
    description: string;

    /**
     * A list of users who have super privileges over this specific category.
     * They have complete control over every piece of subcontent (unless they don't have read access)
     */
    localSupers: number[];
}

/**
 * Content is the primary Entity used across the site. It can store user generated content, and can have comments associated with them.
 */
export interface IContent extends INamedEntity {
    /**
     * The actual content. Must be between 2 and 65536 characters in length.
     */
    content: string;

    /**
     * The type of this content. Used to distinguish between different types of data, though this means nothing internally.
     */
    type: string;

    /**
     * The keywords that can be used to search for this Content.
     */
    keywords: string[];

    /**
     * Aggregate data about comments on this Content.
     */
    comments: IAggregate;
    /**
     * Aggregate data about watches on this Content.
     */
    watches: IAggregate;
}

/**
 * Comments are extra content that can be associated with Content. They are also user generated content.
 */
export interface IComment extends IEntity {
    /**
     * The parent Content of this entity. Must always be set.
     */
    parentId: number;

    /**
     * The comments content. Must be between 2 and 4096 characters in length.
     */
    content: string;

    /**
     * If true, the comment was deleted and the content will be empty.
     */
    deleted: boolean;
}

/**
 * Represents an uploaded file.
 */
export interface IFile extends IControlledEntity {
    /**
     * The name of the file.
     */
    name: string;

    /**
     * The MIME type of this file.
     */
    fileType: string;
}

//#endregion

//#region Activity types

/**
 * Describes an event which occurred on the site.
 */
export interface IEvent {
    /**
     * The unique identifier for this event.
     */
    id: number;

    /**
     * The Date that this event occurred.
     */
    date: Date;

    /**
     * The ID of the user that caused this event. -1 = System
     */
    userId: number;

    /**
     * The ID of the content that was updated.
     */
    contentId: number;

    /**
     * The type of content that was updated.
     */
    contentType: string;

    /**
     * The action that was performed (Create, Update, Delete)
     */
    action: CRUD;

    /**
     * Extra information pertaining to the Event.
     */
    extra: string;
}

//#endregion