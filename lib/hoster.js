/// <reference path="../typings/tsd.d.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Q = require('q');
var request = require('request');
var path = require('path');
var url = require('url');
var Hoster = (function () {
    function Hoster(domain, username, password) {
        this.domain = domain;
        this.username = username;
        this.password = password;
        this.clearCookies();
    }
    Hoster.prototype.cookieString = function () {
        return this.jar.getCookieString(this.domain);
    };
    Hoster.prototype.clearCookies = function () {
        this.jar = request.jar();
        this.request = request.defaults({ jar: this.jar });
    };
    Hoster.prototype.getUsername = function () {
        return this.username;
    };
    Hoster.prototype.reconnect = function () {
        if (!this.isReady.isPending()) {
            this.isReady = null;
            this.clearCookies();
            return this.connect();
        }
        return this.isReady;
    };
    return Hoster;
})();
exports.Hoster = Hoster;
var Uptobox = (function (_super) {
    __extends(Uptobox, _super);
    function Uptobox(username, password) {
        _super.call(this, 'https://uptobox.com/', username, password);
    }
    Uptobox.prototype.connect = function () {
        var _this = this;
        if (!this.isReady) {
            var deferred = Q.defer();
            this.isReady = deferred.promise;
            this.request.post('https://login.uptobox.com/logaritme', {
                'form': {
                    'login': this.username,
                    'password': this.password,
                    'op': 'login'
                }
            }, function (err, res, body) {
                if (err)
                    return deferred.reject(err);
                if (_this.cookieString().match(/xfss=/))
                    return deferred.resolve();
                _this.isBanned = true;
                deferred.reject(new Error('login error'));
            });
        }
        return this.isReady;
    };
    Uptobox.prototype.debrid = function (link) {
        var _this = this;
        var deferred = Q.defer();
        var nbRetry = 1;
        var onConnexionReady;
        this.isReady.then(onConnexionReady = function () {
            _this.request.head(link, function (err, _res) {
                var res = _res;
                if (err)
                    return deferred.reject(err);
                if (res.headers['set-cookie']) {
                    if (nbRetry-- > 0)
                        _this.reconnect().then(onConnexionReady, function (err) {
                            deferred.reject(err);
                        });
                    else
                        deferred.reject(new Error('not logged'));
                }
                else if (res.headers['content-type'] !== 'application/octet-stream') {
                    deferred.reject(new Error('bad link'));
                }
                else {
                    var debrid = {
                        'filename': path.basename(url.parse(res.request.href).pathname),
                        'size': parseInt(res.headers['content-length']),
                        'download': res.request.href,
                        'cookies': _this.cookieString()
                    };
                    deferred.resolve(debrid);
                }
            });
        }, function (err) {
            deferred.reject(err);
        });
        return deferred.promise;
    };
    return Uptobox;
})(Hoster);
exports.Uptobox = Uptobox;
//# sourceMappingURL=hoster.js.map