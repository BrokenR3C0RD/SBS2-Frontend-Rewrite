/*
 * SBS2 Frontend
 * Created on Tue May 05 2020
 *
 * Copyright (c) 2020 MasterR#C0RD
 */

import { Dictionary } from "../interfaces/Generic";

export type EventCallback<T extends any[]> = (...data: T) => unknown;

export abstract class EventEmitter {
    private listeners: Dictionary<(EventCallback<unknown[]> | null)[]> = {};

    protected async _Dispatch<T extends any[] = [any]>(event: string, ...data: T) {
        let listeners = this.listeners[event] || [];
        for (let i = 0; i < listeners.length; i++) {
            try {
                if (listeners[i])
                    await listeners[i]!.apply(listeners[i], data);
            } catch (e) {
                console.error(`Uncaught error on event listener for \`${event}\`: ` + e.stack);
            }
        }
    }

    public On(event: string, callback: EventCallback<any[]>): number {
        this.listeners[event] = [callback as EventCallback<any[]> | null].concat(this.listeners[event] || []);
        return this.listeners[event].length;
    }

    public Off(event: string, id: number) {
        if (this.listeners[event]) {
            this.listeners[event][this.listeners[event].length - id] = null;
        }
    }

    public Once(event: string, callback: EventCallback<unknown[]>) {
        const id = this.On(event, async (...data) => {
            await callback(data);
            return this.Off(event, id);
        });
        return id;
    }

    public ResolveOn<T extends any[]>(event: string): Promise<T> {
        return new Promise((resolve, reject) => {
            this.Once(event, (...data) => {
                resolve.apply(this, data as any);
            })
        });
    }

    public AllOff(event?: string) {
        if (event)
            this.listeners[event] = [];
        else
            this.listeners = {};
    }
}