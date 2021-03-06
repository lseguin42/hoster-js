/// <reference path="../typings/index.d.ts" />

import Q       = require('q');
import request = require('request');
import path    = require('path');
import url     = require('url');
import source  = require('vinyl-source-stream');
import through = require('through2');

module hoster {
    /**
     * Interface IDebrid
     */
    export interface IDebrid
    {
        filename: string;
        size:     number;
        download: string;
        cookies:  string;
    }
    
    export interface IDownloadOptions
    {
        vinylMode?: boolean;
    }

    /**
     * @abstract class Hoster
     */
    export abstract class Hoster
    {
        
        username: string;
        password: string;
        jar:      request.CookieJar;
        request:  request.RequestAPI<request.Request, request.CoreOptions, request.UriOptions | request.UrlOptions>;
        isReady:  Q.Promise<void>;
        isBanned: boolean;
        
        constructor(username: string, password: string) {
            this.username = username;
            this.password = password;
            this.clearCookies();
            this.connect();
        }
        
        cookieString() {
            return this.jar.getCookieString(this.domain());
        }
        
        clearCookies() {
            this.jar = request.jar();
            this.request = request.defaults({jar: this.jar});
        }
        
        getUsername() {
            return this.username;
        }

        reconnect() {
            if (!this.isReady.isPending()) {
                this.isReady = null;
                this.clearCookies();
                return this.connect();
            }
            return this.isReady;
        }
        
        supported(link: string) {
            if (!link.match(this.regex()))
                return false;
            return true;
        }
        
        download(link: string, options: IDownloadOptions = { vinylMode: true }): NodeJS.ReadWriteStream {
            var res = (options.vinylMode ? through.obj() : through());
            
            this.info(link).then((data) => {
                var req: NodeJS.ReadWriteStream = <any>this.request(data.download);
                if (options.vinylMode)
                    req = req.pipe(source(data.filename));
                req.pipe(res);
            }, (err) => {
                res.emit('error', err);
            });
            return res;
        }
        
        abstract domain(): string;
        
        abstract regex(): RegExp;
        
        abstract connect(): Q.Promise<void>;
        
        abstract info(link: string): Q.Promise<IDebrid>;

    }

    /**
     * Class Uptobox
     */
    export class Uptobox extends Hoster {

        domain() {
            return 'http://uptobox.com';
        }

        regex() {
            return /^(https?:\/\/)?(www.)?uptobox.com\/[0-9A-Za-z]{3,20}$/;
        }

        connect() {
            if (!this.isReady) {
                var deferred = Q.defer<void>();
                this.isReady = deferred.promise;
                this.request.post('https://login.uptobox.com/logaritme', {
                    'form': {
                        'login': this.username,
                        'password': this.password,
                        'op': 'login'
                    }
                }, (err, res, body) => {
                    if (err)
                        return deferred.reject(err);
                    if (this.cookieString().match(/xfss=/))
                        return deferred.resolve();
                    this.isBanned = true;
                    deferred.reject(new Error('login error'));
                });
            }
            return this.isReady;
        }
        
        info(link: string) {
            var deferred = Q.defer<IDebrid>();
            var nbRetry = 1;
            var onConnexionReady: any;

            this.isReady.then(onConnexionReady = () => {
                this.request.head(link, (err, _res) => {
                    let res: any = _res;
                    if (err)
                        return deferred.reject(err);
                    if (res.headers['set-cookie']) {
                        if (nbRetry-- > 0)
                            this.reconnect().then(onConnexionReady, (err) => {
                                deferred.reject(err);
                            });
                        else
                            deferred.reject(new Error('not logged'));
                    } else if (res.headers['content-type'] !== 'application/octet-stream') {
                        deferred.reject(new Error('bad link'))
                    } else {
                        var debrid = {
                            'filename': path.basename(url.parse(res.request.href).pathname),
                            'size': parseInt(res.headers['content-length']),
                            'download': res.request.href,
                            'cookies': this.cookieString()
                        }
                        deferred.resolve(debrid);
                    }
                })
            }, (err) => {
                deferred.reject(err);
            });
            
            return deferred.promise;
        }
        
    }
    
}

export = hoster;