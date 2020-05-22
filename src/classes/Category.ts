/*
 * SBS2 Frontend
 * Created on Tue May 05 2020
 *
 * Copyright (c) 2020 MasterR#C0RD
 */

import { EntityType, ISearchQuery } from "../interfaces/API";
import { ICategory } from "../interfaces/Views";
import { Content } from "./Content";
import { NamedEntity } from "./Entity";

export class Category extends NamedEntity implements ICategory {
    EntityType = EntityType.Category;

    readonly description: string;
    readonly localSupers: number[];

    public constructor({ id, createDate, editDate, createUserId, editUserId, parentId, permissions, myPerms: myperms, name, values, description, localSupers }: ICategory) {
        super({ id, createDate, editDate, createUserId, editUserId, parentId, permissions, myPerms: myperms, name, values });
        this.description = description;
        this.localSupers = localSupers;
    }

    public static async Tree(rootName: string, categories?: Category[]): Promise<Category | null> {
        let res = await Category.Get({ name: rootName });
        if (res[0]) {
            await res[0].FetchChildren(categories);
            await res[0].FetchPins();
            return res[0];
        } else {
            return null;
        }
    }

    public static async Get(query: Partial<ISearchQuery>): Promise<Category[]> {
        return await Intercept.Read(EntityType.Category, query, Category);
    }
    public static async GlobalTree(): Promise<Category[]> {
        let res = await Category.Get({});
        for (let i = 0; i < res.length; i++) {
            await res[i].FetchChildren(res);
        }
        return res;
    }

    public static async Update(data: Partial<ICategory>): Promise<Category | null> {
        if (data.id != null) {
            let res = await Intercept.Update<ICategory>(EntityType.Category, (data as Partial<ICategory> & { id: number }))
            if (res)
                return new Category(res);
            else
                return null;
        } else {
            let res = await Intercept.Create<ICategory>(EntityType.Category, data);
            if (res)
                return new Category(res);
            else
                return null;
        }
    }

    public async ChangeParent(parent: Category): Promise<Category | null> {
        let c = new Category(this) as ICategory;
        c.parentId = parent.id;
        return await Category.Update(c);
    }

    public async GetParent(): Promise<Category | undefined> {
        return this.parentId > 0 ? (await Category.Get({ ids: [this.parentId] }))[0] : undefined;
    }

    private children: Category[] = [];
    private pins: Content[] = [];

    public async FetchChildren(categories?: Category[]): Promise<Category[]> {
        let children = categories ? categories.filter(cat => cat.parentId == this.id) : await Category.Get({ parentids: [this.id] });
        for (let i = 0; i < children.length; i++) {
            await children[i].FetchChildren(categories);
        }
        this.children = children;
        return children;
    }

    public async FetchPins(): Promise<Content[]> {
        let pins = await Content.Get({ ids: (this.GetValue("pinned") || "").split(",").map(v => +v) });
        this.pins = pins;
        return pins;
    }

    public async TogglePin(pin: Content): Promise<Category> {
        let pinned = (this.GetValue("pinned") || "").split(",").map(v => +v);
        if (pinned.indexOf(pin.id) !== -1) {
            pinned.splice(pinned.indexOf(pin.id), 1);
        } else {
            pinned.push(pin.id);
        }
        this.SetValue("pinned", pinned.reduce((acc, n) => acc.indexOf(n) == -1 ? acc.concat([n]) : acc, [] as number[]).join(","));
        return new Category(await Category.Update(this) || this);
    }

    public get Children(): Category[] {
        return this.children.slice();
    }
    public get Pins(): Content[] {
        return this.pins.slice();
    }
}