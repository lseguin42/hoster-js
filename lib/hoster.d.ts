/// <reference path="../typings/tsd.d.ts" />
import Q = require('q');
import request = require('request');
export interface IDebrid {
    filename: string;
    size: number;
    download: string;
    cookies: string;
}
export declare abstract class Hoster {
    domain: string;
    username: string;
    password: string;
    jar: request.CookieJar;
    request: request.RequestAPI<request.Request, request.CoreOptions, request.UriOptions | request.UrlOptions>;
    isReady: Q.Promise<void>;
    isBanned: boolean;
    constructor(domain: string, username: string, password: string);
    cookieString(): string;
    clearCookies(): void;
    getUsername(): string;
    reconnect(): Q.Promise<void>;
    abstract connect(): Q.Promise<void>;
    abstract debrid(link: string): Q.Promise<IDebrid>;
}
export declare class Uptobox extends Hoster {
    constructor(username: string, password: string);
    connect(): Q.Promise<void>;
    debrid(link: string): Q.Promise<IDebrid>;
}
