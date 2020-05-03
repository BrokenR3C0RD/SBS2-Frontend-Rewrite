/*
 * SBS2 Frontend
 * Created on Sat May 02 2020
 *
 * Copyright (c) 2020 MasterR3C0RD
 */

import { IEntity, INamedEntity, IControlledEntity } from "../interfaces/Views";
import { EntityType, CRUD } from "../interfaces/API";
import { Dictionary } from "../interfaces/Generic";
import { FullUser, User } from "./User";

export abstract class Entity implements IEntity {
    readonly id: number;
    readonly createDate: Date;
    readonly editDate: Date;
    readonly createUserId: number;
    readonly editUserId: number;

    protected abstract readonly EntityType: EntityType;

    public constructor({ id, createDate, editDate, createUserId, editUserId }: IEntity) {
        this.id = id;
        this.createDate = new Date(createDate);
        this.editDate = new Date(editDate);
        this.createUserId = createUserId;
        this.editUserId = editUserId;

        Intercept.Preload([
            [ EntityType.User, [createUserId, editUserId]]
        ]);
    }


    public async GetCreateUser(): Promise<User | undefined> {
        return (await Intercept.Read(EntityType.User, { ids: [this.createUserId]}, User))[0];
    }

    public async GetEditUser(): Promise<User | undefined> {
        return (await Intercept.Read(EntityType.User, { ids: [this.editUserId]}, User))[0];
    }
}

export abstract class ControlledEntity extends Entity implements IControlledEntity {
    readonly parentId: number;
    readonly permissions: Dictionary<string>;

    public constructor({ id, createDate, editDate, createUserId, editUserId, parentId, permissions }: IControlledEntity) {
        super({ id, createDate, editDate, createUserId, editUserId });
        this.parentId = parentId;
        this.permissions = {};
        for (let key in permissions) {
            this.permissions[key] = permissions[key].toString();
        }
    }

    public Permitted(self: FullUser, action: CRUD) {
        /* Users are permitted to do an action if:
            - The user has superuser privileges and the action is not Read, or
            - The user is the creator of the Entity, or
            - The user is provided the permission in the permissions object, or
            - Everyone (UID #0) is provided the permission in the permissions object
        */
        return (
            action !== CRUD.Read && self.super
            ||
            this.createUserId == self.id
            ||
            this.permissions[self.id]?.includes(action)
            ||
            this.permissions["0"]?.includes(action)
        );
    }

    public SetPermission(user: User, actions: CRUD[]) {
        this.permissions[user.id] = actions
            .reduce((acc, action) => acc.includes(action) ? acc : acc.concat([action]), [] as CRUD[])
            .join("");
        
        return this;
    }

    public Allow(user: User, action: CRUD): this {
        return this.SetPermission(
            user,
            ((this.permissions[user.id]?.split("") || []) as CRUD[]).concat([action])
        );
    }

    public Deny(user: User, action: CRUD): this {
        return this.SetPermission(
            user,
            ((this.permissions[user.id]?.split("") || []) as CRUD[]).filter(ac => ac !== action)
        );
    }
}

export abstract class NamedEntity extends ControlledEntity implements INamedEntity {
    readonly name: string;
    readonly values: Dictionary<string>;

    public constructor({ id, createDate, editDate, createUserId, editUserId, parentId, permissions, name, values }: INamedEntity){
        super({id, createDate, editDate, createUserId, editUserId, parentId, permissions});

        this.name = name;
        this.values = {};
        for(let key in values){
            this.values[key] = values[key];
        }
    }

    public GetValue(name: string): string | null {
        return this.values[name] ?? null;
    }

    public SetValue(name: string, value: string): this {
        this.values[name] = value;
        return this;
    }
}