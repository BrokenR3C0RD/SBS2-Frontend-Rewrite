/*
 * SBS2 Frontend
 * Created on Sat May 02 2020
 *
 * Copyright (c) 2020 MasterR3C0RD
 */

import Validate from "validator";
import { API_ENTITY } from "../constants/ApiRoutes";
import { IUserCredential, IUserSensitiveUpdate, EntityType, ISearchQuery } from "../interfaces/API";
import { IDriver, ISubscription } from "../interfaces/Driver";
import APIRequest from "./Request";
import { IUserSelf, IView, IFile } from "../interfaces/Views";
import { Dictionary } from "../interfaces/Generic";

export class HTTPDriver implements IDriver {
    token?: string;

    public async Authenticate(token?: string): Promise<boolean> {
        if (!token) {
            this.token = undefined;
            return true;
        }

        if (!Validate.isJWT(token))
            throw ["Invalid token."];

        try {
            await (
                new APIRequest<string>(`${API_ENTITY("User")}/me`)
                    .Method("POST")
                    .AddField("Authorization", `Bearer ${token}`)
                    .Execute()
            );

            this.token = token;
            return true;
        } catch (e) {
            console.error("Error occurred during authentication: ", e.join(", "));
            return false;
        }
    }

    public async Login({ username, email, password }: IUserCredential): Promise<true> {
        let token = await (
            new APIRequest<string>(`${API_ENTITY("User")}/authenticate`)
                .Method("POST")
                .AddFields({ username, email, password })
                .Execute());

        this.token = token!;
        return true;
    }

    public async Register({ username, email, password }: IUserCredential): Promise<true> {
        if (!Validate.isEmail(email)) {
            throw ["Email is invalid."];
        } else if (!Validate.isLength(username, { min: 3, max: 20 })) {
            throw ["Username must be between 3 and 20 characters."];
        } else if (!Validate.isLength(password, { min: 8 })) {
            throw ["Password must be over 8 characters in length."];
        }

        await (
            new APIRequest<IUserSelf>(`${API_ENTITY("User")}/register`)
                .Method("POST")
                .AddFields({ username, email, password })
                .Execute()
        );

        await (
            new APIRequest<string>(`${API_ENTITY("User")}/register/sendemail`)
                .Method("POST")
                .AddField("email", email)
                .Execute()
        );

        return true;
    }

    public async Confirm(confirmationKey: string): Promise<true> {
        if (!Validate.isUUID(confirmationKey)) {
            throw ["Invalid confirmation key."];
        }

        let token = await (
            new APIRequest<string>(`${API_ENTITY("User")}/register/confirm`)
                .Method("POST")
                .AddField("confirmationKey", confirmationKey)
                .Execute()
        );
        this.token = confirmationKey;
        return true;
    }

    public async Self(): Promise<IUserSelf | null> {
        if (!this.token) {
            return null;
        }

        return await (
            new APIRequest<IUserSelf>(`${API_ENTITY("User")}/me`)
                .Method("GET")
                .AddHeader("Authorization", `Bearer ${this.token}`)
                .Execute()
        );
    }

    public async UpdateSensitive({ oldPassword, username, password, email }: Partial<IUserSensitiveUpdate>): Promise<true> {
        if (!this.token) {
            throw ["You must be logged in to perform this action."];
        }
        if (!oldPassword) {
            throw ["Old password must be provided."];
        }
        if (username && !Validate.isLength(username, { min: 3, max: 20 })) {
            throw ["New username must be between 3 and 20 characters in length."];
        }
        if (password && !Validate.isLength(password, { min: 8 })) {
            throw ["New password must be at least 8 characters long."]
        }
        if (email && !Validate.isEmail(email)) {
            throw ["New email is invalid."];
        }

        await (
            new APIRequest<string>(`${API_ENTITY("User")}/sensitive`)
                .Method("POST")
                .AddHeader("Authorization", `Bearer ${this.token}`)
                .AddFields({ oldPassword, password, email, username })
                .Execute()
        );

        return true;
    }

    public async UpdateAvatar(id: number): Promise<true> {
        if (!this.token) {
            throw ["You must be logged in to perform this action."];
        }

        await (
            new APIRequest<IUserSelf>(`${API_ENTITY("User")}/basic`)
                .Method("POST")
                .AddHeader("Authorization", `Bearer ${this.token}`)
                .AddField("avatar", id)
                .Execute()
        );

        return true;
    }

    public async ListVariables(): Promise<string[]> {
        if (!this.token)
            return [];

        return (await (
            new APIRequest<string[]>(`${API_ENTITY("Variable")}`)
                .Method("GET")
                .AddHeader("Authorization", `Bearer ${this.token}`)
                .Execute()
        )) || [];
    }

    public async GetVariable(name: string): Promise<string | null> {
        if (!this.token)
            return null;

        return (await (
            new APIRequest<string>(`${API_ENTITY("Variable")}/${name}`)
                .Method("GET")
                .AddHeader("Authorization", `Bearer ${this.token}`)
                .Execute()
        )) || null;
    }

    public async SetVariable(name: string, value: string): Promise<true> {
        if (!this.token)
            throw ["You must be logged in to perform this action."];

        await (
            new APIRequest<string>(`${API_ENTITY("Variable")}/${name}`)
                .Method("POST")
                .AddHeader("Authorization", `Bearer ${this.token}`)
                .SetRawBody(JSON.stringify(value))
                .Execute()
        );

        return true;
    }

    public async DeleteVariable(name: string): Promise<true> {
        if (!this.token)
            throw ["You must be logged in to perform this action."];

        await (
            new APIRequest<string>(`${API_ENTITY("Variable")}/${name}`)
                .Method("DELETE")
                .AddHeader("Authorization", `Bearer ${this.token}`)
                .Execute()
        );

        return true;
    }

    public async Create<T extends IView>(type: EntityType, data: Partial<T>): Promise<T> {
        if (!this.token) {
            throw ["You must be logged in to perform this action."];
        }

        const d = { ...data };
        delete d["id"];

        return (
            await (
                new APIRequest<T>(`${API_ENTITY(type)}`)
                    .Method("POST")
                    .AddHeader("Authorization", `Bearer ${this.token}`)
                    .AddFields(d as Partial<IView>)
                    .Execute()
            )
        )!;
    }

    public async Read<T extends IView>(type: EntityType, query: Partial<ISearchQuery>): Promise<T[]> {
        return (
            await (
                new APIRequest<T[]>(`${API_ENTITY(type)}`)
                    .Method("GET")
                    .AddHeader("Authorization", this.token ? `Bearer ${this.token}` : undefined)
                    .AddFields(query as Dictionary<string | number | (string | number)[]>)
                    .Execute()
            )
        ) || [];
    }

    public async Update<T extends IView>(type: EntityType, data: Partial<T> & { id: number }): Promise<T | null> {
        if (!this.token)
            throw ["You must be logged in to perform this action."];

        return (
            await (
                new APIRequest<T>(`${API_ENTITY(type)}/${data.id}`)
                    .Method("PUT")
                    .AddHeader("Authorization", `Bearer ${this.token}`)
                    .AddFields(data as IView)
                    .Execute()
            )
        );
    }

    public async Delete<T extends IView>(type: EntityType, data: Partial<T> & { id: number }): Promise<T | null> {
        if (!this.token)
            throw ["You must be logged in to perform this action."];

        return (
            await (
                new APIRequest<T>(`${API_ENTITY(type)}/${data.id}`)
                    .Method("DELETE")
                    .AddHeader("Authorization", `Bearer ${this.token}`)
                    .Execute()
            )
        );
    }

    public async Upload(file: Blob): Promise<IFile> {
        if (!this.token)
            throw ["You must be logged in to perform this action."];

        return (
            await (
                new APIRequest<IFile>(`${API_ENTITY("File")}`)
                    .Method("POST")
                    .AddHeader("Authorization", `Bearer ${this.token}`)
                    .AddFormField("file", file)
                    .Execute()
            )
        )!;
    }

    /*public Subscribe<T extends IView>(type: EntityType, query: Partial<ISearchQuery>): Promise<HTTPDriverSubscription<T>>{

    }*/
}

/*export class HTTPDriverSubscription<T> implements ISubscription<T> {

}*/